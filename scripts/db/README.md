# `scripts/db/`

DB operational scripts. Every script here is destructive-if-flagged and safe-by-default (dry-run unless you pass `--commit`).

## `delete_user.py`

Delete a user and every row that FK-references them, in Postgres.

**Why not just `DELETE FROM users WHERE …`?**
- If any dependent table has `ON DELETE RESTRICT` (or `NO ACTION`, the default), the delete errors out and nothing happens. Useful for safety, useless when you *do* want the cascade.
- Even with `ON DELETE CASCADE`, you don't get to preview what would be removed — you find out after.
- New tables/FKs get added over time; hardcoding a list of dependent tables in the script rots. This script discovers them from `information_schema` at run time.

### Usage

```bash
pip install psycopg2-binary                    # one-time
export DATABASE_URL="postgres://user:pw@host:5432/dbname"

# dry run (default) — prints the FK graph, counts, and SQL plan
python3 scripts/db/delete_user.py --email amrit@example.com

# actually delete (asks you to retype the user id)
python3 scripts/db/delete_user.py --email amrit@example.com --commit

# non-interactive (for scripts / CI)
python3 scripts/db/delete_user.py --user-id 42 --commit --yes
```

### Flags

| flag | purpose |
| --- | --- |
| `--email` \| `--user-id` | which user to delete (exactly one required) |
| `--commit` | actually run the deletes (default is dry-run) |
| `--yes` | skip the "retype the id" confirmation prompt when `--commit`ing |
| `--dsn URL` | override `DATABASE_URL` |
| `--users-table` | rename if your users table isn't `users` (default `users`) |
| `--users-pk` | rename if the PK column isn't `id` (default `id`) |

### What it does, in order

1. Resolve the user id from `--email` or `--user-id`.
2. Walk `information_schema.referential_constraints` from `users` outward, BFS-collecting every table that FK-references `users` directly *or* transitively (a table that FKs a table that FKs `users`).
3. Topo-sort those tables so leaves get deleted first.
4. Print per-table row counts filtered to this user.
5. Print the DELETE plan.
6. If `--commit`: prompt for the user id (unless `--yes`), then execute the plan **inside one transaction**. Any error rolls the whole thing back.

### Failure modes

- **Cycle in the FK graph:** Kahn's algo can't order it; the script appends leftover tables at the end. The transaction will error out on the actual delete if there's a real cycle — nothing partial gets committed.
- **Indirect edge without `ON DELETE CASCADE`:** the plan emits a `--` comment naming the parent chain. You may need to add a manual DELETE for that table. Common cases: junction / audit / event-log tables that reference goals, contributions, notifications, etc.
- **Wrong `--users-table` / `--users-pk`:** either the user-lookup fails cleanly, or FK discovery finds no dependents (safe — script just deletes the users row).

### Expected FK graph for Finova (best guess from the app's API surface)

Based on endpoints the app hits, the real dependent tables are probably:

```
users
  ├─ financial_profiles   (1-to-1)
  ├─ goals                (1-to-many)
  │     └─ contributions        (1-to-many)  ← indirect via goals
  ├─ fcm_tokens / notification_tokens
  ├─ waitlist_entries     (AI Coach waitlist)
  └─ insights             (cached AI insights, may or may not exist)
```

Run the dry-run once; the output tells you which of these actually exist in your schema.
