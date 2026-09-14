#!/usr/bin/env python3
"""
Delete a user from Supabase — auth account, profile row, AND every FK-linked
dependent row across the public schema.

Two authentication paths (pick one; the flags decide):

    1. --service-key mode (recommended for prod):
       Uses the Supabase Admin API to delete auth.users. This properly
       revokes sessions and refresh tokens, and cascades through Supabase's
       internal tables (auth.identities, auth.sessions, auth.refresh_tokens).
       Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.

    2. --db-only mode:
       Direct Postgres connection as the service role user. Deletes from
       auth.users via SQL (relies on the FK CASCADE from public.users to
       auth.users.id that Supabase creates by default). No JWT revocation —
       existing sessions may keep working until they expire (usually 1 hour).
       Requires DATABASE_URL env var (Supabase → Project Settings → Database
       → Connection string → URI, using the service_role password).

Both modes use direct Postgres for the FK-discovery walk of the public
schema (goals, contributions, etc.), because the Admin API doesn't do that.

Safe by design:
  * Discovers dependent tables from information_schema (both public AND
    auth schemas) — not hardcoded.
  * Dry-run is the default. Nothing is touched unless you pass --commit.
  * Prints the FK graph, per-table row counts, and the full plan first.
  * Wraps public-schema deletes in one transaction.

Usage:
    # Admin API path (recommended):
    export SUPABASE_URL="https://xxxx.supabase.co"
    export SUPABASE_SERVICE_ROLE_KEY="eyJ..."      # NOT the anon key
    export DATABASE_URL="postgres://postgres.xxxx:PW@aws-0-region.pooler.supabase.com:6543/postgres"
    python3 scripts/db/delete_user_supabase.py --email amrit@example.com --service-key
    # add --commit to run for real
    python3 scripts/db/delete_user_supabase.py --email amrit@example.com --service-key --commit

    # DB-only path:
    python3 scripts/db/delete_user_supabase.py --email amrit@example.com --db-only --commit

Requires: psycopg2-binary, requests   (pip install psycopg2-binary requests)
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

try:
    import requests
except ImportError:
    sys.exit("requests is required — install with:  pip install requests")


AUTH_USERS = ("auth", "users")
PUBLIC_USERS = ("public", "users")


def parse_args():
    p = argparse.ArgumentParser(description="Delete a Supabase user + every dependent row.")
    ident = p.add_mutually_exclusive_group(required=True)
    ident.add_argument("--email", help="User's email (exact match in auth.users).")
    ident.add_argument("--user-id", help="User's auth.users UUID.")

    path = p.add_mutually_exclusive_group(required=True)
    path.add_argument("--service-key", action="store_true",
                      help="Use Supabase Admin API to delete auth.users (revokes sessions).")
    path.add_argument("--db-only", action="store_true",
                      help="Use direct Postgres for auth.users delete (no session revocation).")

    p.add_argument("--commit", action="store_true",
                   help="Actually run the deletes. Without this, script does dry run.")
    p.add_argument("--yes", action="store_true",
                   help="Skip the interactive confirmation prompt on --commit.")
    p.add_argument("--supabase-url", default=os.environ.get("SUPABASE_URL"),
                   help="Supabase project URL (default: SUPABASE_URL env var).")
    p.add_argument("--service-role-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"),
                   help="Supabase service_role key (default: SUPABASE_SERVICE_ROLE_KEY env var).")
    p.add_argument("--dsn", default=os.environ.get("DATABASE_URL"),
                   help="Postgres DSN for public-schema cleanup (default: DATABASE_URL env var).")
    return p.parse_args()


def resolve_auth_user(cur, email: str | None, user_id: str | None) -> tuple[str, str]:
    """Return (user_uuid, email)."""
    if user_id is not None:
        cur.execute('SELECT id::text AS id, email FROM auth.users WHERE id = %s', (user_id,))
    else:
        cur.execute('SELECT id::text AS id, email FROM auth.users WHERE email = %s', (email,))
    rows = cur.fetchall()
    if not rows:
        sys.exit(f"No auth.users row for {'id=' + user_id if user_id else 'email=' + email}")
    if len(rows) > 1:
        sys.exit(f"Ambiguous — {len(rows)} auth.users rows matched.")
    return rows[0]["id"], rows[0]["email"]


def discover_public_fk_chain(cur) -> dict[str, list[dict]]:
    """
    Return { table_name: [ {column, ref_table, ref_column, on_delete}, ... ] }
    for every public-schema table that (transitively) references either
    auth.users or public.users.
    """
    cur.execute("""
        SELECT
          tc.table_schema            AS table_schema,
          tc.table_name              AS table_name,
          kcu.column_name            AS column_name,
          ccu.table_schema           AS ref_schema,
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

    referencing: dict[str, list[dict]] = defaultdict(list)
    for fk in fks:
        referencing[fk["table_name"]].append({
            "column": fk["column_name"],
            "ref_schema": fk["ref_schema"],
            "ref_table": fk["ref_table"],
            "ref_column": fk["ref_column"],
            "on_delete": fk["on_delete"],
        })

    # BFS outward from both auth.users AND public.users
    depends_on = set()
    queue = deque([("auth", "users"), ("public", "users")])
    seen = set()
    while queue:
        parent_schema, parent = queue.popleft()
        if (parent_schema, parent) in seen:
            continue
        seen.add((parent_schema, parent))
        for child, edges in referencing.items():
            if any(e["ref_schema"] == parent_schema and e["ref_table"] == parent for e in edges):
                key = ("public", child)
                if key not in depends_on and child not in ("users",):
                    depends_on.add(key)
                    queue.append(key)

    return {t: referencing[t] for (_, t) in depends_on}


