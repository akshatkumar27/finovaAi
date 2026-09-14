# `scripts/db/`

DB operational scripts. Every script here is destructive-if-flagged and safe-by-default (dry-run unless you pass `--commit`).

## `delete_user.py`

Delete a user and every row that FK-references them, in **generic Postgres** (self-hosted, RDS, Neon, Fly, Render, etc.).

- Uses `information_schema` at run time to discover the FK graph — no hardcoded table list.
- Dry-run default; `--commit` runs and prompts for the user id to confirm.
- Wraps the plan in one transaction.
- Handles indirect FK edges by naming the parent chain.

**Usage:**
```bash
pip install psycopg2-binary
export DATABASE_URL="postgres://user:pw@host:5432/dbname"
python3 scripts/db/delete_user.py --email amrit@example.com               # dry run
python3 scripts/db/delete_user.py --email amrit@example.com --commit      # do it
```

## `delete_user_supabase.py`

Same idea, but **Supabase-aware**. Supabase splits users across two schemas:
- `auth.users` — managed by Supabase Auth (has passwords, session tokens, JWT claims)
- `public.users` — your app profile row (often FK'd to `auth.users.id` with ON DELETE CASCADE)

Deleting from `public.users` alone leaves the auth account intact — the user can still log in with their credentials even though their profile is gone. This script deletes from **both**.

**Two auth-side paths — pick one:**

### 1. Admin API mode (recommended for prod)
Uses the Supabase Admin API to delete `auth.users`. Properly revokes sessions and refresh tokens, and cascades through `auth.identities` / `auth.sessions` / `auth.refresh_tokens`.

```bash
pip install psycopg2-binary requests
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # NOT the anon key — must be service_role
export DATABASE_URL="postgres://postgres.xxxx:PW@aws-0-region.pooler.supabase.com:6543/postgres"
python3 scripts/db/delete_user_supabase.py --email amrit@example.com --service-key
python3 scripts/db/delete_user_supabase.py --email amrit@example.com --service-key --commit
```

### 2. DB-only mode
Direct Postgres `DELETE FROM auth.users`. **No JWT revocation** — existing sessions may keep working until their JWT expires (usually 1 hour on Supabase). Fine for scrubbing test accounts or cleanup after the user has already been logged out.

```bash
export DATABASE_URL="postgres://postgres.xxxx:PW@aws-0-region.pooler.supabase.com:6543/postgres"
python3 scripts/db/delete_user_supabase.py --email amrit@example.com --db-only --commit
```

### What both modes always do
- Walk the `public` schema's FK graph from BOTH `auth.users` and `public.users` outward (Supabase apps often FK directly from a table to `auth.users(id)`, skipping `public.users` — the script handles both patterns).
- Print per-table row counts filtered to this user before touching anything.
- Ask you to retype the user's email to confirm on `--commit`.
- Run the public-schema deletes inside one transaction; commit that BEFORE the auth delete so a failure there doesn't leave orphaned auth referring to missing public rows.

### Where to find the credentials in Supabase
- **`SUPABASE_URL`:** Project Settings → General → Project URL.
- **`SUPABASE_SERVICE_ROLE_KEY`:** Project Settings → API → Project API Keys → `service_role` (secret — never ship this to a client).
- **`DATABASE_URL`:** Project Settings → Database → Connection string → **URI** tab. Use the **Session pooler** URI on port 6543 for scripts (or the direct one on 5432 if the pooler is disabled). The password is the DB password you set at project creation.

### Failure modes worth knowing

- **Admin API returns 404 on delete:** the user id is wrong or already deleted. Re-check with a dry run.
- **`user_id` foreign key violation on some public table:** the script's FK-discovery missed an indirect edge without ON DELETE CASCADE. Read the error's table name, add a manual `DELETE FROM that_table WHERE …` before the `auth.users` delete, and rerun.
- **RLS blocks the DELETE:** if your DB user isn't `postgres` / service_role, Row-Level Security policies may block. Use the connection string with the service_role password, or run as `postgres`.
- **Session pooler timeout:** Supabase's pooler kills long transactions. If the DELETE plan is large, connect via port 5432 instead (direct connection).

### Non-goals
- Doesn't hit your app's `/api/user/delete` endpoint — no server-side side effects (email notifications, external service cleanup, S3 object deletion, Stripe subscription cancellation) will fire. Prefer the API endpoint if the app has those. Use this script for infra scrubbing, GDPR takedowns, or clearing test accounts.
- Doesn't back up user data before deleting. If you need a copy, `pg_dump` the relevant rows first.

## Expected FK graph for Finova (from the app's API surface)

```
auth.users
  └─ public.users             (Supabase's default 1-to-1 CASCADE)
        ├─ public.financial_profiles
        ├─ public.goals
        │    └─ public.contributions      (indirect via goals)
        ├─ public.fcm_tokens
        ├─ public.waitlist_entries
        └─ public.insights                (if implemented)
```

Run the dry run once; the output tells you which of these actually exist and which have ON DELETE CASCADE set. The script names any indirect edges lacking cascade so you can add a manual DELETE.
