# Backend content audit — Finance-Management-Service

Run date: 2026-09-16. Scope: `Finance-Management-Service/src/` on `master`. Method: greps + walk of every controller + `constants.ts` + validators. Read-only — no rewrites. Complements [06-content-audit.md](06-content-audit.md); frontend audit already flagged that backend copy leaks to users through `error.response.data.message`, so every string here is user-facing.

## Coverage counts

| Class | Count | Notes |
|---|---|---|
| `ERROR_MESSAGES` entries in `constants.ts` | 9 | Centralised constants |
| `SUCCESS_MESSAGES` entries in `constants.ts` | 6 | Templated by entity |
| `NOTIFICATION_MESSAGES` blocks | 4 | Push copy — very different tone from API responses |
| Inline `response.serverError(res, 'Failed to …')` messages | 20 | The biggest defect category |
| Inline `response.unauthorized(res, 'User not authenticated')` — duplicate of `ERROR_MESSAGES.USER_NOT_AUTHENTICATED` | 3 | Inconsistent use of the constant |
| Inline `response.badRequest(res, '…')` messages | 1 known | `Email is required when joining waitlist without authentication` |
| Inline `response.unauthorized(res, 'Invalid cron secret')` | 2 | test-cron + cron-trigger |
| Auto-generated validation messages via `formatFieldName + 'is required' / 'cannot be negative'` | ~30 fields covered | `validation.ts` |
| OTP helper user-facing messages | 4 | `Invalid or expired OTP`, `Too many attempts. Request a new code.`, `Invalid OTP`, `Failed to send OTP` |
| Auth middleware messages | 4 | `No token provided`, `Invalid token format`, `Invalid or expired token`, `User not found` |
| Rate-limit messages | 2 | Templated: `Please wait before requesting another OTP`, `Too many requests from this IP` |
| Email template body strings | 3 | `Finova AI`, `Segoe UI`, `Courier New` — mostly styling markup |
| Environment-check `throw new Error(...)` messages | 3 | Boot errors — never reach client |
| `console.error(...)` messages | ~30 | Server-side logs only, do NOT leak to responses |

## Findings by category

### 1. Terminology consistency with the frontend table

Frontend audit's proposed term-of-art (§1 of `06-content-audit.md`): `goal` (not target), `available` (not budget/room), `sign in / sign out` (not log in), `contribution`.

Backend adherence:

| Term | Backend copy | FE table says | Verdict |
|---|---|---|---|
| goal | Used throughout (`Goal not found`, `Failed to create goal`) | `goal` | ✅ Consistent |
| target | Not used in user-facing backend copy (only as field name `target_amount`) | `target` avoided | ✅ Consistent |
| contribution | Used throughout | `contribution` | ✅ Consistent |
| sign in / log in | `USER_NEED_SIGNUP: 'User not found. Please sign up.'` — uses "sign up" | FE prefers `sign in / sign out` | ⚠️ `sign up` is a variant; recommend uniform to `sign in / sign up / sign out` on both sides |
| **`USER_ALREADY_EXISTS: 'User already exists. Please login.'`** | Uses **`login`** as a verb | ❌ Frontend uses `Log in` / `Sign in`. Pick one. |
| authentication | `User not authenticated`, `User not authenticated` (×3), `Not authorized to perform this action` | FE has no equivalent phrase | ⚠️ "Not authorized to perform this action" is very server-y; the frontend would render "You can't do that" or similar |
| profile | `Please complete your financial profile before creating goals` | FE never surfaces "financial profile" as a term to users | ⚠️ Backend introduces vocabulary the FE never uses. Recommend `Add your income and expenses before creating goals.` or route the FE to catch this and remap |
| financial profile | `Failed to retrieve financial profile` / `Failed to save financial profile` / `Failed to update financial profile` | FE says "Financial details" | ⚠️ Rename to `financial details` for FE parity |
| account deleted / delete account | `Your account has been deleted. Please contact support or use a different email.` | FE says `Delete account?` and `This is permanent.` | ✅ Consistent |
| waitlist | `You are already on the waitlist for this feature` / `Successfully joined the waitlist` | FE says `Already joined` and `You're on the list` | ⚠️ Slight tone drift (`Already joined` is tighter). Not critical. |

