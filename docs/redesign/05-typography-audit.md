# Typography audit — v3 baseline

**Purpose:** map what fonts, sizes, weights and numeric-alignment patterns the app uses today, before choosing a custom font. Read-only — nothing changed.

**Date:** 2026-09-14
**Branch scanned:** `v2` at `e80d7c5` (after Lucide migration + sonner-native toast swap)

---

## 1. Fonts currently in use

### 1.1 Custom-font loaders
**None.** Zero hits for `expo-font`, `useFonts`, `Font.loadAsync`, or any font-loading API across `src/`, `App.tsx`, `index.js`.

### 1.2 Bundled font files
**None.** No `assets/fonts/`, no `.ttf`/`.otf`/`.woff` under `src/`, `assets/`, or `android/app/src/main/assets/`. No `react-native.config.js` linking font assets.

### 1.3 `fontFamily` references in code
**Zero.** No `StyleSheet` or inline style anywhere sets `fontFamily`.

### 1.4 What the app actually renders in
System defaults on each platform:

- **iOS:** San Francisco (SF Pro Text / SF Pro Display, auto-switched by size)
- **Android:** Roboto (Google Sans on newer Pixel firmware)

This means every screen currently rendered on your test devices has been using the OS's default sans, not a custom one. The v3 redesign work — display headings, hero amounts, chip labels — has been designed against the OS default, so introducing a custom font is a **visual change to every screen**, not a fill-in.

---

## 2. Central type system vs ad-hoc

Two systems live in the codebase side by side:

### 2.1 New `src/theme/tokens.ts` (used by v3 screens)
```ts
export const typography = {
    display: 34,
    title: 22,
    body: 15,
    caption: 12,

    weightRegular: '400' as const,
    weightMedium: '500' as const,
    weightSemibold: '600' as const,
    weightBold: '700' as const,
};
```
- **4 sizes + 4 weight tokens.** No `lineHeight`, no `letterSpacing`, no `fontFamily`.
- Referenced across the app via `useTheme().typography.weightSemibold` etc. — **166 usages** for weights.
- Only **39 usages** for the size tokens (`display/title/body/caption`) — most screens do NOT read `typography.body` etc., they hardcode the number.

### 2.2 Legacy `src/constants/theme.ts` (pre-v3, still imported by 8 legacy components)
```ts
export const typography = {
    display: 38, h1: 28, h2: 24, h3: 20, ...
};
```
- A more granular 7+ step scale.
- Imported by: `MascotLoader`, `GoalCard`, `OnboardingComponents`, `SkeletonLoader`, `Logo`, `Header`, `FooterLinks`. Most of these aren't rendered by v3 screens any more, but the imports still resolve.
- **Two overlapping typography objects** means "the type scale" isn't one thing right now.

### 2.3 Reality: sizes are mostly hardcoded per screen
The theme tokens define a scale but screens don't consume it — most `fontSize` values are literal numbers written next to each `StyleSheet` entry.

---

## 3. Distinct sizes, weights, line-heights, letter-spacing

### 3.1 Font sizes (271 occurrences, 20 distinct values)
| px | count | belongs to |
| --- | --- | --- |
| **14** | 51 | body copy, list items |
| **12** | 39 | caption, meta |
| **11** | 36 | tiny caption, section-head |
| **13** | 33 | secondary body |
| **18** | 28 | subheading |
| **15** | 25 | field text, button label (matches token `body: 15`) |
| **22** | 16 | title (matches token `title: 22`) |
| **20** | 14 | small title |
| **16** | 7 | body-large |
| **10** | 6 | micro |
| 26, 24 | 4 each | hero |
| 28 | 3 | hero |
| 30 | 2 | large amount |
| 8, 9, 17, 32, 36, 48 | 1 each | one-off outliers |

**Reading:** the actual scale is closer to **10–12–13–14–15–16–18–20–22** (nine steps used regularly). The theme tokens' four steps (`12/15/22/34`) don't match observed usage. `34` (`display`) isn't used at all — the biggest hero values are 30 and 32.

### 3.2 Font weights (170 occurrences, ~6 distinct)
| weight | count |
| --- | --- |
| `t.weightSemibold` (600) | 98 |
| `t.weightBold` (700) | 46 |
| `t.weightMedium` (500) | 20 |
| `'300'` literal | 3 |
| `'700'`/`'600'` literal | 3 |

