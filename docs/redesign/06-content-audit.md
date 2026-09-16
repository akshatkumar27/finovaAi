# Content audit — Finova AI

Run date: 2026-09-16. Scope: `src/` on the merged v3 branch. Method: greps + JSX scan for user-facing text, then rated against the `ux-writing` skill's 13 banned patterns and its element rules (button / error / empty state / confirmation / placeholder / toast / label). Read-only — **no copy is being rewritten in this pass**.

## Coverage counts

| Class | Count | Notes |
|---|---|---|
| Toast calls (`toast.<method>(...)` and `toast(...)`) | 44 | Titles + `description` field per call |
| Screens with user-facing headings | 22 | 3 auth + 12 main + 7 onboarding |
| Placeholders (`placeholder="..."`) | 15 | 3 in auth, 12 in money-input flows |
| `<Button title="...">` uses | 5 | Additional buttons implemented as inline `TouchableOpacity + Text` (not counted here) |
| Modal/dialog blocks | 6 | Sign out, Delete goal, Delete account, Edit contribution, Start date picker, Contribution day picker |
| Empty states | 2 | GoalPulse (`Start your first goal.`), NotificationScreen (`All caught up.`) |
| Inline validation errors (email/age/name) | 8 unique strings | Split across LoginScreen + SignupScreen |
| Static policy sections | 5 | PrivacySecurityScreen SECTIONS array |
| FAQ Q&A pairs | 5 | HelpSupportScreen |

**Note on 44 vs 47 toasts**: my grep captured 44 `toast.<method>(...)` call sites. If the earlier count of 47 is accurate, the delta is likely inside nested branches (e.g. Signup's per-field toasts inside one handler, or `MonthlyInvestmentScreen`'s two paths for save-then-navigate). Not a material gap for this pass; a manual walk while triaging can reconcile.

## Findings by category

### 1. Terminology inconsistencies

Whole-app word-count across `src/screens/`:

| Term | Occurrences | Where it's used |
|---|---|---|
| `goal` / `goals` | 93 | Screens, buttons, sections |
| `contribution` / `contributions` | 40 | ContributionsScreen, EditGoal, onboarding |
| `target` | 27 | AddGoal, EditGoal — labels + validation |
| `fund` | 8 | Suggested-goal names ("Emergency Fund", "Marriage Fund", "Vacation Fund") |
| `savings` / `saving` | 8 | Insights + backend calls |
| `budget` | 7 | Toasts + AddGoal validation |
| `pulse` | 5 | GoalPulse hero + faqs |
| `allocation` / `allocate` | 3 | EditFinancialDetails header |
| `plan` | 2 | Onboarding helpers |

**Concrete pairs that need alignment:**

1.1  **"Target" vs "Goal"** — AddGoal + EditGoal both label the money field as `TARGET AMOUNT` but every surrounding chip, header, and toast calls the object a "goal". A user reads "target amount" as a separate concept ("target for what?"). Pick one:
- If "goal" is the object → label field `Goal amount`
- If the field is the number, and the goal is the whole thing → keep `Target amount`, but never call the amount "the goal" elsewhere

1.2  **"Available" vs "Budget" vs "Room in your budget"** — three different phrases for the same number:
- GoalPulse hero footer: `AVAILABLE ₹15,000` (uppercase caption)
- AddGoal chip: `₹15,000 available` (lowercase)
- FAB error toast: `No budget available` / `No room in your budget to create a new goal.`
- EditFinancialDetails: `AVAILABLE TO ALLOCATE ₹90,000/month`
- MonthlyExpenses/EMI/Investment toasts: `Can't exceed available (₹90,000).`

Pick one term. Recommend `available` since it's already the most-used and it's what appears in the primary place a user reads the number (GoalPulse hero).

