# Manual walk-through — 2026-09-14

Device: `emulator-5554` (Pixel 3a arm64, API 34). Account: `amritanshu.suyall2@gmail.com`. OTP-authenticated live session.

## Screens exercised

| Screen | Result | Notes |
|---|---|---|
| LoginScreen | ✅ | empty submit → "Email is required" (inline). Bad format → "Please enter a valid email address" (inline). Nav to Signup works. |
| SignupScreen | ✅ | renders (name / email / age), back returns to Login |
| OTP | ✅ | 6-digit input, resend timer counts down with tabular figures, auto-verifies on final digit |
| GoalPulseScreen | ✅ | score ring (25 PULSE), TOTAL SAVED ₹75,000 / AVAILABLE ₹15,000, Emergency + Marriage suggestions, Health Insuranceh goal card, FAB, Edit + Ask coach links |
| ProfileScreen | ✅ | avatar, name, email, Light/Dark/System segmented control, Personal info / Privacy / Help rows, Sign out, `Finova AI · v1.0` |
| Theme toggle | ✅ | flips instantly, palette swaps correctly across surfaces & text |
| PersonalInfoScreen | ✅ | Full name / Email / Age; Financial details ₹200k / ₹80k / ₹30k / ₹1M / ₹0 |
| **EditFinancialDetailsScreen** | 🚨 | **Every value displays ×100** — see FINDING #1 below |
| ContributionsScreen | ✅ | 25% saved, Dec 2026 completion, 4 months left, ₹75,000 monthly, contribution history entry |
| GoalChatScreen | ✅ | placeholder + Join the waitlist CTA → `toast('Already joined — You're already on the waitlist.')` and button state transitions |
| AddGoalScreen (FAB) | ✅ | MONTHLY AVAILABLE ₹15,000 correct; empty submit → `toast.error('Missing name')`; autofill target/duration → monthly (₹1,20,000 ÷ 12 = ₹10,000); 6mo forces ₹20k → inline "Exceeds your ₹15,000/mo budget for new goals." + `toast.error('Too high')` |
| AddGoalScreen (Suggestion) | ✅ | Emergency Fund prefills — name, target ₹4,80,000, Custom 32 months, ₹15,000/mo, description banner |
| EditGoalScreen | ✅ | renders values, calendar picker opens, past dates greyed, ‹ disabled (past month), delete icon → "Delete goal?" modal with Cancel + Delete |
| PrivacySecurityScreen | ✅ | static policy (Data collection / Security / Rights / Third-party / Policy updates) |
| HelpSupportScreen | ✅ | WhatsApp + email cards, 5 accordion FAQs — expand/collapse works |
| Sign out modal | ✅ | title + body + Cancel/Sign out; Cancel dismisses |

## Screens NOT reachable from the UI

Registered in `MainTabNavigator` but with no user-facing entry point:

| Screen | Why unreachable |
|---|---|
| **NotificationScreen** | Only `navigate('Notifications')` call is **commented out** at [src/screens/main/GoalPulseScreen.tsx:230](src/screens/main/GoalPulseScreen.tsx:230) |
| **VaultScreen** | Zero `navigate('Vault')` calls in `src/` |
| **InvestHubScreen** | Zero `navigate('Invest')` calls in `src/` |
| **NotificationSettingsScreen** | Only reachable via NotificationScreen (also unreachable) |

## Findings

### 🚨 FINDING #1 — EditFinancialDetails renders every ₹ value ×100 (CRITICAL)

**Screen:** [src/screens/main/EditFinancialDetailsScreen.tsx](src/screens/main/EditFinancialDetailsScreen.tsx)

**Reproducer:**
1. Log in → Profile → Personal info: shows `Monthly income ₹200k`, `EMI outstanding ₹1M`, etc.
2. Tap `Edit` next to `FINANCIAL DETAILS`
3. EditFinancialDetails shows `AVAILABLE TO ALLOCATE ₹90,00,000/month`, `MONTHLY INCOME ₹2,00,00,000`, `MONTHLY EXPENSES ₹80,00,000`, `MONTHLY EMI ₹30,00,000`, `EMI OUTSTANDING ₹10,00,00,000`

**Same redux data, same selector, same `financialData.monthlyIncome` field. Ratio is exactly 100× everywhere. Verified via Maestro a11y tree (not a screenshot artifact).**

**Additional risk:** the segment bar's summary chip reads `₹90,00,000 unassigned` — if the user hits **Save changes** without editing, the app saves `income = 20,000,000`, `expenses = 8,000,000`, `emi = 3,000,000`, `outstanding = 100,000,000` back to `/api/user/financial-profile` and dispatches them to redux — corrupting the profile. **Do not tap Save on this screen until the display bug is understood.**

**Static reading of the code** ([EditFinancialDetailsScreen.tsx:37–51](src/screens/main/EditFinancialDetailsScreen.tsx:37)) shows the pipeline is `financialData.monthlyIncome → .toString() → formatNumberInput`. `formatNumberInput` in [src/utils/formatNumber.ts:133](src/utils/formatNumber.ts:133) is a straight `parseInt(...).toLocaleString('en-IN')` — no multiplier. The 100× must come from the value in redux differing between when PersonalInfo reads it and when EditFinancialDetails' useState initializer captured it. Needs runtime debugging (RN dev menu → redux state, or an added `console.log(financialData)` in EditFinancialDetails) to nail down the root cause — **not touched here** per the "never touch business logic / data handling" rule.

### 🚨 FINDING #2 — Three registered screens have no UI entry point

- `NotificationScreen`, `VaultScreen`, `InvestHubScreen` are compiled into the bundle, registered in `MainTabNavigator`, and only reachable via `navigate('Notifications' | 'Vault' | 'Invest')` — no such call exists in the current source. The one call for `Notifications` is commented out at [src/screens/main/GoalPulseScreen.tsx:230](src/screens/main/GoalPulseScreen.tsx:230).
- `NotificationSettingsScreen` is only reachable from `NotificationScreen`, so it's transitively dead too.
- Impact: bundle bloat + user cannot receive in-app notifications, browse the "Vault", or access "InvestHub". If these were part of the v3 design plan, the entry points need to be wired back into GoalPulse (bell icon in header + tabs or drawer for Vault / Invest). If they're deprecated, delete the routes and screens.

### ⚠ FINDING #3 — Sonner toast at bottom-center is partially clipped by Android nav bar

Reproducible on AddGoalScreen's "Too high" toast (screenshot in report). The toast renders slightly overlapping / hidden by the system nav bar. Minor cosmetic. Fix by using `mobileOffset` / `offset` prop on `<Toaster>` in [App.tsx:199](App.tsx:199) or switching to `position="top-center"`.

### ℹ FINDING #4 — Goal name has a trailing typo in user data

`"Health Insuranceh"` — user-typed data, not a UI bug. Flagging for awareness; can be corrected via Edit goal → Save changes on this account.

## Coverage summary

- **13 screens rendered and interacted with**
- **1 critical rendering bug** (EditFinancialDetails ×100)
- **1 structural bug** (3 dead routes)
- **1 minor cosmetic bug** (toast clipping)
- **0 destructive actions taken** (Sign out cancelled; Delete goal cancelled; Save changes not tapped on the buggy financials screen; goal Test Vacation not created)

## Not exercised (blocked)

- Signup end-to-end (would create a duplicate account)
- OTP failure path with wrong code (would burn OTPs on your account)
- Deleting the real goal (destructive)
- Saving EditFinancialDetails (would push corrupted values, blocked pending FINDING #1 root cause)
- Delete account (destructive)