### 2. Vague / non-actionable errors

**20 near-identical `Failed to X` server-error messages** — the backend equivalent of the FE's `Something went wrong` cluster (§2 of `06-content-audit.md`). These are what the FE renders when it falls back to `error.response?.data?.message`.

| File | Message | Endpoint |
|---|---|---|
| goalsController.ts | `Failed to create goal` | POST /api/goals |
| goalsController.ts | `Failed to retrieve goals` | GET /api/goals |
| goalsController.ts | `Failed to retrieve goal` | GET /api/goals/:id |
| goalsController.ts | `Failed to update goal` | PUT /api/goals/:id |
| goalsController.ts | `Failed to delete goal` | DELETE /api/goals/:id |
| goalContributionsController.ts | `Failed to add contribution` | POST /api/contributions |
| goalContributionsController.ts | `Failed to retrieve contributions` | POST /api/contributions/list |
| goalContributionsController.ts | `Failed to delete contribution` | POST /api/contributions/delete |
| goalContributionsController.ts | `Failed to update contribution` | POST /api/contributions/update |
| financialProfileController.ts | `Failed to retrieve financial profile` | GET /api/user/financial-profile |
| financialProfileController.ts | `Failed to update financial profile` | PUT /api/user/financial-profile |
| financialProfileController.ts | `Failed to save financial profile` | POST /api/user/financial-profile |
| notificationController.ts | `Failed to register device token` | POST /api/notifications/register-token |
| notificationController.ts | `Failed to unregister device token` | DELETE /api/notifications/unregister-token |
| notificationController.ts | `Failed to execute notification cron` | POST /api/notifications/test-cron |
| notificationController.ts | `Failed to trigger notification cron` | GET /api/notifications/cron-trigger |
| authController.ts | `Failed to process user authentication` | POST /api/auth/verify-otp |
| insightsController.ts | `Failed to generate insights` | POST /api/insights |
| userController.ts | `Failed to delete account` | POST /api/user/delete |
| waitlistController.ts | `Failed to join waitlist` | POST /api/waitlist/join |

Rule failed: `<What happened>. <How to fix it>.` — every one of these states neither. The FE then wraps this in its own `Error / Something went wrong` toast (also generic) so the user sees **two** layers of no information.

**Root cause**: every controller catches `try { … } catch (error) { console.error('❌ …', error); return response.serverError(res, 'Failed to …'); }`. The underlying error info goes to console (good — not leaked). But the fallback text is uniform "Failed to X" without a next step.

Recommendation (do not implement yet): swap for `<Failed to X>. Try again, or check your connection.` and reserve `Failed to X. Contact support if this keeps happening.` for 5xx server errors that already indicate the server itself is broken.

### 3. Copy that reads AI-generated / clinical / overly technical

3.1 **Timezone error surfaces IANA jargon** ([validation.ts:82](Finance-Management-Service/src/utils/validation.ts:82)):
```
Timezone is required for date validation (IANA format, e.g. Asia/Kolkata)
Invalid timezone: ${string}
```
An end user should never see "IANA format". This is a client-must-send fact — the FE always sends `Intl.DateTimeFormat().resolvedOptions().timeZone` — so the error should be a "we couldn't figure out your timezone, try again" message, not a spec pointer.

3.2 **`Not authorized to perform this action`** ([response.ts:18](Finance-Management-Service/src/utils/response.ts:18)) — reads like a server admin console. `You don't have permission to do that.` or `Not your goal.` (contextualise per endpoint) is more human.