**Reading:** semibold dominates as the "text you notice" weight; bold for hero/title, medium for secondary labels. Regular (400) is only used implicitly (default). Three literals leaked past the token system.

### 3.3 Line-heights (36 occurrences, 6 distinct)
20, 18, 21, 22, 30, 16 — mostly used only for multi-line body text. **Most `Text` styles don't set `lineHeight` at all**, so RN falls back to the platform default (~1.2×). Switching to a custom font will expose whatever line-height differences that font ships with — a decision we'll need to make when picking one.

### 3.4 Letter-spacing (73 occurrences)
Two distinct patterns:
- **Negative** (`-0.3` / `-0.4` / `-0.5` / `-0.6`) on titles + hero amounts — matches SF's optical-size tightening for large sizes.
- **Positive** (`1.2` / `1.4`) on ALL-CAPS section heads — standard tracking convention.

These will need re-tuning per font. SF's negative-tracking values look wrong on Inter (Inter needs ~half as much) and terrible on rounded fonts.

---

## 4. Tabular figures / monospace

The team has been careful here. `fontVariant: ['tabular-nums']` appears **34 times** across financial displays:

| Screen | Sites |
| --- | --- |
| `ContributionsScreen` | 5 (`amountBig`, `editorField`, `progressPctText`, `progressSaved`, `statValue`) |
| `EditGoalScreen` | 5 (calendar day pickers + amount field + custom field) |
| `EditFinancialDetailsScreen` | 2 (`summaryValue`, inline field) |
| `InvestHubScreen` | 4 (`heroValue`, `gainBadgeText`, `assetAmt`, `assetChange`) |
| `VaultScreen` | 3 (`heroValue`, `footerVal`, `spendTotal`) |
| `PersonalInfoScreen` | 1 (`kvValueMono`) |
| `OTPVerificationScreen` | 1 (resend timer) |

Every place where digits need to line up (amount editors, progress percents, gain/loss badges, day-of-month circles, countdown timer) is already tagged.

⚠️ **`fontVariant: ['tabular-nums']` is a font-level OpenType feature** — it only works if the currently active font ships tabular figures. SF Pro (iOS) and Roboto (Android) both do, so this works today. **The custom font we pick MUST also ship tabular-nums**, otherwise every one of these 34 sites silently reverts to proportional digits and columns start to jitter.

**Fonts that ship tabular-nums (safe candidates):** Inter, IBM Plex Sans, Manrope, Space Grotesk (variable), Geist, DM Sans, Public Sans, Work Sans.
**Fonts that do NOT (avoid or bring a mono):** Poppins, Nunito, Rubik, Quicksand, Lato.

No dedicated monospace family is loaded anywhere — the app relies on tabular figures within the same family, not a separate mono. That's the right call for fintech UI (a mono column of digits inside a proportional-text card is jarring).

---

## 5. What this audit means for the font choice

- **Scope of the change is total.** Introducing a custom font will re-render every screen. No parts of the UI are already opted out via `fontFamily: 'System'`.
- **The scale needs formalizing.** Nine sizes are used but only four are named. Before picking a font, decide the canonical scale (suggestion: **11 · 12 · 13 · 14 · 15 · 16 · 18 · 22 · 30**) and add `lineHeight` per step.
- **Letter-spacing needs re-derivation** per font. The current values are SF-tuned.
- **Tabular figures are load-bearing.** Any candidate that lacks tabular-nums is disqualified.
- **Two hero sizes vary between 30 and 32.** Worth aligning (probably 32) before we commit to a font.
- **Legacy `constants/theme.ts` should go** once its 8 consumers are retired — it's carrying a competing type scale.

---

## 6. Recommended next step (not done yet — for your call)

Before choosing between candidates (Inter, Geist, Manrope, IBM Plex Sans, DM Sans …):
1. Formalize the size scale + line-heights in `src/theme/tokens.ts` — so the font choice slots in cleanly.
2. Pick a font that ships **tabular-nums**, **at least 4 weights** (400/500/600/700), and has good rendering below 14px on Android.
3. Load via bare-RN font linking (`react-native.config.js` + `assets/fonts/` + `npx react-native-asset`), not expo-font — this project is bare RN 0.74.
4. Sweep all 271 hardcoded `fontSize:` sites to consume tokens (mechanical rewrite once the scale is locked).

**Not deciding a font yet — awaiting your direction on both the scale and the family.**
