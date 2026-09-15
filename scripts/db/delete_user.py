#!/usr/bin/env python3
"""
Delete a user and every row that references them, in Postgres.

Safe by design:
  * Runs inside one transaction — either every dependent row is deleted or none is.
  * Discovers dependent tables from information_schema (FK graph) rather than
    hardcoding table names — so the script works even if the schema evolves.
  * Dry-run is the default. Nothing is deleted unless you pass --commit.
  * Prints the FK graph and per-table row counts BEFORE deleting.

Usage:
    export DATABASE_URL="postgres://user:pw@host:5432/dbname"
    # Dry run — shows what would be deleted:
    python3 scripts/db/delete_user.py --email amrit@example.com
    # Actually delete:
    python3 scripts/db/delete_user.py --email amrit@example.com --commit
    # By id:
    python3 scripts/db/delete_user.py --user-id 42 --commit

Requires: psycopg2-binary  (pip install psycopg2-binary)
"""
from __future__ import annotations

import argparse
import os
import sys
from collections import defaultdict, deque

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    sys.exit("psycopg2 is required — install with:  pip install psycopg2-binary")


USERS_TABLE = "users"          # override with --users-table if your schema differs
USERS_PK = "id"                # override with --users-pk if your PK column differs


def parse_args():
    p = argparse.ArgumentParser(description="Delete a user + every dependent row.")
    ident = p.add_mutually_exclusive_group(required=True)
    ident.add_argument("--email", help="User's email (exact match).")
    ident.add_argument("--user-id", type=int, help="User's primary-key value.")
    p.add_argument("--users-table", default=USERS_TABLE,
                   help=f"Users table name (default: {USERS_TABLE}).")
    p.add_argument("--users-pk", default=USERS_PK,
                   help=f"Users PK column (default: {USERS_PK}).")
    p.add_argument("--commit", action="store_true",
                   help="Actually run the deletes. Without this, script does dry run.")
    p.add_argument("--yes", action="store_true",
                   help="Skip the interactive confirmation prompt on --commit.")
    p.add_argument("--dsn", default=os.environ.get("DATABASE_URL"),
                   help="Postgres DSN (default: DATABASE_URL env var).")
    return p.parse_args()


def find_user_id(cur, users_table: str, users_pk: str, email: str | None,
                 user_id: int | None) -> int:
    if user_id is not None:
        cur.execute(f'SELECT {users_pk} FROM "{users_table}" WHERE {users_pk} = %s',
                    (user_id,))
    else:
        cur.execute(f'SELECT {users_pk} FROM "{users_table}" WHERE email = %s',
                    (email,))
    rows = cur.fetchall()
    if not rows:
        sys.exit(f"No user found for {'id=' + str(user_id) if user_id else 'email=' + email}")
    if len(rows) > 1:
        sys.exit(f"Ambiguous — {len(rows)} rows matched.")
    return rows[0][users_pk] if isinstance(rows[0], dict) else rows[0][0]


def discover_fk_graph(cur, users_table: str) -> dict[str, list[dict]]:
    """
    For every FK that (transitively) points at `users_table`, return
    { referencing_table: [{column, ref_table, ref_column, on_delete}, ...] }
    ordered so that leaves (no incoming FKs from the returned set) come first
    when the caller iterates the returned dict's keys after topological sort.
    """
    cur.execute("""
        SELECT
          tc.table_name              AS table_name,
          kcu.column_name            AS column_name,
          ccu.table_name             AS ref_table,
          ccu.column_name            AS ref_column,
          rc.delete_rule             AS on_delete
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema    = tc.table_schema
        JOIN information_schema.referential_constraints rc
          ON rc.constraint_name = tc.constraint_name
         AND rc.constraint_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema    = 'public'
    """)
    fks = cur.fetchall()

    # Adjacency: dependent_table -> list of FKs (each pointing at some parent_table)
    referencing: dict[str, list[dict]] = defaultdict(list)
    for fk in fks:
        referencing[fk["table_name"]].append({
            "column": fk["column_name"],
            "ref_table": fk["ref_table"],
            "ref_column": fk["ref_column"],
            "on_delete": fk["on_delete"],
        })

    # BFS from users_table outward: which tables transitively depend on users?
    dependent_tables: set[str] = set()
    queue = deque([users_table])
    seen = set()
    while queue:
        parent = queue.popleft()
        if parent in seen:
            continue
        seen.add(parent)
        for child, edges in referencing.items():
            if any(e["ref_table"] == parent for e in edges):
                if child not in dependent_tables and child != users_table:
                    dependent_tables.add(child)
                    queue.append(child)

    # Restrict edge map to just those tables
    return {t: referencing[t] for t in dependent_tables}