3.3 **`Please complete your financial profile before creating goals`** ([constants.ts:PROFILE_REQUIRED](Finance-Management-Service/src/config/constants.ts)) — three defects:
- Vocabulary drift (§1 — `financial profile` doesn't exist in FE UI)
- Reads as compliance/legalese ("Please complete…")
- Doesn't name what to do (the user is currently _in_ the FE, so "before" is confusing — they didn't set up a profile explicitly, they just skipped onboarding)

3.4 **`Please wait before requesting another OTP` + `${message}. Try again in ${ttl}s`** ([rateLimitMiddleware.ts:15-28](Finance-Management-Service/src/middleware/rateLimitMiddleware.ts)) — the interpolated `Try again in Xs` is fine content-wise but the `s` suffix is server-shorthand. `Try again in X seconds` (or `in a moment` if X < 5) reads better on a phone.

3.5 **Notification push copy is a completely different voice** than the API responses ([constants.ts:NOTIFICATION_MESSAGES](Finance-Management-Service/src/config/constants.ts)):

```
👋 Complete Your Profile
   Set up your profile to unlock personalized financial insights and start your savings journey!

🎯 Set Your First Goal
   You're all set up! Now create your first financial goal and start building your savings habit.

📅 Stay on Track!
   It has been a month since your last contribution to '{goalName}'.
   Keep your savings habit strong!

💰 Time to Contribute!
   You haven't contributed to '{goalName}' this month yet. Keep your streak going!
```

Every `banned-patterns.md` row that fires on the FE audit fires here too:

- **Decorative emoji** (row 11) — 4× (`👋 🎯 📅 💰`). FE's own convention is to use icons via the Icon component, never emojis in text — so shipping emoji push titles violates the app's own established format.
- **Title Case in labels** (row 9) — every title is Title Case (`Complete Your Profile`, `Set Your First Goal`, `Stay on Track!`, `Time to Contribute!`).
- **Generic positive closer** (row 10) — `Keep your savings habit strong!`, `Keep your streak going!`, `unlock personalized financial insights and start your savings journey!`.
- **Inflated significance** (row 1) — `unlock personalized financial insights`, `start your savings journey`.
- **Exclamation marks** (row 10 spirit) — 5 across 4 messages.

None of this passes any of the FE audit's rules. This is the single largest surface where the two products currently sound like different apps.

3.6 **Templated success messages** ([constants.ts:SUCCESS_MESSAGES](Finance-Management-Service/src/config/constants.ts)):
```
CREATED('Goal') → 'Goal created successfully'
RETRIEVED('Goal') → 'Goal retrieved successfully'
UPDATED('Goal') → 'Goal updated successfully'
DELETED('Goal') → 'Goal deleted successfully'
SAVED('Financial profile') → 'Financial profile saved successfully'
```

The word `successfully` is a **filler adverb** (banned-patterns row 5 — filler phrase). The FE's own convention (`toast.success('Saved', { description: 'Goal updated.' })`) uses past-tense results without adverbs. `RETRIEVED('Goals') → 'Goals retrieved successfully'` is especially odd — the frontend never surfaces "retrieved" as a user concept.

3.7 **`Invalid email format`** ([validation.ts:29](Finance-Management-Service/src/utils/validation.ts:29)) — the FE says `Please enter a valid email address.` (Login) and `Enter a valid email` (Signup). Neither uses "format" as a concept. Backend copy should mirror one of them.

### 4. Consequence-naming on destructive endpoints

Backend has three destructive endpoints. All three respond only with success/failure — no confirmation prompt is issued from the backend (that's the FE's job) — so backend copy correctly does not need consequence-naming lines. But the success responses could still name what happened:

| Endpoint | Current | Concern |
|---|---|---|
| POST /api/user/delete | `SUCCESS_MESSAGES.DELETED('Account')` → `Account deleted successfully` | OK. Consider ` — your data will be removed within {N} days` if a retention SLA exists (§6). |
| DELETE /api/goals/:id | `SUCCESS_MESSAGES.DELETED('Goal')` → `Goal deleted successfully` | OK. |
| POST /api/contributions/delete | `SUCCESS_MESSAGES.DELETED('Contribution')` → `Contribution deleted successfully` | OK. |

