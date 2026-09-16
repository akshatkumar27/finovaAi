# 07 — Decisions

> **Status:** LOCKED — 2026-09-16  
> **Owner:** Amritanshu  
> **Inputs:** [06-content-audit.md](06-content-audit.md), [06b-backend-content-audit.md](06b-backend-content-audit.md), [06c-formatting-audit.md](06c-formatting-audit.md)  
> **Purpose:** Source of truth every fix pass references. No rewrite lands without a line in this doc.

---

## §1 — Term-of-art table

One vocabulary for both frontend and backend. Every user-facing string must use these terms.

| Concept | Canonical term | Rejected alternatives | Notes |
|---|---|---|---|
| The savings object | **goal** | target, fund | Seed-goal titles keep "Fund" suffix (e.g. "Emergency Fund") — these are marketing labels, not the object noun |
| The money field on a goal | **goal amount** | target amount | |
| Money left to allocate | **available** | budget, room in your budget | |
| Auth verbs | **sign in / sign out / sign up** | log in, log out, login, logout | |
| Monthly payment toward a goal | **contribution** | payment, deposit | |
| The onboarding data set | **financial details** | financial profile, setup | DB field `isFinancialProfilePresent` stays as-is — only user-facing strings change |
| Compact AI label | **AI coach** (sentence case) | AI Coach (Title Case) | |

---

## §2 — Error message shape

Every user-facing error follows this two-sentence pattern:

```
<What happened>. <What to do>.
```

- **Operational errors** (validator failed, DB write failed, service returned a known bad state): specific message naming the action that failed.
- **Unexpected throws** (pure catch-all, unknown cause): fallback pair — `Something went wrong. Try again, or contact support if this keeps happening.`

Never surface internal identifiers, stack traces, or IANA format references.

---

## §3 — Error message rewrites

### ERROR_MESSAGES (constants.ts)

| Key | Before | After |
|---|---|---|
| `USER_NOT_AUTHENTICATED` | `User not authenticated` | `User not authenticated` (no change — internal, auth middleware handles display) |
| `NOT_FOUND` | `${entity} not found` | `${entity} not found.` (add period) |
| `ALREADY_CONTRIBUTED` | `You have already contributed to this goal this month. You can update your existing contribution instead.` | `Already contributed this month. Update your existing contribution instead.` |
| `EXCEEDS_MONTHLY_LIMIT` | `Contribution amount cannot exceed the monthly goal contribution of ₹${limit}` | `Contribution exceeds the monthly limit of ₹${limit}.` |
| `PROFILE_REQUIRED` | `Please complete your financial profile before creating goals` | `Add your income and expenses first.` |
| `ACCOUNT_DELETED` | `Your account has been deleted. Please contact support or use a different email.` | **NO CHANGE — §8 legal item** |
| `USER_ALREADY_EXISTS` | `User already exists. Please login.` | `Account already exists. Sign in instead.` |
| `USER_NEED_SIGNUP` | `User not found. Please sign up.` | `User not found. Please sign up.` (no change — already uses "sign up") |
| `WAITLIST_ALREADY_JOINED` | `You are already on the waitlist for this feature` | `Already on the waitlist.` |

### SUCCESS_MESSAGES (constants.ts)

Drop "successfully" everywhere. Past-tense result only.

| Key | Before | After |
|---|---|---|
| `CREATED` | `${entity} created successfully` | `${entity} saved.` |
| `RETRIEVED` | `${entity} retrieved successfully` | `${entity} loaded.` |
| `UPDATED` | `${entity} updated successfully` | `${entity} updated.` |
| `DELETED` | `${entity} deleted successfully` | `${entity} deleted.` |
| `SAVED` | `${entity} saved successfully` | `${entity} saved.` |
| `WAITLIST_JOINED` | `Successfully joined the waitlist` | `Joined the waitlist.` |

### Inline success strings in controllers

| File | Before | After |
|---|---|---|
| authController.ts | `OTP sent successfully` | `OTP sent.` |
| authController.ts | `Registration successful` | `Signed up.` |
| authController.ts | `Login successful` | `Signed in.` |
| authController.ts | `User profile retrieved` | `Profile loaded.` |
| authController.ts | `Logged out successfully` | `Signed out.` |
| notificationController.ts | `Device token registered successfully` | `Device registered.` |
| notificationController.ts | `Device token unregistered successfully` | `Device unregistered.` |
| notificationController.ts | `Notification cron triggered in background` | `Notifications triggered.` |
| notificationController.ts | `Notification cron job executed successfully` | `Notifications sent.` |
| insightsController.ts | `Insights generated successfully` | `Insights loaded.` |

### 20 catch-block `Failed to X` messages

