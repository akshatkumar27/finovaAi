# Icon audit — v3 baseline

**Purpose:** inventory every source and pattern of icons in the app before we consider migrating to `lucide-react-native`. Read-only — nothing was changed by this audit.

**Date:** 2026-09-13
**Branch scanned:** `origin/v2` at `f6108d3` (after v3 revamp) + local `v3-fixes` commit fixing back-button alignment / Profile access / ConfirmationModal.

---

## 1. Sources currently in use

### 1.1 `react-native-vector-icons` / `@expo/vector-icons`
**Not present.** No imports anywhere. Neither is listed in `package.json`.

### 1.2 `react-native-svg` — primary icon source
Version `13.4.0` (pinned in `package.json`). Used in **10 files** for custom inline SVG icons. Symbols imported: `Svg`, `Circle`, `Path`, `Rect`.

Files:

| File | Inline icon components | `<Svg>` uses |
| --- | --- | --- |
| `src/components/BackButton.tsx` | (chevron inline) | 1 |
| `src/components/ConfirmationModal.tsx` | `IconCheck`, `IconWarn`, `IconError`, `IconInfo` | 4 |
| `src/screens/main/GoalPulseScreen.tsx` | `TargetIcon`, `BellIcon`, `CoachIcon` + inline person icon + score ring | 5 |
| `src/screens/main/ContributionsScreen.tsx` | `CheckIcon`, `WarnIcon`, `ClockIcon` | 3 |
| `src/screens/main/InvestHubScreen.tsx` | `ChartIcon`, `CoinIcon`, `BankIcon` + inline sparkline + inline search | 5 |
| `src/screens/main/VaultScreen.tsx` | `BankIcon`, `WalletIcon` | 2 |
| `src/screens/main/NotificationScreen.tsx` | `IconWarn`, `IconCheck`, `IconStar`, `IconIdea`, `IconGear` | 5 |
| `src/screens/main/GoalChatScreen.tsx` | `CoachIcon` | 1 |
| `src/screens/main/EditGoalScreen.tsx` | inline trash icon | 1 |
| `src/screens/onboarding/GoalSelectionScreen.tsx` | `TargetIcon` | 1 |

**14 unique per-file `Icon` components** total — each defined inline in the file that uses it. No shared registry.

### 1.3 Local SVG files
**None.** `find src -name '*.svg'` returns nothing. Every SVG is defined via JSX at the call site.

### 1.4 Brand illustration PNGs
Located in `src/asset/`:

| File | Used by | Purpose |
| --- | --- | --- |
| `mascot.png` | `MascotLoader.tsx`, `AnimatedMascot.tsx`, `CustomToast.tsx` | Fino mascot (idle) |
| `happymascot.png` | `AnimatedMascot.tsx`, `CustomToast.tsx` | Fino mascot (celebrating) |
| `logo.png` | (referenced but not currently loaded) | Wordmark |
| `logotrans.png` | `Logo.tsx` | Wordmark on transparent background |

These are **brand illustrations, not UI icons** — Fino the mascot is a custom character and the logo is a wordmark. They should not be replaced by Lucide.

### 1.5 Text-character icons still in use
Not from an icon library — these are Unicode glyphs rendered inside `<Text>`:

| Glyph | File(s) | Purpose |
| --- | --- | --- |
| `✎` | `ContributionsScreen.tsx:417` | Edit pencil next to editable amount |
| `›` | `EditGoalScreen.tsx:417`, `AddGoalScreen.tsx:365`, `ProfileScreen.tsx:38` | Right chevron (day-picker card, menu row) |
| `‹`, `›` | `EditGoalScreen.tsx:427/431`, `AddGoalScreen.tsx:376/380` | Calendar prev/next month |
| `+` | `InvestHubScreen.tsx:113`, `GoalPulseScreen.tsx:460`, `OnboardingComponents.tsx:90` | FAB and counter button |
| `⚡` (emoji) | `DashboardComponents.tsx:276` | Legacy `AIInsightCard` — only remaining emoji in the codebase |

### 1.6 Legacy icon-via-string components (not currently used by v3 screens)
`src/components/DashboardComponents.tsx` and `src/components/GoalCard.tsx` expose an `icon: string` prop and render `<Text>{icon}</Text>`. This lets a caller pass any emoji or unicode glyph.

- `AccountRow`, `AssetRow`, `GoalCard` with emoji icons — no v3 screen calls these any more.
- Only `AIInsightCard` still has a hardcoded `⚡` at `DashboardComponents.tsx:276`.

These components are candidates for **deletion once we confirm no screen references them** (I already replaced the callers in `GoalPulseScreen`, `VaultScreen`, `InvestHubScreen`).

---

## 2. Inconsistencies flagged

### 2.1 No central `Icon` component
Every screen re-defines its own icon components from scratch (`TargetIcon`, `BankIcon`, `ChartIcon`, etc.). `TargetIcon` is defined in **two** files (`GoalPulseScreen`, `GoalSelectionScreen`) with slightly different default sizes (14 vs 16). `CoachIcon` similarly duplicated.