**No leaked destructive-consequence copy.** The FE audit's §5 already flagged the FE side. Nothing net-new here.

### 5. Errors that leak internal implementation details (SECURITY concern to fix as part of the copy pass)

**Good news**: I did not find any inline `res.json({ error: err.stack })` or `error.name` leaks. Every controller I inspected follows the pattern:
```
catch (error) {
    console.error('❌ Something failed:', error);
    return response.serverError(res, 'Failed to X');
}
```
Errors are logged server-side (`console.error`) but never returned to the client verbatim.

**One low-severity leak**:

5.1 **Timezone validation** ([validation.ts:88](Finance-Management-Service/src/utils/validation.ts:88)):
```ts
return { valid: false, message: `Invalid timezone: ${String(timezone)}` };
```
Echoes back whatever string the client sent as `timezone`. If a curious user or attacker sends `<script>...</script>` or a very long string, it lands in the response body. React Native surfaces this via `toast.error({ description: message })` — RN's `Text` escapes automatically, so it's not an XSS vector, but it does leak "we compute this against your input" and it does allow toast-string injection (harmless on RN but would matter on a web frontend). Fix by echoing a bounded value or nothing.

5.2 **`console.error` emojis** (many files) — every server log line starts with `❌`. This is fine for stdout but if any log-shipper mirrors error strings to the client (I did not find one), the emoji would tag them as coming from console. Flag for review.

5.3 **NOT PRESENT but worth confirming during the fix pass**:
- Express default 404/500 error middleware — the current app has `app.use((_req, res) => response.notFound(res, 'Route not found'))` at the tail ([app.ts:104](Finance-Management-Service/src/app.ts)) so unhandled routes get a clean shape, but there's **no** `app.use((err, req, res, next) => ...)` global error handler. That means any uncaught promise rejection or throw inside a controller returns whatever Express's default `errorhandler` emits — which in dev mode is the stack trace. In production this should be silenced with `NODE_ENV=production`. Verify in the deploy: if `NODE_ENV` is unset or `development`, stack traces will leak on any unexpected throw.

### 6. Legal / compliance-sensitive claims — flag, do not rewrite

6.1  **`ACCOUNT_DELETED`** ([constants.ts:29](Finance-Management-Service/src/config/constants.ts:29)) — `Your account has been deleted. Please contact support or use a different email.` — this is a data-retention adjacent statement. No SLA named ("deleted within N days"). The backend uses `paranoid: true` on the User model (soft delete), meaning the row is retained with `deleted_at` timestamp — **NOT hard-deleted**. If the Privacy screen or Terms promises hard deletion, this is a compliance risk. Flag for legal review, don't touch copy without sign-off.

6.2  **Waitlist join** ([waitlistController.ts:16](Finance-Management-Service/src/controllers/waitlistController.ts:16)) — `Email is required when joining waitlist without authentication` — a data-collection consent context. If the waitlist implies marketing consent, the message should probably reference the Privacy Policy. Legal review.

6.3  **No data-retention SLAs found**. The backend nowhere says "we delete within 30 days" / "we keep this for X years". If the Privacy Screen (FE audit §7.1) makes such a claim, this is a policy/reality mismatch — flag for legal.

6.4  **OTP HMAC error handling** ([otpHelper.ts:113](Finance-Management-Service/src/helpers/otpHelper.ts:113)) — the console log dump on Gmail failure includes `gmailUser: GMAIL_USER ? '***set***' : '***NOT SET***'` etc. — masked correctly. Good practice, not a finding.

### 7. Cross-cutting: constants use vs inline strings

Three controllers **inline** `'User not authenticated'` instead of using `ERROR_MESSAGES.USER_NOT_AUTHENTICATED`:

- notificationController.ts:20 + 79 — 2 sites
- waitlistController.ts:27 — 1 site

Same string, three places, one central constant. A search/replace makes the map single-source. Not urgent, but the FE audit's recommendation of a term table implies the backend should also single-source its dictionary before rewrites.