| Controller | Current | Rewrite | Type |
|---|---|---|---|
| goalsController.ts | `Failed to create goal` | `Could not save your goal. Try again.` | Operational |
| goalsController.ts | `Failed to retrieve goals` | Fallback pair | Unexpected |
| goalsController.ts | `Failed to retrieve goal` | Fallback pair | Unexpected |
| goalsController.ts | `Failed to update goal` | `Could not update your goal. Try again.` | Operational |
| goalsController.ts | `Failed to delete goal` | `Could not delete your goal. Try again.` | Operational |
| goalContributionsController.ts | `Failed to add contribution` | `Could not save your contribution. Try again.` | Operational |
| goalContributionsController.ts | `Failed to retrieve contributions` | Fallback pair | Unexpected |
| goalContributionsController.ts | `Failed to delete contribution` | `Could not delete your contribution. Try again.` | Operational |
| goalContributionsController.ts | `Failed to update contribution` | `Could not update your contribution. Try again.` | Operational |
| financialProfileController.ts | `Failed to retrieve financial profile` | Fallback pair | Unexpected |
| financialProfileController.ts | `Failed to update financial profile` | `Could not update your financial details. Try again.` | Operational |
| financialProfileController.ts | `Failed to save financial profile` | `Could not save your financial details. Try again.` | Operational |
| notificationController.ts | `Failed to register device token` | Fallback pair | Unexpected |
| notificationController.ts | `Failed to unregister device token` | Fallback pair | Unexpected |
| notificationController.ts | `Failed to execute notification cron` | Fallback pair | Unexpected |
| notificationController.ts | `Failed to trigger notification cron` | Fallback pair | Unexpected |
| authController.ts | `Failed to process user authentication` | Fallback pair | Unexpected |
| insightsController.ts | `Failed to generate insights` | Fallback pair | Unexpected |
| userController.ts | `Failed to delete account` | `Could not delete your account. Try again, or contact support.` | Operational |
| waitlistController.ts | `Failed to join waitlist` | `Could not join the waitlist. Try again.` | Operational |

Fallback pair = `Something went wrong. Try again, or contact support if this keeps happening.`

### §3.1 — Specific fixes

| Location | Before | After | Why |
|---|---|---|---|
| constants.ts `PROFILE_REQUIRED` | `Please complete your financial profile before creating goals` | `Add your income and expenses first.` | Vocabulary drift (§1), compliance tone, doesn't name action |
| response.ts `handleHelperError` | `Not authorized to perform this action` | `You don't have permission to do that.` | Server-admin tone → human |
| validation.ts:85 | `Timezone is required for date validation (IANA format, e.g. Asia/Kolkata)` | `Timezone is required.` | Drop IANA jargon |
| validation.ts:92 | `` `Invalid timezone: ${String(timezone)}` `` | `Could not detect your timezone. Try again.` | Drop echoed input (§7.1 security) |
| constants.ts `USER_ALREADY_EXISTS` | `User already exists. Please login.` | `Account already exists. Sign in instead.` | "login" → "sign in" (§1) |

---

## §4 — Destructive-action copy

Rules for destructive flows (FE owns the confirmation modal; BE owns the success/failure response):

1. Modal must name the consequence and state reversibility.
2. Confirm button uses the verb, not "OK" or "Yes".
3. Sign-out modal: plain button, not destructive red — sign-out isn't data loss.

---

## §5 — Notification push messages

Rewritten to match the app's drier voice. Rules: no emoji, sentence case, no exclamation marks, no marketing closers.

| Key | Before title | After title | Before body | After body |
|---|---|---|---|---|
| `NOT_ONBOARDED` | `👋 Complete Your Profile` | `Finish setting up` | `Set up your profile to unlock personalized financial insights and start your savings journey!` | `Add your income and expenses to get goal suggestions.` |
| `NO_GOALS` | `🎯 Set Your First Goal` | `Create your first goal` | `You're all set up! Now create your first financial goal and start building your savings habit.` | `Your financial details are saved. Pick a goal to start saving toward.` |
| `MISSED_CONTRIBUTION` | `📅 Stay on Track!` | `Contribution missed` | `It has been a month since your last contribution to '{goalName}'. Keep your savings habit strong!` | `No contribution to '{goalName}' last month.` |
| `MONTHLY_REMINDER` | `💰 Time to Contribute!` | `Monthly contribution due` | `You haven't contributed to '{goalName}' this month yet. Keep your streak going!` | `You haven't contributed to '{goalName}' this month.` |

---

## §6 — Formatting decisions

| Decision | Choice | Rationale |
|---|---|---|
| Compact currency threshold | Full number under 1,000; K/L/Cr above | Indian users think in thousands, lakhs, crores — not millions |
| Compact suffixes | `K` (1,000+), `L` (1,00,000+), `Cr` (1,00,00,000+) | Uppercase, Indian convention |
| Case of suffix | Uppercase (`K`, `L`, `Cr`) | Consistent, avoids `k` vs `K` drift |
| `formatMoneyWithPaise` | **Deferred** | No decimal-rupee surface exists today; add when needed |
| `/mo` vs `/month` | `/mo` | Tighter, consistent with AddGoal + GoalSelection |
| Indian numbering | Always `en-IN` — never bare `.toLocaleString()` | Removes device-locale trap |