def topo_sort(dep_graph: dict[str, list[dict]]) -> list[str]:
    """Kahn — leaves first."""
    incoming = {t: 0 for t in dep_graph}
    for t, edges in dep_graph.items():
        for e in edges:
            ref = e["ref_table"]
            if ref in incoming and ref != t:
                incoming[ref] += 1
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
    order.extend(remaining)
    return order


def count_dependents(cur, user_uuid: str, order: list[str],
                     dep_graph: dict[str, list[dict]]) -> list[tuple]:
    result = []
    for t in order:
        edges = dep_graph[t]
        direct = [e for e in edges if e["ref_table"] == "users"]
        if direct:
            col = direct[0]["column"]
            sql = f'SELECT COUNT(*) FROM public."{t}" WHERE {col} = %s'
            cur.execute(sql, (user_uuid,))
            n = cur.fetchone()["count"]
            result.append((t, f"{col} = <user>", n))
        else:
            cur.execute(f'SELECT COUNT(*) FROM public."{t}"')
            result.append((t, "indirect (via parent chain)", cur.fetchone()["count"]))
    return result


def build_public_plan(user_uuid: str, order: list[str],
                      dep_graph: dict[str, list[dict]]) -> list[str]:
    stmts: list[str] = []
    for t in order:
        edges = dep_graph[t]
        direct = [e for e in edges if e["ref_table"] == "users"]
        if direct:
            col = direct[0]["column"]
            stmts.append(f"DELETE FROM public.\"{t}\" WHERE {col} = '{user_uuid}';")
        else:
            parent = edges[0]["ref_table"]
            stmts.append(
                f'-- {t} indirectly references users via {parent}. Expected to cascade\n'
                f'-- via {parent} deletion. If ON DELETE is not CASCADE, add manually:\n'
                f'-- DELETE FROM public."{t}" WHERE {edges[0]["column"]} IN (SELECT id FROM public."{parent}" ...);'
            )
    return stmts


def delete_auth_via_admin_api(user_uuid: str, args) -> None:
    if not args.supabase_url:
        sys.exit("--service-key mode needs SUPABASE_URL")
    if not args.service_role_key:
        sys.exit("--service-key mode needs SUPABASE_SERVICE_ROLE_KEY (the service_role, NOT anon, key)")
    url = f"{args.supabase_url.rstrip('/')}/auth/v1/admin/users/{user_uuid}"
    headers = {
        "apikey": args.service_role_key,
        "Authorization": f"Bearer {args.service_role_key}",
    }
    r = requests.delete(url, headers=headers, timeout=30)
    if r.status_code >= 300:
        sys.exit(f"Admin API delete failed: {r.status_code} {r.text}")
    print(f"  Admin API: deleted auth.users id={user_uuid}")


def main():
    args = parse_args()
    if not args.dsn:
        sys.exit("No DSN — set DATABASE_URL or pass --dsn.")

    conn = psycopg2.connect(args.dsn)
    conn.autocommit = False
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            user_uuid, email = resolve_auth_user(cur, args.email, args.user_id)
            print(f"\nResolved user: id={user_uuid}, email={email}\n")

            dep_graph = discover_public_fk_chain(cur)
            order = topo_sort(dep_graph)

            if not dep_graph:
                print("No public-schema tables reference users.\n")
            else:
                print("Dependent public tables (delete order — leaves first):")
                counts = count_dependents(cur, user_uuid, order, dep_graph)
                width = max((len(t) for t, *_ in counts), default=0)
                for t, how, n in counts:
                    print(f"  public.{t.ljust(width)}  {how.ljust(30)}  rows: {n}")
                print()

            public_plan = build_public_plan(user_uuid, order, dep_graph)
            auth_plan = (
                f"Admin API DELETE {args.supabase_url}/auth/v1/admin/users/{user_uuid}"
                if args.service_key
                else f"DELETE FROM auth.users WHERE id = '{user_uuid}';"
            )

            print("Public-schema plan:")
            for s in public_plan:
                print(f"  {s}")
            print(f"\nAuth deletion: {auth_plan}\n")

            if not args.commit:
                print("Dry run — nothing deleted. Re-run with --commit to execute.")
                conn.rollback()
                return

            if not args.yes:
                confirm = input(f"Type the email ({email}) to confirm delete: ").strip()
                if confirm != email:
                    print("Aborted — email mismatch.")
                    conn.rollback()
                    return

            # 1. Public schema deletes in one transaction.
            for s in public_plan:
                if s.lstrip().startswith("--"):
                    continue
                print(f"  → {s}")
                cur.execute(s)
            conn.commit()
            print("Public-schema rows committed.")

            # 2. Auth deletion (after public commit — so a failure here doesn't
            #    leave an orphaned auth account referencing missing public rows).
            if args.service_key:
                delete_auth_via_admin_api(user_uuid, args)
            else:
                with conn.cursor() as c2:
                    c2.execute("DELETE FROM auth.users WHERE id = %s", (user_uuid,))
                    conn.commit()
                    print(f"  DB: deleted auth.users id={user_uuid}")

            print(f"\nDone. User {email} and dependent rows removed.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