Similarly, `Invalid cron secret` is duplicated across `notificationController.ts:113` (`/test-cron` after the security fix) and `/cron-trigger`. Not user-facing (needs the operator secret to even reach this), so lower priority.

### 8. Rate-limit / quota / billing

Only two messages exist ([rateLimitMiddleware.ts](Finance-Management-Service/src/middleware/rateLimitMiddleware.ts)):
- `Please wait before requesting another OTP`
- `Too many requests from this IP`

Rendered as: `${message}. Try again in ${ttl}s` — see §3.4. Note the trailing `s` shorthand.

No quota/billing surface exists in this codebase. Nothing to audit.

## Findings-by-file quick index

- [config/constants.ts](Finance-Management-Service/src/config/constants.ts): all `ERROR_MESSAGES` / `SUCCESS_MESSAGES` / `NOTIFICATION_MESSAGES`. §1, §3.5, §3.6, §3.7, §6.1
- [utils/validation.ts](Finance-Management-Service/src/utils/validation.ts): auto-generated `X is required / cannot be negative` messages + timezone error. §3.1, §3.7, §5.1
- [utils/response.ts](Finance-Management-Service/src/utils/response.ts): `Not authorized to perform this action` (§3.2), maps `ERROR_REASONS` to responses
- [middleware/authMiddleware.ts](Finance-Management-Service/src/middleware/authMiddleware.ts): `No token provided`, `Invalid token format`, `Invalid or expired token`, `User not found` — all clear and consistent
- [middleware/rateLimitMiddleware.ts](Finance-Management-Service/src/middleware/rateLimitMiddleware.ts): §3.4, §8
- [helpers/otpHelper.ts](Finance-Management-Service/src/helpers/otpHelper.ts): `Invalid or expired OTP`, `Too many attempts. Request a new code.`, `Invalid OTP`, `Failed to send OTP` — the best-written error copy in the codebase (verb-led, actionable). Exemplar.
- All controllers: 20 `Failed to X` fallback strings (§2), 3 inline `User not authenticated` (§7)

## What this audit deliberately did NOT do

- Rewrite any strings. Read-only per instructions.
- Enumerate every one of the 20 `Failed to X` messages individually as candidates — they're a single class fix.
- Cover strings inside `.md` / swagger `@swagger` doc-comments that render only in the docs UI, unless they'd leak to the app.
- Cover backend `console.log` "positive" logs — those never reach the client.
- Cover business-logic strings inside `SAVINGS_GOALS` / suggestion descriptions in `constants.ts` — these are FE-surfaced ("Build a safety net of 6 months expenses for unexpected situations…") and are part of the FE audit's "Suggested goals" scope, best rewritten with a marketing/onboarding voice pass.

## Recommended next steps (pending review)

1. **Merge the FE + BE term-of-art table** so both codebases share one vocabulary (§1). ~10 words + backend adopts `financial details` instead of `financial profile`, `Log in` instead of `login`.
2. **Rewrite the 20 `Failed to X` server errors** into `<what failed>. <what to do>.` shape, ideally with an HTTP-status branch mirroring what the FE audit recommends for its side.
3. **Overhaul `NOTIFICATION_MESSAGES` push copy** (§3.5). This is the highest-severity single fix — currently reads as marketing spam, and it'll be the first content a user sees from this app after signup.
4. **Rewrite `PROFILE_REQUIRED`** — vocabulary drift (§3.3) plus the "before creating goals" framing.
5. **Fix the timezone error surface** (§3.1). Remove `IANA format`.
6. **De-duplicate `User not authenticated` and `Invalid cron secret`** — mechanical (§7).
7. **Confirm `NODE_ENV=production` on Render** so Express default error handler doesn't leak stack traces (§5.3).
8. **Legal review** the `ACCOUNT_DELETED` message against actual retention practice (§6.1). Soft-delete vs the copy may mismatch.

Stopping here per instructions. Awaiting your review + the merged term-of-art table before any rewrite.