---

## §7 — Security fixes (content-adjacent)

### §7.1 — Timezone echo

**Before:** `Invalid timezone: ${String(timezone)}` — echoes arbitrary user input back in the response body.

**After:** `Could not detect your timezone. Try again.` — no echo.

### §7.2 — Confirm NODE_ENV=production on Render

Not a string change. Verify in deploy config that `NODE_ENV=production` so Express default error handler doesn't leak stack traces. Out of scope for the content pass but flagged here.

---

## §8 — Legal-sensitive strings — DO NOT TOUCH

These strings make claims that require legal review before any copy change:

| String | Location | Concern |
|---|---|---|
| `ACCOUNT_DELETED: 'Your account has been deleted. Please contact support or use a different email.'` | constants.ts | Soft-delete vs copy may mismatch. Data-retention adjacent. |
| Privacy screen SECTIONS (4 blocks) | PrivacySecurityScreen.tsx | "We never sell your data", AES-256 claims, GDPR reference, data rights |
| HelpSupport FAQ 4 answer | HelpSupportScreen.tsx | "bank-grade AES-256", "never share without explicit consent" |
| Waitlist email collection | waitlistController.ts | Data-collection consent context |
| WhatsApp/Email SLA claims | HelpSupportScreen.tsx | "~4 hour reply", "~1 day reply" — aspirational? |

**Rule:** No developer touches these without explicit legal sign-off.

---

## §9 — Phase plan

### Phase 1 — Backend content fixes (this pass)
1. Rewrite 20 `Failed to X` server-error messages per §3
2. Rewrite SUCCESS_MESSAGES per §3
3. Fix PROFILE_REQUIRED, "Not authorized", timezone, USER_ALREADY_EXISTS per §3.1
4. De-duplicate 3 inline "User not authenticated" strings
5. Rewrite NOTIFICATION_MESSAGES per §5
6. Rename "financial profile" → "financial details" in user-facing strings per §1

### Phase 2 — Frontend content fixes
1. Rewrite 13 generic `Error / Something went wrong` toasts per 06-content-audit §2
2. Strip 8 em dashes per 06-content-audit §3.1
3. Fix `Invalid Email` title case + align error descriptions
4. Align terminology per §1 (target → goal amount, budget → available, log in → sign in)
5. Rewrite onboarding helper copy per 06-content-audit §6
6. Delete-account rewrite (**blocked by §10 item 6 — soft-delete decision**)

### Phase 3 — Formatter consolidation
1. Consolidate to one `formatMoney` helper per 06c-formatting-audit §1
2. Adopt `en-IN` everywhere
3. Add `Cr` (crore) to compact scale
4. Fix `new Date('YYYY-MM-DD')` UTC-parse bug (06c §3.5)
5. Write `pluralize` helper
6. Standardize date format

---

## §10 — Decision log

| # | Decision | Options considered | Chosen | Date | Status |
|---|---|---|---|---|---|
| 1 | Suggested-goal seed names | (a) Drop "Fund" suffix, (b) Keep "Fund" suffix | **(b) Keep "Fund" suffix** — "Emergency Goal" reads worse than "Emergency Fund"; these are marketing labels, not the object noun | 2026-09-16 | ✅ Resolved |
| 2 | Sign-out modal button style | (a) Destructive red button, (b) Plain button | **(b) Plain button** — sign-out isn't data loss, red overstates the consequence | 2026-09-16 | ✅ Resolved |
| 3 | Notification push drafts | (a) Keep current marketing-warm copy, (b) Use drier versions from §5 | **(b) Drier versions** — matches the app's established voice, removes banned-pattern violations (emoji, Title Case, exclamation marks, marketing closers) | 2026-09-16 | ✅ Resolved |
| 4 | Compact currency threshold | (a) Always compact, (b) Full under 1,000 / K/L/Cr above, (c) Full under 1,00,000 | **(b) Full under 1,000; K/L/Cr above** — balances readability with space constraints on mobile | 2026-09-16 | ✅ Resolved |
| 5 | `formatMoneyWithPaise` | (a) Implement now, (b) Defer | **(b) Defer** — no decimal-rupee surface exists today | 2026-09-16 | ✅ Resolved |
| 6 | Soft-delete vs hard-delete for account deletion | (a) Hard-delete (match copy), (b) Keep soft-delete (update copy), (c) Keep soft-delete + add retention SLA to copy | **Open — legal decision** | — | ⚠️ Open |

> **Item 6 note:** This blocks the **Phase 2 delete-account rewrite** specifically (the FE confirmation modal copy depends on whether we promise hard deletion or name a retention window). It does **not** block the rest of Phase 2 or any of Phase 1/Phase 3. The current `ACCOUNT_DELETED` message in constants.ts is untouched until legal signs off.