**Impact:** a design change (e.g. thinner strokes) requires touching 10+ files.

### 2.2 Ad-hoc size defaults
Icon default sizes vary by call site: `14`, `16`, `18`, `20`, `22`, `24`, `28`. No shared size scale.

### 2.3 Prop-name drift
Some icon components use `c: string` for color, others use `color: string`. Two conventions live side by side.

### 2.4 Text-glyph icons mix in with SVG icons
`✎`, `›`, `‹`, `+` are rendered as `<Text>` characters, which don't scale, align, or theme like SVGs. That's why the back-arrow bug happened earlier — the same class of issue affects every glyph-in-Text left in the app.

### 2.5 Stroke width isn't a token
Each inline SVG hardcodes `strokeWidth={1.8}` or `{2}` or `{1.6}`. No shared token — some icons look thinner than others at the same visual size.

### 2.6 One remaining emoji
`⚡` in `DashboardComponents.tsx:276` (legacy AIInsightCard) is the last emoji in the codebase.

---

## 3. Icons that are custom / branded (would need to stay hand-drawn)

None of the current inline icons are strictly custom — every one has a Lucide equivalent (see mapping table below). The only truly branded assets are:

- **Fino the mascot** (`mascot.png`, `happymascot.png`) — a character illustration, not swappable
- **Finova wordmark** (`logotrans.png`, `logo.png`) — brand mark, not swappable
- **Score ring** in `GoalPulseScreen` — this is a data-viz element (`<Circle>` with animated `strokeDashoffset`), not an icon, keep as-is

Everything else in the icon slots is a standard glyph and could migrate to Lucide.

### Proposed Lucide mapping (for later — do not migrate yet)

| Current inline icon | Purpose | Lucide equivalent |
| --- | --- | --- |
| `TargetIcon` | Goal marker | `Target` |
| `BellIcon` | Notifications | `Bell` |
| `CoachIcon` | AI chat | `MessageCircle` or `Sparkles` |
| `CheckIcon` | Paid / done | `Check` or `CheckCircle2` |
| `WarnIcon` | Pending / warning | `AlertTriangle` |
| `ClockIcon` | Time / due-in | `Clock` |
| `ChartIcon` | Investments | `BarChart3` |
| `CoinIcon` | Digital gold | `Coins` |
| `BankIcon` | Bank / accounts | `Landmark` |
| `WalletIcon` | Wallet | `Wallet` |
| `IconStar` (achievement) | Milestone | `Award` or `Trophy` |
| `IconIdea` (tip) | Suggestion | `Lightbulb` |
| `IconGear` (settings) | Settings entry | `Settings` |
| `IconError` (X in circle) | Error | `XCircle` |
| `IconInfo` (i in circle) | Info | `Info` |
| Inline trash (EditGoal) | Delete | `Trash2` |
| Inline person (GoalPulse header) | Profile | `User` |
| Inline search (InvestHub) | Search | `Search` |
| Chevron `›` (menu rows, day picker) | Nav affordance | `ChevronRight` |
| Chevron `‹`/`›` (calendar) | Month nav | `ChevronLeft` / `ChevronRight` |
| Pencil `✎` (edit amount) | Inline edit | `Pencil` |
| Plus `+` (FAB, counter) | Add | `Plus` |
| Back chevron (BackButton) | Back | `ChevronLeft` or `ArrowLeft` |

---

## 4. Migration scope (if we decide to go Lucide)

**Files to touch:** ~15
- 1 new file: `src/components/Icon.tsx` (thin wrapper — see recommendation below)
- 10 files with inline SVG icons — swap inline component definitions for Lucide imports
- 4–5 files with text-character icons — replace `<Text>` glyph with `<Icon name="chevron-right" />`
- 1 legacy: remove `⚡` emoji or delete `AIInsightCard` if unused

**Files to leave alone:**
- `MascotLoader.tsx`, `AnimatedMascot.tsx`, `Logo.tsx`, `CustomToast.tsx` — all use brand PNG assets
- The score ring in `GoalPulseScreen` — data viz, not an icon

**Recommended intermediate step:** ship a small `src/components/Icon.tsx` that re-exports Lucide with two guardrails — a fixed set of allowed size tokens (`sm=14 / md=16 / lg=20 / xl=24`) and `color` defaulting to `useTheme().colors.ink2`. Everything then imports from `../components/Icon`, not directly from `lucide-react-native`, so the size/stroke tokens stay consistent.

## 5. Verification snapshot

- **Sources found:** `react-native-svg` (primary), text glyphs (secondary), brand PNGs (assets)
- **Sources NOT found:** `react-native-vector-icons`, `@expo/vector-icons`, local `.svg` files, `lucide-react-native` (installed but not yet imported anywhere)
- **Distinct inline icon components:** 14 (defined once) + 2 duplicated (TargetIcon, CoachIcon)
- **Text-character icons:** 5 kinds (`✎ › ‹ + ⚡`) in ~10 sites
- **Central Icon wrapper:** none — icons imported ad hoc per screen