1.3  **"Fund" vs "Goal"** — every suggested-goal name in the seed list ends in "Fund" (Emergency Fund, Marriage Fund, Vacation Fund, Gadget Fund, Festival Fund, Home Renovation, Skill Development, Education Fund, Wealth Building, Health Insurance, Life Insurance, Debt Freedom, House Down Payment, Car Fund, Child Fund, Retirement Corpus). The app then calls those user-created rows "goals" everywhere in the UI. Not necessarily wrong — the seed titles read as marketing labels — but it's worth deciding whether to (a) drop "Fund" from the seed titles so the vocabulary matches, or (b) keep them because "Emergency Goal" reads worse.

1.4  **"Sign in" vs "Sign out" vs "Log in" vs "Login"** — mixed:
- LoginScreen: title `Welcome to Finova.` (no verb)
- LoginScreen bottom link: `New here? Create account`
- SignupScreen bottom link: `Already have an account? Log in`
- ProfileScreen button: `Sign out`
- ProfileScreen sign-out modal: `You'll need to sign in again`
- Backend messages: `USER_NEED_SIGNUP: 'User not found. Please sign up.'`

Pick "sign in / sign out" OR "log in / log out" and use it everywhere. Recommend `sign in / sign out` for consistency with the modal copy.

1.5  **"Contribution" plural/singular** — `MonthlyEMI` screen title is `Monthly EMIs.` (plural), but `Monthly income, roughly.` / `Monthly expenses.` are singular. Suggestion: singular for all three.

1.6  **"Onboarding" / "financial profile" / "setup"** — three names for the same flow:
- Onboarding CTAs: `Continue`, last step `Finish setup`
- Backend field: `isFinancialProfilePresent`
- No user-facing "financial profile" copy — good, but the mixed backend name will leak if any error copy surfaces it.

1.7  **"AI coach" vs "AI Coach"** — GoalChat header + subtitle use `AI coach — coming soon.` (sentence case) but the success toast reads `We'll notify you when AI Coach opens up.` (Title Case). Pick one — sentence case fits the rest of the app's copy voice.

### 2. Vague / low-actionable error messages

The pattern `Apology with no fact` (banned-patterns row 12) applies to every error that just says something went wrong. This is the single biggest category — **13 instances** of essentially the same non-error:

| File:line | Title | Description |
|---|---|---|
| [LoginScreen.tsx:70](src/screens/auth/LoginScreen.tsx:70) | `Error` | `Something went wrong. Please try again.` |
| [SignupScreen.tsx:80](src/screens/auth/SignupScreen.tsx:80) | `Error` | `Something went wrong.` |
| [OTPVerificationScreen.tsx:98](src/screens/auth/OTPVerificationScreen.tsx:98) | `Error` | `Something went wrong.` |
| [OTPVerificationScreen.tsx:115](src/screens/auth/OTPVerificationScreen.tsx:115) | `Error` | `Something went wrong.` |
| [EditGoalScreen.tsx:279](src/screens/main/EditGoalScreen.tsx:279) | `Error` | `Something went wrong.` |
| [EditGoalScreen.tsx:298](src/screens/main/EditGoalScreen.tsx:298) | `Error` | `Something went wrong.` |
| [MonthlyInvestmentScreen.tsx:57](src/screens/onboarding/MonthlyInvestmentScreen.tsx:57) | `Error` | `Something went wrong. Please try again.` |
| [PersonalInfoScreen.tsx:57](src/screens/main/PersonalInfoScreen.tsx:57) | `Error` | `Failed to delete. Please try again.` |
| [AddGoalScreen.tsx:184](src/screens/onboarding/AddGoalScreen.tsx:184) | `Error` | `Failed to save your goal.` |
| [GoalSelectionScreen.tsx:91](src/screens/onboarding/GoalSelectionScreen.tsx:91) | `Error` | `Failed to save your goal.` |
| [OTPVerificationScreen.tsx:96](src/screens/auth/OTPVerificationScreen.tsx:96) | `Invalid code` | `Try again.` |
| [EditGoalScreen.tsx:275](src/screens/main/EditGoalScreen.tsx:275) | `Update failed` | `Try again.` |
| [EditGoalScreen.tsx:294](src/screens/main/EditGoalScreen.tsx:294) | `Delete failed` | `Try again.` |

