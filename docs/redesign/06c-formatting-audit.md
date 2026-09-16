# Frontend formatting audit — numbers, currency, dates

Run date: 2026-09-16. Scope: `finovaAi/src/` on the merged v3 branch. Method: greps for every formatter call site, every `toLocaleString` / `toLocaleDateString` / template literal touching money or time. Read-only — no values reformatted, no code changed. Complements [06-content-audit.md](06-content-audit.md) and [06b-backend-content-audit.md](06b-backend-content-audit.md).

## Coverage counts

| Class | Count | Notes |
|---|---|---|
| Currency-format helpers in `src/utils/formatNumber.ts` | **6** functions | `formatNumber`, `formatCurrency`, `formatFullNumber`, `formatCompactNumber`, `formatCompactCurrency`, `formatNumberInput` |
| Ad-hoc currency formatters outside `formatNumber.ts` | **1** | `formatChip` in `_OnboardingLayout.tsx` (uses `L` for lakh) |
| Call sites using `formatCurrency` / `formatCompactCurrency` / `formatCompactNumber` (via the helpers) | 23 | Across 7 screens |
| Call sites using raw `${currencySymbol}${num.toLocaleString(...)}` | **11** | Direct template-literal formatting |
| Call sites using `${currencySymbol}${num.toLocaleString('en-IN')}` (Indian numbering, explicit) | 4 | EditFinancialDetails × 3, InvestHub × 1 |
| Call sites using `${currencySymbol}${num.toLocaleString()}` (device-locale default — inconsistent output) | 7 | EditGoal × 4, MonthlyExpenses × 2, MonthlyEMI × 2, GoalSelection × 2, GoalPulse × 1 |
| Distinct date formats rendered | **6** | See §3 |
| Places using `toLocaleDateString` | 7 | All in ContributionsScreen + GoalPulseScreen |
| Places using `new Date(...)` for computation | 20+ | Concentrated in EditGoalScreen, ContributionsScreen, AddGoalScreen (calendar pickers) |
| `date-fns` / `dayjs` / `moment` usage | **0** | All date logic is raw `Date` methods |
| Percentage renderings | 1 (mock data) | `20% of Emergency fund` in Notification mock |
| Pluralization helpers | 0 | Inline `x === 1 ? 'goal' : 'goals'` pattern, repeated 3 times |
| Timezone captures (sent to backend) | 2 | EditGoal + AddGoal, both `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| Timezone leaks in UI | 0 | No UTC timestamps rendered raw |

## Findings by category

### 1. Currency — the biggest defect surface

The same rupee amount can render **five different ways** in this app, depending which screen you look at. This is the highest-priority formatting issue.

#### 1.1 Four distinct formatters coexist

| Function | Shape | Location |
|---|---|---|
| `formatCurrency(200000, '₹')` | `₹200k` (lowercase `k`, always suffix) | `formatNumber.ts:49` |
| `formatCompactCurrency(200000, '₹')` | `₹200K` (uppercase `K`, hybrid: full number under 100k, suffix at 100k+) | `formatNumber.ts:120` |
| `formatCompactNumber(200000)` | `200K` (no symbol) | `formatNumber.ts:81` |
| `formatChip(150000)` inside `_OnboardingLayout.tsx` | `1.5L` (lakh suffix, only used on onboarding chips) | `_OnboardingLayout.tsx:64` |

Same input (`200000`), four different outputs: `₹200k`, `₹200K`, `200K`, `2L`. Whichever the user sees depends on which screen they're on.

#### 1.2 Two conventions for Indian numbering + one no-locale fallback

| Approach | Output for ₹150,000 | Where |
|---|---|---|
| `num.toLocaleString('en-IN')` | `1,50,000` (Indian: 3-digit thousand, 2-digit lakh grouping) | 4 sites |
| `num.toLocaleString()` (no locale) | `150,000` on en-US devices, `1,50,000` on en-IN devices — **depends on the user's device** | 7 sites |
| `formatCompactNumber` → `Math.round(x/1000, 2) + 'K'` | `150K` | 3 sites |

Result: an ₹150,000 amount can literally render as `₹1,50,000`, `₹150,000`, or `₹150K` on adjacent screens. On the same user's phone.

#### 1.3 Site-by-site map

| Screen | What's rendered | Formatter used | Sample output for ₹150,000 |
|---|---|---|---|
| **GoalPulse hero: TOTAL SAVED / AVAILABLE** | `{currencySymbol}{formatCompactNumber(totalSaved)}` | `formatCompactNumber` | `₹150K` |
| GoalPulse suggested card: amount | `{currencySymbol}{insight.amount.toLocaleString()}` | raw device locale | `₹1,50,000` (on en-IN) / `₹150,000` (on en-US) |
| GoalPulse goal card progress | `{currencySymbol}{formatCompactNumber(goal.saved_amount)} of {currencySymbol}{formatCompactNumber(targetNum)}` | `formatCompactNumber` | `₹150K of ₹300K` |
| **Personal info Financial details** | `formatCurrency(financialData.monthlyIncome, currencySymbol)` | `formatCurrency` | `₹150k` (lowercase k) |
| **EditFinancialDetails summary** | `${currencySymbol}${available.toLocaleString('en-IN')}` | raw en-IN | `₹1,50,000` |
| EditFinancialDetails split line | `${currencySymbol}${investment.toLocaleString('en-IN')}` | raw en-IN | `₹1,50,000` |
| **Contributions** history and modal | `formatCompactCurrency(item.amount, currencySymbol)` | `formatCompactCurrency` | `₹1.5L` (wait — see §1.5) |
| Contributions monthly / target | `formatCompactCurrency(targetAmount, currencySymbol)` | `formatCompactCurrency` | `₹1.5L` |
| **EditGoal error strings** | `${currencySymbol}${savedAmount.toLocaleString()}` | raw device locale | `₹1,50,000` / `₹150,000` |
| EditGoal budget-exceeded toast | `${currencySymbol}${availableForNewGoals.toLocaleString()}` | raw device locale | `₹1,50,000` / `₹150,000` |
| **AddGoal budget error** | `formatCompactCurrency(availableForNewGoals ?? 0, currencySymbol)` | `formatCompactCurrency` | `₹1.5L` |
| AddGoal inline exceeds line | `formatCompactCurrency(availableForNewGoals ?? 0, currencySymbol)` | `formatCompactCurrency` | `₹1.5L` |
| **MonthlyExpenses/EMI toast** | `${currencySymbol}${monthlyIncome.toLocaleString()}` | raw device locale | `₹1,50,000` / `₹150,000` |
| MonthlyExpenses footerHint | `${currencySymbol}${monthlyIncome.toLocaleString()}` | raw device locale | `₹1,50,000` / `₹150,000` |
| **GoalSelection card sub** | `{currencySymbol}{monthly.toLocaleString()}/mo` | raw device locale | `₹1,50,000/mo` |
| GoalSelection card amount | `{currencySymbol}{insight.amount.toLocaleString()}` | raw device locale | `₹1,50,000` |
| **InvestHub asset amount** | `{currencySymbol}{asset.amount.toLocaleString('en-IN')}` | raw en-IN | `₹1,50,000` |
| **NotificationScreen mock** | `${currencySymbol}30,000` (hardcoded) | literal | `₹30,000` |
| **Onboarding chip suggestions** | `formatChip(val)` — local function | ad-hoc lakh | `1.5L` (no ₹ symbol!) |

#### 1.4 Symbol placement + spacing

- Symbol placement: **always before the number** — consistent ✅
- Spacing: **inconsistent**:
  - Most JSX: no space — `{currencySymbol}{amount}` → `₹150000`
  - Input fields (EditFinancialDetails, EditGoal, Contributions modal): symbol rendered in a separate `<Text>` on the left → visually there's a small gap `₹ 150000` because it's a flex row
  - Onboarding chip: `formatChip` returns `1.5L` **without** `₹` — the symbol is drawn elsewhere in the layout (`_OnboardingLayout.tsx:93`: `{currencySymbol === '₹' ? 'INR' : currencySymbol}`). So on the onboarding hero, users see `INR 1.5L` while other screens use `₹1,50,000`.

#### 1.5 Compact-notation confusion (`k` vs `K` vs `L` vs `M` vs `Cr`)

Currently supported suffixes:

| Formatter | 5,000 | 50,000 | 200,000 | 1,500,000 | 10,000,000 |
|---|---|---|---|---|---|
| `formatCurrency` (K/M) | `₹5k` | `₹50k` | `₹200k` | `₹1.5M` | `₹10M` |
| `formatCompactCurrency` (K/M hybrid) | `₹5,000` | `₹50,000` | `₹200K` | `₹1.5M` | `₹10M` |
| `formatChip` (K/L, onboarding only) | `5k` | `50k` | `2L` | `15L` | `100L` |

**Nothing supports `Cr` (crore)**. `10,000,000` renders as `₹10M`, which reads as "10 million" to a non-Indian audience but Indian users think in "1 crore" (`1 Cr`). At the scale finance apps typically operate (EMI outstanding = ₹10L, retirement corpus = ₹1Cr+), the M/B suffix drops the ball. `formatChip` has `L` (lakh) but not `Cr` and only surfaces on onboarding.

Case: `k` (lower) in `formatCurrency`, `K` (upper) in `formatCompactCurrency` and `formatChip`. Pick one.

#### 1.6 Decimals

`formatCurrency` accepts a `decimals` param default 1 but the implementation uses `parseFloat(value.toFixed(3)).toString()` — the `decimals` arg is ignored. `formatCompactNumber` uses `.toFixed(2)`. So `₹1,234,567` becomes `₹1.235M` in one formatter and `₹1.23M` in another.

None of the call sites render decimal rupees at all (money is always whole rupees). But if a future feature does — interest earned, tax deducted, growth rate on invest — there's no consistent decimal rule.

### 2. Non-currency numbers, counts, pluralization

#### 2.1 Pluralization

Handled inline, same pattern replicated three times:

| File | Pattern |
|---|---|
| [GoalPulseScreen.tsx:269](src/screens/main/GoalPulseScreen.tsx:269) | `{goals.length} {goals.length === 1 ? 'goal' : 'goals'}` |
| [GoalPulseScreen.tsx:314](src/screens/main/GoalPulseScreen.tsx:314) | `{insight.target_months} {insight.target_months === 1 ? 'month' : 'months'}` |
| [GoalSelectionScreen.tsx:130](src/screens/onboarding/GoalSelectionScreen.tsx:130) | `{insight.target_months} {insight.target_months === 1 ? 'month' : 'months'}` |

No shared helper. If a fourth screen adds `days left` / `contributions this month`, a fourth ternary will appear. Recommend a `pluralize(count, singular, plural?)` utility (2 lines).

#### 2.2 Percentages

Only one percentage in the entire app: `'Milestone: 20% of Emergency fund'` — hardcoded mock string in NotificationScreen. No formatter. When real notification data plugs in, there's no `formatPercent(value, decimals)` to call. Not a regression yet; a blocker at plug-in time.

#### 2.3 "N months" / "N days"

- `{insight.target_months} months` — literal count + noun. Fine.
- No "days left" copy. Contribution due date is rendered as `Next due Oct 14, 2026` (absolute date, not a countdown).

#### 2.4 "/mo" vs "/month"

- `EditFinancialDetails.tsx:147` → `/month` (as `<Text>`)
- `AddGoalScreen.tsx:154 + 341` → `/mo` (in strings)
- `GoalSelectionScreen.tsx:130` → `/mo` (in JSX)

Inconsistent. Recommend one form; `/month` is clearer, `/mo` is tighter — pick one.

### 3. Dates & times

#### 3.1 Every date format used in the app

| Format | Where | Rendered example |
|---|---|---|
| `Sep 10` (short month + day, no year) | mock in NotificationScreen `title: 'Payment due Sep 10'` | `Sep 10` |
| `Sep 10, 2026` (short month + day + year) | ContributionsScreen dates + `getNextDueFormatted` | `Sep 10, 2026` |
| `Sep 2026` (short month + year — `monthKey`) | ContributionsScreen (`month: 'short', year: 'numeric'`) | `Sep 2026` |
| `WEDNESDAY, SEP 16` (weekday + short month + day, upper) | GoalPulseScreen header (`toLocaleDateString(undefined, ...).toUpperCase()`) | `WEDNESDAY, SEP 16` |
| `September 2026` (full month + year) | EditGoal + AddGoal calendar (`MONTH_NAMES[m] + ' ' + year`) | `September 2026` |
| Relative `Yesterday` / `3 days ago` / `5 days ago` | NotificationScreen mock — **hardcoded strings, not computed** | `Yesterday`, `3 days ago` |
| `9:12 AM` clock time | NotificationScreen mock — hardcoded | `9:12 AM` |

**Six formats in play. Two are only in mock data (`Sep 10` and the relative-time strings)** but will need real formatters when the notification API is wired.

#### 3.2 Locale usage

Three locales in play:
- `'en-US'` — used explicitly by ContributionsScreen (`{ month: 'short', day: 'numeric', year: 'numeric' }`, `{ month: 'short', year: 'numeric' }`)
- `undefined` — used by GoalPulse header (device default)
- Manual `MONTH_NAMES` array — used by EditGoal + AddGoal calendars

`en-US` locale is a defensible choice for Indian users (they read English), but `WEDNESDAY, SEP 16` vs `Sep 16, 2026` are stylistically different (upper vs mixed case) even inside the same app. Pick one.

#### 3.3 No date-fns / dayjs / moment

`node_modules` shows no date lib. All logic is raw `Date` methods. That's fine for the current small surface, but two implications:
- Relative time (`3 days ago`) is impossible without importing a lib or writing one. Currently only NotificationScreen needs it, and it's hardcoded.
- Date-diff logic (`Math.ceil((nextDueStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))` in ContributionsScreen.tsx:195) is manual and error-prone. Not a formatting bug per se, but adjacent.

#### 3.4 Timezone handling

- FE captures `Intl.DateTimeFormat().resolvedOptions().timeZone` and sends it to backend as `timezone` on goal-create/update — good, matches backend validator.
- Backend validates and stores dates as `YYYY-MM-DD` strings — no UTC leak.
- Display layer computes `new Date(y, m, d)` (local-time constructor) — correct for date-only values.
- **No UTC leaks in the display.** ✅

#### 3.5 One subtle bug (formatting-adjacent, worth flagging)

`ContributionsScreen.tsx:65-68`:
```ts
const s = route.params?.contributionDay;
const contributionStartDate = s ? new Date(s) : null;
const contributionDay = contributionStartDate ? contributionStartDate.getDate() : 1;
```
`new Date('YYYY-MM-DD')` in JavaScript parses as **UTC midnight**, not local midnight. On a user east of UTC (Asia/Kolkata = +5:30), `new Date('2026-09-16').getDate()` returns `16`. On a user west of UTC (e.g. America/Los_Angeles = -8:00), it returns `15`. If a US-based tester ever runs the app, contribution days will be off by one.

Not a copy defect — flagging here because a formatting/timezone audit is where it belongs.

### 4. Consistency inconsistencies with counts

| Item | Distinct implementations | Priority |
|---|---|---|
| Rupee amount rendering | **5** (see §1.1 + §1.2) | 🔴 High |
| Indian numbering (`en-IN` vs default) | **2** on same screen types | 🔴 High |
| Compact-notation suffix (`k`/`K`/`L`/`M`/`Cr`) | 4 variants, no Cr | 🟡 Medium |
| Currency symbol vs `INR` word | 2 (onboarding uses word) | 🟢 Low |
| Date format | 6 (2 in mock) | 🟡 Medium |
| Locale for dates | `en-US` + `undefined` + manual | 🟡 Medium |
| Pluralization | 3 inline call sites, no helper | 🟢 Low |
| `/mo` vs `/month` | 2 variants across 4 files | 🟢 Low |
| Percentage formatter | 0 (unblocked, static mock only) | 🟢 Low (blocker at plug-in) |

## Recommended next steps (pending your review)

1. **Consolidate to one currency formatter with a documented output contract.** Kill `formatCurrency`, `formatCompactCurrency`, `formatCompactNumber`, and `formatChip` in favour of one:
   - `formatMoney(amount, { symbol, compact })` returning `₹1,50,000` (full en-IN) or `₹1.5L` (Indian-suffix compact including `Cr` for crore).
   - Every `${currencySymbol}${num.toLocaleString(...)}` in the codebase becomes a call.
2. **Adopt Indian numbering system by default (`en-IN`).** Remove every bare `.toLocaleString()` — that's the device-locale trap.
3. **Add crore (`Cr`) to the compact scale.** A retirement corpus goal at `₹1 Cr` is common Indian-finance context.
4. **Pick and document a date format style.** Recommend `Sep 16, 2026` for absolute dates in body copy and `WED, SEP 16` for hero captions — same casing, one for headers, one for body.
5. **Write a tiny `pluralize` helper** so goals / months / contributions / days share one line each.
6. **Skip date-fns for now** — the surface is small enough. If the notification API needs relative time (`3 days ago`), write a 10-line `formatRelative(from, now)` utility.
7. **Fix the `new Date('YYYY-MM-DD')` UTC-parse bug** (§3.5) before it lands on any user west of UTC. This isn't strictly formatting — it's a semantic bug — but it belongs in the same fix pass.
8. **Sequence with the content audit**: (a) merge FE/BE term-of-art table, (b) content rewrite pass, (c) formatter consolidation. Order matters — copy that references `available` needs to know whether the number next to it will be `₹90,000` or `₹90K` or `₹90k`.

## What this audit deliberately did NOT do

- Format any numbers or dates. Read-only.
- Enumerate every one of the 20+ `new Date(...)` computation call sites (calendar picker logic) — they're computation, not formatting.
- Cover the onboarding "chip" (`_OnboardingLayout.tsx`) suggestions in full — only the formatter shape (§1.1).
- Cover backend date/currency output — the API returns numbers as strings (`"200000.00"` from Sequelize DECIMAL, we already fixed that in the ×100 pass) and dates as ISO. FE is responsible for rendering.
- Test on-device — this is a static audit. A live walk would confirm which screens actually render which format in which locale.

Stopping here per instructions. Awaiting your review + choice of Indian-vs-Western numbering convention before any formatter change lands.