def topo_sort_delete_order(dep_graph: dict[str, list[dict]]) -> list[str]:
    """
    Return tables in the order they should be deleted from — leaves first,
    tables with no incoming FK from the dependent set at the front.
    """
    # For topological order, we count incoming refs (FROM another dependent).
    incoming = {t: 0 for t in dep_graph}
    for t, edges in dep_graph.items():
        for e in edges:
            if e["ref_table"] in incoming and e["ref_table"] != t:
                incoming[e["ref_table"]] += 1
    # Kahn's algorithm
    order: list[str] = []
    frontier = deque([t for t, n in incoming.items() if n == 0])
    while frontier:
        t = frontier.popleft()
        order.append(t)
        for other, edges in dep_graph.items():
            if other == t:
                continue
            for e in edges:
                if e["ref_table"] == t:
                    incoming[other] -= 1
                    if incoming[other] == 0 and other not in order:
                        frontier.append(other)
    remaining = [t for t in dep_graph if t not in order]
    if remaining:
        # Cycles or orphans — append at the end; Postgres will error out safely inside the tx.
        order.extend(remaining)
    return order


def count_dependents(cur, users_pk_value: int, tables_order: list[str],
                     dep_graph: dict[str, list[dict]], users_table: str
                     ) -> list[tuple[str, str, int]]:
    """Return [(table, join_sql, count), ...] for reporting."""
    result = []
    for t in tables_order:
        edges = dep_graph[t]
        # Direct edge to users?
        direct = [e for e in edges if e["ref_table"] == users_table]
        if direct:
            col = direct[0]["column"]
            sql = f'SELECT COUNT(*) FROM "{t}" WHERE {col} = %s'
            cur.execute(sql, (users_pk_value,))
            n = cur.fetchone()["count"]
            result.append((t, f"{col} = <user>", n))
        else:
            # Indirect — best-effort: count all rows (upper bound). Real filtering happens
            # per-parent-chain at delete time via joined subselect. We just print a hint.
            cur.execute(f'SELECT COUNT(*) FROM "{t}"')
            total = cur.fetchone()["count"]
            result.append((t, "indirect (via parent chain)", total))
    return result


def build_delete_plan(users_pk_value: int, tables_order: list[str],
                      dep_graph: dict[str, list[dict]], users_table: str,
                      users_pk: str) -> list[str]:
    """Return SQL statements in deletion order (leaves first, users last)."""
    stmts: list[str] = []
    for t in tables_order:
        edges = dep_graph[t]
        direct = [e for e in edges if e["ref_table"] == users_table]
        if direct:
            col = direct[0]["column"]
            stmts.append(f'DELETE FROM "{t}" WHERE {col} = {users_pk_value};')
        else:
            # Indirect — join through a parent that ultimately references users_table.
            # Rely on ON DELETE CASCADE if the FK sets it, else emit an EXISTS chain.
            parent = edges[0]["ref_table"]
            parent_col = edges[0]["column"]
            parent_ref_col = edges[0]["ref_column"]
            # Walk to users through parent(s) with a WITH RECURSIVE fall-through.
            # Simpler: rely on ON DELETE CASCADE. Emit an INFO comment if not set.
            stmts.append(
                f'-- {t} indirectly references {users_table} via {parent}.{parent_col};\n'
                f'-- expected to cascade via {parent} deletion. If ON DELETE is not\n'
                f'-- CASCADE, add: DELETE FROM "{t}" WHERE {parent_col} IN '
                f'(SELECT {parent_ref_col} FROM "{parent}" WHERE ...);'
            )
    stmts.append(f'DELETE FROM "{users_table}" WHERE {users_pk} = {users_pk_value};')
    return stmts


def main():
    args = parse_args()
    if not args.dsn:
        sys.exit("No DSN — set DATABASE_URL or pass --dsn.")

    conn = psycopg2.connect(args.dsn)
    conn.autocommit = False
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            user_pk_value = find_user_id(cur, args.users_table, args.users_pk,
                                         args.email, args.user_id)
            print(f"\nResolved user: {args.users_table}.{args.users_pk} = {user_pk_value}\n")

            dep_graph = discover_fk_graph(cur, args.users_table)
            if not dep_graph:
                print(f"No tables reference {args.users_table} directly or transitively.")
            order = topo_sort_delete_order(dep_graph)

            print(f"Dependent tables (delete order — leaves first):")
            counts = count_dependents(cur, user_pk_value, order, dep_graph, args.users_table)
            width = max((len(t) for t, *_ in counts), default=0)
            for t, how, n in counts:
                print(f"  {t.ljust(width)}  {how.ljust(30)}  rows: {n}")
            print()

            plan = build_delete_plan(user_pk_value, order, dep_graph,
                                     args.users_table, args.users_pk)
            print("SQL plan:")
            for s in plan:
                print(f"  {s}")
            print()

            if not args.commit:
                print("Dry run — nothing deleted. Re-run with --commit to execute.")
                conn.rollback()
                return

            if not args.yes:
                confirm = input(f"Type the user id ({user_pk_value}) to confirm: ").strip()
                if confirm != str(user_pk_value):
                    print("Aborted — id mismatch.")
                    conn.rollback()
                    return

            # Execute plan
            for s in plan:
                if s.lstrip().startswith("--"):
                    continue
                print(f"  → {s}")
                cur.execute(s)
            conn.commit()
            print(f"\nCommitted. User {user_pk_value} and dependent rows removed.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