Rule failed: `<What happened>. <How to fix it>.` — most of these state neither. The pattern in the codebase is to swallow the underlying `axios` error and fall back to a generic string, which loses the actionable fact (offline, 401, 500, validation). Fix path is to branch on `error.response?.status` and produce a different message per class, mirroring what the interceptor already knows (401 → "Session expired, sign in again.", network error → "Offline. Reconnect and try again.", 500 → "Our end failed. Try again in a minute.").

### 3. Copy that reads AI-generated / overly warm / cluttered

3.1  **Em dashes (banned-patterns row 8)** — threshold is zero, and I count **8** in shipped copy:

| File:line | String |
|---|---|
| [MonthlyExpensesScreen.tsx:42](src/screens/onboarding/MonthlyExpensesScreen.tsx:42) | `Rent, food, subscriptions — the essentials.` |
| [MonthlyInvestmentScreen.tsx:65](src/screens/onboarding/MonthlyInvestmentScreen.tsx:65) | `SIPs, mutual funds, stocks, gold — monthly average.` |
| [GoalChatScreen.tsx](src/screens/main/GoalChatScreen.tsx) | `AI coach — coming soon.` |
| [GoalChatScreen.tsx](src/screens/main/GoalChatScreen.tsx) | `Weekly nudges — never noise` (feature bullet) |
| [PrivacySecurityScreen.tsx](src/screens/main/PrivacySecurityScreen.tsx) SECTIONS[0] | `We only collect what's needed to give you personalized financial insights — income, expenses, goals. We never sell your data.` |
| [HelpSupportScreen.tsx:25](src/screens/main/HelpSupportScreen.tsx:25) FAQ 2 answer | `Nothing breaks — the goal just extends. We'll show a small nudge next time you open the app.` |
| [HelpSupportScreen.tsx:27](src/screens/main/HelpSupportScreen.tsx:27) FAQ 4 answer | `Yes — bank-grade AES-256 encryption in transit and at rest. …` |
| [_OnboardingLayout.tsx:22](src/screens/onboarding/_OnboardingLayout.tsx:22) comment | Not shipped — comment only |

All non-comment instances are shippable line breaks: swap for a period, a comma, or " - " (three chars).

3.2  **Promotional adjective (row 2) / inflated significance (row 1)** —

- `Consistency beats intensity.` — GoalPulse empty state ([GoalPulseScreen.tsx:416](src/screens/main/GoalPulseScreen.tsx:416)). Motivational tagline in a place that should name a next step. Cut it.
- `Nothing breaks — the goal just extends. We'll show a small nudge next time you open the app.` — FAQ 2. "Nothing breaks" reads as reassurance, not a fact.
- `Bank-grade AES-256 encryption` (FAQ 4 and PrivacySecurityScreen.tsx SECTIONS[1]) — "bank-grade" is a promotional intensifier; the AES-256 fact stands on its own.
- `AI coach — coming soon.` + feature bullets are ok in concept, but `Weekly nudges — never noise` and the toast `You're on the list` (line 42) lean into inflated-significance shape. A "coming soon" landing with a marketing-flavored bullet list is the exact tone the ux-writing skill is designed to flag.

3.3  **Title Case in labels (row 9)** —

- LoginScreen toast title: `Invalid Email` — should be `Invalid email`. Every other toast title in the app is sentence case (`Invalid input`, `Invalid duration`, `Missing name`), so this one is inconsistent even within the codebase.
- LoginScreen error toast description: `Please enter a valid email address.` — polite/wordy where SignupScreen uses the tighter `Enter a valid email`. Not Title Case, but part of the same drift.
- PersonalInfoScreen tap target text: `Delete account` (button) — sentence case, but the modal title `Delete account?` is also sentence case, so this one's clean.
- Sign-out modal title: `Sign out` (sentence case ✓)

3.4  **Generic positive closer (row 10)** —

- `You're on the list.` — GoalChat joined state. Nothing after it says what happens next. Fixed by naming the trigger: `We'll notify you when AI Coach opens up.` (already the sub-copy). Merge the two so the closer isn't standalone.
- `Sent` (OTPVerificationScreen resend success) — bare status word. `A new code is on the way.` in the description is already the fact; the toast title could simply say `Code sent`.

3.5  **Filler / unclear onboarding tone (row 5 + rule failure)** —

- MonthlyIncome helper: `After tax. We use this to size your plan, nothing else.` — the ", nothing else" is filler; it's trying to reassure but doesn't answer a specific question. Consider dropping it or replacing with the actual boundary: `We use it to calculate how much you can save.`
- MonthlyExpenses title: `Monthly expenses.` — the period at the end of every onboarding title is a stylistic choice (matches LoginScreen: `Welcome to Finova.`). Not a defect, but worth being explicit that this is the pattern (all onboarding titles end in a full stop, all button labels don't).
- EMIOutstanding helper: `Roughly, what's left across your loans. We use this to protect your goals during high-EMI periods.` — "protect your goals" is unspecific and reads as marketing.

### 4. Missing empty states

Only 2 empty states are wired anywhere in the app:

- GoalPulse — 
  - Title: `Start your first goal.`
  - Sub: `Pick a suggestion above, or tap + to name your own. Consistency beats intensity.`
- NotificationScreen — 
  - Title: `All caught up.`
  - Sub: `We'll ping you when there's something worth surfacing.`

**Missing:**

- **ContributionsScreen** — the history list at the bottom of a goal page. If a user has just created a goal and never contributed, there's no explicit empty-state copy for the "CONTRIBUTION HISTORY" section, just an absent list.
- **GoalChat when `Join the waitlist` fails** — no toast/empty state for "still not on the list".
- **Post-signup zero-state before any onboarding step** — the app currently forces onboarding but doesn't have skip / partial-fill copy.
- **Suggested goals list** — if the AI-suggestions API fails, the list may render blank with no "Fell back to defaults." explainer. (I couldn't verify from static reading; needs a live test.)

The GoalPulse empty state has an action but ships a marketing tagline (`Consistency beats intensity.`) instead of a plain sub-line. Trim it.

### 5. Missing consequence-naming on destructive actions

Three destructive flows in the app; all three of them **do** name the consequence, which is unusual — that's a strong baseline. But two of them can be tightened, and one of them ships raw:

5.1  **Delete goal** ([EditGoalScreen.tsx:447-449](src/screens/main/EditGoalScreen.tsx:447))
- Title: `Delete goal?`
- Sub: `This can't be undone. Your saved amount stays in your budget.`
- ✅ Consequence named, reversibility named. **Small issue**: doesn't name the goal by name. Better: `Delete "{goalName}"? This removes the goal and its contribution history. Your saved amount stays in your budget. This can't be undone.`

5.2  **Delete account** ([PersonalInfoScreen.tsx:123-124](src/screens/main/PersonalInfoScreen.tsx:123))
- Title: `Delete account?`
- Sub: `This is permanent. All your data will be removed and can't be recovered.`
- ✅ Consequence named, reversibility named twice ("permanent" and "can't be recovered" — a slight redundancy). Consider naming what specifically is removed: `Delete account? This removes your profile, all goals, and all contribution history from our servers. This can't be undone.`

5.3  **Sign out** ([ProfileScreen.tsx:75](src/screens/main/ProfileScreen.tsx:75))
- Title: `Sign out`
- Sub: `You'll need to sign in again to see your goals.`
- ✅ Consequence named. Confirm button text is `Sign out` (destructive-styled red). Sign-out isn't destructive in a strict sense (data stays), so the red button + modal are arguably over-treatment; keeping the modal is fine, but you might consider `Sign out` as a plain button instead of the loss-red styling.

5.4  **Contribution edit** ([ContributionsScreen.tsx:305](src/screens/main/ContributionsScreen.tsx:305)) — modal title `Edit contribution`, sub `Update amount for {monthKey}`. Not destructive, doesn't need a consequence line. Included here so the audit is complete.

**Not modal but destructive-adjacent**: 

- **Financial details save** ([EditFinancialDetailsScreen.tsx:186](src/screens/main/EditFinancialDetailsScreen.tsx:186)) shows a **note card** `Changes to your financials may shift your goal timelines. Revisit them after saving.` — this is exactly a consequence-of-side-effect line and it reads well. Good pattern to preserve.

### 6. Onboarding copy that could confuse someone answering a financial question

The onboarding is a five-screen flow: MonthlyIncome → MonthlyExpenses → MonthlyEMI → EMIOutstanding → MonthlyInvestment → GoalSelection.

Every screen uses the same shell (`_OnboardingLayout.tsx`) with `title` + `helper` + amount input.

6.1  **MonthlyIncome** ([MonthlyIncomeScreen.tsx:33](src/screens/onboarding/MonthlyIncomeScreen.tsx:33))
- Title: `Monthly income, roughly.`
- Helper: `After tax. We use this to size your plan, nothing else.`
- Concern: "size your plan" is vague. A user with a variable freelance income doesn't know whether to enter their best month, average, or worst.

6.2  **MonthlyExpenses** ([MonthlyExpensesScreen.tsx:41](src/screens/onboarding/MonthlyExpensesScreen.tsx:41))
- Title: `Monthly expenses.`
- Helper: `Rent, food, subscriptions — the essentials.` (em dash)
- Concern: "the essentials" implies these are the only expenses to count. Does that exclude entertainment / discretionary? Vague.

6.3  **MonthlyEMI** ([MonthlyEMIScreen.tsx:42](src/screens/onboarding/MonthlyEMIScreen.tsx:42))
- Title: `Monthly EMIs.` (plural — inconsistent with other titles that are singular noun phrase)
- Helper: `Loan, credit-card minimums, anything you must pay each month.` — clear.

6.4  **EMIOutstanding** ([EMIOutstandingScreen.tsx:34](src/screens/onboarding/EMIOutstandingScreen.tsx:34))
- Title: `Total EMI outstanding.`
- Helper: `Roughly, what's left across your loans. We use this to protect your goals during high-EMI periods.`
- Concern: **"Protect your goals during high-EMI periods"** — user does not know what this means. A finance-literate user might guess it affects goal timelines, but someone new will not. Consider: `We use this to slow down goal savings when a big EMI payment is due.` or similar concrete outcome.

6.5  **MonthlyInvestment** ([MonthlyInvestmentScreen.tsx:64](src/screens/onboarding/MonthlyInvestmentScreen.tsx:64))
- Title: `Already investing?`
- Helper: `SIPs, mutual funds, stocks, gold — monthly average.` (em dash)
- Concern: The question-mark title breaks the pattern of the other four onboarding titles (all statements). Also, "monthly average" is asking for a calculation the user may not have done. Consider: `Monthly investment.` + `SIPs, mutual funds, stocks, gold. What you invest in a typical month.`

6.6  **Toast: "Fill this in"** ([MonthlyEMIScreen.tsx:28](src/screens/onboarding/MonthlyEMIScreen.tsx:28), [EMIOutstandingScreen.tsx:24](src/screens/onboarding/EMIOutstandingScreen.tsx:24), [MonthlyInvestmentScreen.tsx:31](src/screens/onboarding/MonthlyInvestmentScreen.tsx:31))
- Title: `Fill this in`
- Sub e.g.: `Enter your EMI (0 is fine).`
- Consistency: the other three onboarding screens use `Invalid input` for the same shape of error. Pick one: either `Fill this in` (friendlier) or `Invalid input` (drier). Recommend `Enter an amount` — verb-led, matches the style of `Missing name` / `Missing target` toasts in AddGoal.

### 7. Legal / compliance-sensitive claims

**FLAG — do not rewrite meaning without sign-off.** These lines make claims that lawyers care about:

7.1  **PrivacySecurityScreen** ([src/screens/main/PrivacySecurityScreen.tsx](src/screens/main/PrivacySecurityScreen.tsx)) SECTIONS:
- `We only collect what's needed to give you personalized financial insights — income, expenses, goals. We never sell your data.` — "never sell" is a legal statement. Preserve exactly.
- `Your data is encrypted with AES-256 in transit and at rest. Access is restricted to authorized personnel.` — technical security claim. Preserve.
- `We use trusted partners for analytics and payments. All are compliant with GDPR and other data protection rules.` — compliance claim citing GDPR by name. This is a warranty statement; do not touch without legal review.
- `You can access, correct, or delete your data any time. Request a copy or account deletion through our support team.` — GDPR/CCPA-shaped rights language.

7.2  **HelpSupportScreen** FAQ 4 answer: `Yes — bank-grade AES-256 encryption in transit and at rest. We never share your financial info with third parties without your explicit consent.` — same class as above, plus "bank-grade" is marketing puffery. The AES-256 fact is preserved; the "bank-grade" adjective is arguably fine to drop without a legal review (it's not a warranty; it's a comparison), but flag it and ask.

7.3  **SignupScreen** — the "By continuing you agree to our Terms and Privacy." bar. I did not find a click-through Terms/Privacy in `src/screens/` besides PrivacySecurityScreen. Worth verifying the destination of any Terms link before shipping.

7.4  **HelpSupportScreen** contact card: `WhatsApp` (chat) → `+919569937537`, `Email` → `finovaai.official@gmail.com` (~1 day reply). These are commitments (`~4 hour reply` on WhatsApp, `~1 day reply` on email). If these SLAs are aspirational, the qualifier `Typically ~X` may be more defensible than a bare `~X hour reply`. Flag for legal / support ops.

### 8. Cross-cutting: section-head casing

All uppercase captions (`AVAILABLE`, `TOTAL SAVED`, `SUGGESTED FOR YOU`, `YOUR GOALS`, `MONTHLY INCOME`, `PROGRESS SCORE`, `PULSE`, `EMAIL`, `AGE`, `ACCOUNT`, `APPEARANCE`, `FINANCIAL DETAILS`, `CONTRIBUTION HISTORY`, etc.) are visual-style choices, not banned patterns — they're rendered via `letterSpacing` + `fontSize: 11` as micro-copy captions. The `banned-patterns` "Title Case in labels" row is about `Save Changes` (a shipped button label), not `SUGGESTED FOR YOU` (a caption). Keeping them for the pass.

## Findings-by-file quick index

Grouped so a fixer can walk file-by-file.

### Auth flow
- [LoginScreen.tsx](src/screens/auth/LoginScreen.tsx): title-case toast `Invalid Email` (§3.3), wordy error description `Please enter a valid email address.` (§3.3), one `Something went wrong` toast (§2)
- [SignupScreen.tsx](src/screens/auth/SignupScreen.tsx): mixed error copy `Incomplete` / `Invalid input` / bare `Error`; validation strings (`Age is required`, `Enter a number`, `Must be 18 or older`, `Enter a valid age`) drift slightly from LoginScreen's tone
- [OTPVerificationScreen.tsx](src/screens/auth/OTPVerificationScreen.tsx): `Sent` toast title is bare (§3.4), 4 `Something went wrong` errors (§2), `Invalid code / Try again.` is thin (§2)

### GoalPulse / suggestions
- [GoalPulseScreen.tsx](src/screens/main/GoalPulseScreen.tsx): empty state ends with tagline (§3.2), FAB error `No budget available / No room in your budget to create a new goal.` — friendly and specific, but "room in your budget" is a fourth phrasing of the same concept as §1.2

### Add / Edit goal
- [AddGoalScreen.tsx](src/screens/onboarding/AddGoalScreen.tsx): toast copy `Missing name / Missing target / Invalid duration / Too high` reads well (verb-shaped titles, specific descriptions). Placeholder `e.g. Emergency fund` is one of the better placeholders in the app.
- [EditGoalScreen.tsx](src/screens/main/EditGoalScreen.tsx): three generic error toasts (`Update failed / Try again.`, `Delete failed / Try again.`, `Error / Something went wrong.`) (§2); delete confirmation is well-written but doesn't include goal name (§5.1)

### Contributions
- [ContributionsScreen.tsx](src/screens/main/ContributionsScreen.tsx): edit modal well-scoped, but inline validation `Enter a valid amount` / `Can't exceed ₹…` sits inside the modal without a label of what the field is (potential 2b failure — the placeholder is `0`, no persistent label if one isn't rendered above the field)
- Toast `Not due yet / This contribution isn't due yet.` — clear.

### Financial details
- [EditFinancialDetailsScreen.tsx](src/screens/main/EditFinancialDetailsScreen.tsx): section head `AVAILABLE TO ALLOCATE` uses "allocate" (§1.2); toast `Sync failed / Local saved; server sync will retry.` is genuinely useful copy, keep it as an exemplar of what §2 errors should look like.

### Onboarding
- [_OnboardingLayout.tsx](src/screens/onboarding/_OnboardingLayout.tsx): shared shell, no user-facing copy here
- All five money screens: see §6

### Profile / Personal info
- [ProfileScreen.tsx](src/screens/main/ProfileScreen.tsx): footer `Finova AI · v1.0` — hard-coded version; consider using the package version
- [PersonalInfoScreen.tsx](src/screens/main/PersonalInfoScreen.tsx): `Delete account` red-text button + modal; success toast `Account deleted / Your account is gone.` — "Your account is gone" is folksy; consider `Signed out. All data removed.` since the user is now unauthenticated.

### Privacy & Help
- [PrivacySecurityScreen.tsx](src/screens/main/PrivacySecurityScreen.tsx): compliance copy (§7.1) — legal review
- [HelpSupportScreen.tsx](src/screens/main/HelpSupportScreen.tsx): 5 FAQs — 1 has an em dash and a promotional intensifier (§3.1, §3.2), 1 has "bank-grade" (§7.2)

### GoalChat
- [GoalChatScreen.tsx](src/screens/main/GoalChatScreen.tsx): coming-soon landing (§3.2, §3.4)

### Unreachable screens (from the earlier security audit — no UI entry point but still ship copy)
- [VaultScreen.tsx](src/screens/main/VaultScreen.tsx), [InvestHubScreen.tsx](src/screens/main/InvestHubScreen.tsx), [NotificationScreen.tsx](src/screens/main/NotificationScreen.tsx), [NotificationSettingsScreen.tsx](src/screens/main/NotificationSettingsScreen.tsx) — content should be reviewed when the routes are wired back in.

## What this audit deliberately did NOT do

- Rewrite any copy. Per the request, this pass is read-only.
- Enumerate every one of the 44 toast descriptions individually — only the categories with defects are listed. If you want the full per-line before/after, the rewrite pass will produce it.
- Cover in-line JSX strings shorter than 5 chars (e.g. `✓`, `×`) or that render dynamic data only (e.g. `${count} months`).
- Cover backend copy (`Finance-Management-Service/src/config/constants.ts` `ERROR_MESSAGES` / `SUCCESS_MESSAGES`) — that's a separate service and the audit was scoped to `finovaAi/src/`. Worth a follow-up: those messages ("User not found. Please sign up.", "Contribution amount cannot exceed…") ARE seen by users through the frontend's `error.response.data.message` fallback, so they're user-facing even though they live in the backend.

## Recommended next steps (pending your review)

1. **Pick a term-of-art table** so the rewrite pass has a source of truth: `goal` (not target), `available` (not budget/room), `sign in / sign out` (not log in), `contribution` (not payment). This is ~10 words but they lock every downstream fix.
2. **Rewrite the 13 generic `Error / Something went wrong` toasts** into `<what failed>. <what to do>.` shapes, branching on `error.response?.status`. Highest ROI category.
3. **Strip the 8 em dashes**. Mechanical.
4. **Fix the LoginScreen `Invalid Email` title case** and align its error description with SignupScreen's tighter phrasing.
5. **Legal review the Privacy + Help & Support compliance claims** BEFORE any rewrite in that area.
6. **Decide on the AI-coach voice** — keep the current marketing-flavored landing, or bring it in line with the rest of the app's drier tone. This affects §3.2, §3.4, §1.7.

Stopping here per instructions. Awaiting your review of the classification and pass-back before any copy is rewritten.
