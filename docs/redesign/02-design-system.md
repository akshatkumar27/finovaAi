# Finova AI — Design System Proposal
_Phase 2 of redesign. Awaiting approval before any code changes. Date: 2026-08-04_

---

## Design Intent

**Feel:** Premium dark fintech — confident, trustworthy, and slightly futuristic. Closer to Revolut / Phantom than a bank app. The mascot (Fino) gives it warmth that pure fintech apps lack; the design system should lean into that duality: precise and data-dense, but human.

**User emotion goal:** "This app understands my money better than I do — and I trust it completely."

**One thing users should notice first on every screen:** The number that matters most (balance, progress %, gain/loss). Everything else is hierarchy below it.

---

## 1. Color System

### 60 / 30 / 10 Rule Applied
- **60% — Surface neutrals:** Deep dark navy backgrounds and card surfaces
- **30% — Text & structure:** Off-white text, subtle borders, secondary elements
- **10% — Brand + semantic accent:** Electric blue CTAs, gain/loss/warning indicators

### Surface Hierarchy

| Token | Hex | Usage |
|---|---|---|
| `bg.base` | `#080811` | App background — deepest layer |
| `bg.surface` | `#0f0f1c` | Cards, panels, bottom sheets |
| `bg.elevated` | `#161628` | Modals, popovers, floating elements |
| `bg.input` | `#1a1a2e` | Input fields (unchanged — works well) |
| `bg.overlay` | `rgba(8,8,17,0.85)` | Modal backdrops |

_Rationale: Current #0a0a14 is close. The new scale creates clearer Z-axis depth so cards read as distinct from the background without needing harsh borders._

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `brand.primary` | `#3d8ef8` | Primary CTAs, links, active states |
| `brand.primaryDim` | `rgba(61,142,248,0.12)` | Secondary button fills, card highlights |
| `brand.primaryMid` | `rgba(61,142,248,0.25)` | Focus rings, pressed states |
| `brand.primaryStrong` | `#1a6ed4` | Pressed/active primary button |

_Change from current: #2d7ff9 → #3d8ef8. Slightly warmer and higher contrast on dark surfaces (passes WCAG AA at 4.6:1 on bg.base)._

### Fintech Semantic Colors

These are the biggest gap in the current system. Every fintech screen needs these.

| Token | Hex | Usage |
|---|---|---|
| `semantic.gain` | `#00c896` | Positive returns, surplus, +% badges, goal ahead of schedule |
| `semantic.gainDim` | `rgba(0,200,150,0.12)` | Gain badge backgrounds, highlight cards |
| `semantic.gainText` | `#00e8b0` | Gain text on dark backgrounds (lighter for contrast) |
| `semantic.loss` | `#ff5252` | Negative returns, deficit, overspend alerts |
| `semantic.lossDim` | `rgba(255,82,82,0.12)` | Loss badge backgrounds |
| `semantic.lossText` | `#ff7272` | Loss text on dark backgrounds |
| `semantic.warning` | `#f59e0b` | Caution states, approaching limits, EMI reminders |
| `semantic.warningDim` | `rgba(245,158,11,0.12)` | Warning badge backgrounds |
| `semantic.warningText` | `#fbbf24` | Warning text on dark backgrounds |
| `semantic.neutral` | `#6b7280` | No-change / flat states |
| `semantic.neutralDim` | `rgba(107,114,128,0.12)` | Neutral badge backgrounds |

_Replaces: current `success: #4dff7c` (neon green — too harsh) and `error: #ff4d4d` (kept but softened)._

### Notification / Status Colors (for NotificationScreen)

| Token | Hex | Maps to |
|---|---|---|
| `status.suggestion` | `#f59e0b` | Warning amber (⚡ suggestions) |
| `status.alert` | `#ff5252` | Loss red (⚠️ alerts) |
| `status.update` | `#00c896` | Gain teal (✅ updates) |
| `status.achievement` | `#a855f7` | Purple (🏆 achievements) |
| `status.achievementDim` | `rgba(168,85,247,0.12)` | Achievement badge background |

### Text Hierarchy

| Token | Value | Usage |
|---|---|---|
| `text.primary` | `#f0f0fa` | Headings, important values — not pure white (reduces eye strain) |
| `text.secondary` | `#8b8b9e` | Body, descriptions, secondary labels |
| `text.tertiary` | `#55556a` | Timestamps, placeholders, very muted labels |
| `text.positive` | `#00e8b0` | Gain amounts, surplus text |
| `text.negative` | `#ff7272` | Loss amounts, error text |
| `text.link` | `#3d8ef8` | Tappable links |
| `text.disabled` | `#3a3a50` | Disabled inputs, inactive elements |

### Border

| Token | Hex | Usage |
|---|---|---|
| `border.subtle` | `#1a1a2c` | Very faint dividers |
| `border.default` | `#252538` | Card borders, section dividers |
| `border.strong` | `#363650` | Emphasized borders, selected states |
| `border.focused` | `#3d8ef8` | Input focus rings |

### Chart Palette (5 series for Invest Hub / Vault)

| Name | Hex | Asset type |
|---|---|---|
| `chart.blue` | `#3d8ef8` | Primary / Mutual Funds |
| `chart.teal` | `#00c896` | Digital Gold / Gains |
| `chart.purple` | `#a855f7` | Fixed Deposits / Debt |
| `chart.amber` | `#f59e0b` | Cash / Liquid |
| `chart.coral` | `#f97066` | Other / Misc |

---

## 2. Typography

### Font Family

**Primary UI font:** `Inter` (via `expo-google-fonts/inter` or system fallback)
- Chosen for: exceptional legibility at small sizes, clean numeric forms, widely available
- Fallback chain: `Inter, -apple-system, Helvetica Neue, sans-serif`

**Numeric rendering:** All financial amounts use `fontVariant: ['tabular-nums']`
- This ensures digits align in tables and charts without needing a separate monospace font
- Apply on: any `Text` component displaying ₹ amounts, percentages, or counts

### Type Scale (4 sizes + 1 display)

| Token | Size | Line height | Weight | Usage |
|---|---|---|---|---|
| `type.display` | 38px | 44px | 700 | Hero numbers — portfolio value, goal total, balance. Max 1–2 per screen. |
| `type.h1` | 26px | 32px | 700 | Screen titles, onboarding headings |
| `type.h2` | 20px | 26px | 600 | Section headings, card titles |
| `type.body` | 15px | 22px | 400 | Body copy, descriptions, list items |
| `type.caption` | 12px | 16px | 500 | Labels, timestamps, badges, placeholders |

**Rules:**
- Maximum 4 sizes on any single screen (display + h1 + body + caption is already the limit)
- 2 weights in active use per screen: 700 for headings/values, 400 for body. 600 for subheadings only.
- Labels should never be larger than the values they describe (e.g. "₹82,000" > "Monthly Income")
- Color + opacity for secondary text — not a different weight

### Usage Pattern

```
Screen title       → h1, text.primary
Section header     → h2, text.secondary
Hero metric        → display, text.primary, tabular-nums
Sub-metric label   → caption, text.tertiary
Body description   → body, text.secondary
CTA text           → body, weight 600, text.primary
Badge / chip text  → caption, weight 600
```

---

## 3. Spacing (8pt Grid)

All spacing values are multiples of 8 (with 4 as the only exception, for tight icon-label pairs).

| Token | Value | Usage |
|---|---|---|
| `space.1` | 4px | Icon-to-label gap, tight inline pairs only |
| `space.2` | 8px | Between related inline elements |
| `space.3` | 12px | Chip internal padding (v), list item internal |
| `space.4` | 16px | Standard component padding, card row gaps |
| `space.5` | 24px | Card internal padding (standard) |
| `space.6` | 32px | Between card sections, major row groups |
| `space.7` | 48px | Between page sections |
| `space.8` | 64px | Screen top/bottom breathing room |
| `space.9` | 80px | Hero section vertical padding |
| `space.10` | 96px | Max section padding (large hero areas) |

**Relationship rule:** If two related elements are `space.4` apart, the gap to the next unrelated group must be at least `space.6` (1.5–2× multiplier).

**Screen horizontal padding:** 20px (not a token — this is a layout constant for safe area alignment)

---

## 4. Core Component Specs

### 4a. Buttons

#### Primary Button
```
Background:     brand.primary (#3d8ef8)
Pressed state:  brand.primaryStrong (#1a6ed4)
Text:           text.primary (#f0f0fa), body size, weight 600
Padding:        14px vertical, 24px horizontal
Border radius:  14px
Min height:     52px (thumb zone compliant)
Inner shadow:   inset 0 1px 0 rgba(255,255,255,0.15)  ← subtle top highlight
Shadow:         0 4px 16px rgba(61,142,248,0.30)  ← brand-tinted glow
Loading state:  ActivityIndicator (white) replaces label
Disabled:       opacity 0.4, no shadow
Full width:     flex: 1 (standard for form CTAs)
```

#### Secondary Button
```
Background:     brand.primaryDim (rgba(61,142,248,0.12))
Border:         1px solid rgba(61,142,248,0.25)
Text:           brand.primary, body size, weight 600
Padding:        13px vertical, 24px horizontal
Border radius:  14px
Min height:     52px
Shadow:         none
```

#### Ghost / Text Button
```
Background:     transparent
Text:           text.secondary, body size, weight 500
Underline:      none (use color alone for affordance)
Used for:       "Edit", "Cancel", minor actions
```

#### Destructive Button
```
Background:     semantic.lossDim (rgba(255,82,82,0.12))
Border:         1px solid rgba(255,82,82,0.25)
Text:           semantic.lossText (#ff7272), body size, weight 600
Border radius:  14px
Min height:     52px
Used for:       Delete Goal, Log Out confirm
```

---

### 4b. Cards

#### Base Card
```
Background:     bg.surface (#0f0f1c)
Border:         1px solid border.default (#252538)
Border radius:  20px
Padding:        24px (space.5)
Shadow:         0 2px 12px rgba(0,0,0,0.35)
```

#### Elevated Card (modals, AI insight callouts)
```
Background:     bg.elevated (#161628)
Border:         1px solid border.strong (#363650)
Border radius:  24px
Padding:        24px
Shadow:         0 8px 32px rgba(0,0,0,0.50)
```

#### Accent / Highlight Card (AI suggestions, active goal)
```
Background:     brand.primaryDim (rgba(61,142,248,0.08))
Border:         1px solid rgba(61,142,248,0.20)
Border radius:  20px
Padding:        20px
Left accent bar: 3px wide, brand.primary, full height, border-radius left side
```

#### Gain Card (surplus, ahead-of-schedule goals)
```
Background:     semantic.gainDim
Border:         1px solid rgba(0,200,150,0.20)
Border radius:  20px
Left accent bar: semantic.gain
```

#### Loss / Alert Card
```
Background:     semantic.lossDim
Border:         1px solid rgba(255,82,82,0.20)
Border radius:  20px
Left accent bar: semantic.loss
```

---

### 4c. Input Fields

```
Background:       bg.input (#1a1a2e)
Border:           1px solid border.default (#252538)
Border (focused): 1px solid border.focused (#3d8ef8)
Background glow (focused): 0 0 0 3px rgba(61,142,248,0.10)
Border radius:    14px
Padding:          16px horizontal, 14px vertical
Min height:       52px
Label:            caption size, text.tertiary, 8px above field
Value text:       body size, text.primary, tabular-nums for amount fields
Placeholder:      text.disabled (#3a3a50)
Error state:      border 1px solid semantic.loss; error text below in caption/loss color
Currency prefix:  h2 size, text.secondary — visually prominent, sits left of amount
```

---

### 4d. Progress Bar

```
Track:          bg.elevated (#161628), border-radius 99px
Fill:           brand.primary (default) / semantic.gain (>80%) / semantic.warning (stalled)
Height:         6px (standard) / 10px (goal card featured)
Animated:       Width transition 400ms ease-out on mount
Label:          caption above or beside — "62% complete"
```

#### Goal Progress Ring (SVG, GoalPulse screen)
```
Diameter:       160px
Track stroke:   bg.elevated, width 12px
Fill stroke:    brand.primary → semantic.gain gradient as % increases
Center text:    display size for %, h2 for goal name
Glow:           Drop shadow matching fill color at 30% opacity
```

---

### 4e. Bottom Tab Bar

_Currently missing — needs to be introduced for Pulse / Vault / Invest / Profile navigation._

```
Background:     bg.elevated (#161628)
Border top:     1px solid border.subtle (#1a1a2c)
Height:         64px + safe area inset
Tab count:      4 (Pulse, Vault, Invest, Profile)
Icon size:      24px
Active icon:    brand.primary, filled
Inactive icon:  text.tertiary, outlined
Active label:   caption, brand.primary, weight 600
Inactive label: caption, text.tertiary, weight 400
Active bg pill: brand.primaryDim, 40px × 28px, border-radius 99px, behind icon
```

Tab definitions:
| Tab | Icon | Label |
|---|---|---|
| Pulse | `target` / `activity` | Pulse |
| Vault | `landmark` / `wallet` | Vault |
| Invest | `trending-up` | Invest |
| Profile | `user` | Profile |

---

### 4f. Badges & Chips

#### Value Badge (e.g., +1.2%, -₹500)
```
Padding:        4px 10px
Border radius:  99px (pill)
Gain:           bg semantic.gainDim, text semantic.gainText
Loss:           bg semantic.lossDim, text semantic.lossText
Neutral:        bg semantic.neutralDim, text text.secondary
Typography:     caption, weight 600, tabular-nums
```

#### Tag / Category Chip
```
Padding:        6px 14px
Border radius:  99px
Background:     bg.elevated
Border:         1px solid border.default
Text:           caption, text.secondary, weight 500
Selected:       brand.primaryDim background, brand.primary border, brand.primary text
```

---

### 4g. Notification / Type Badge (NotificationScreen)

```
Shape:          40×40 rounded-full container
suggestion:     bg status.suggestion at 15% opacity, icon text status.suggestion
alert:          bg status.alert at 15% opacity
update:         bg status.update at 15% opacity
achievement:    bg status.achievement at 15% opacity
```

---

### 4h. AnimatedMascot (brand preservation)

The mascot is a signature element — elevate it, don't flatten it.

```
Size variants:  small (48px), medium (80px), large (120px)
Animation:      Floating — translateY ±8px, 2.4s sine ease-in-out, loop
Tooltip:        bg.elevated, border border.default, border-radius 16px, 
                max-width 220px, body text, text.secondary
Tooltip tail:   8px triangle pointing to mascot
Entry:          Slide up + fade in, 300ms, delay 400ms after screen mount
Positioning:    Bottom-right corner (standard), bottom-left on forms
Elevation:      Always renders above card layer (z-index / elevation: 10)
```

---

## 5. Elevation / Shadow System

| Level | Usage | Shadow spec |
|---|---|---|
| `shadow.none` | Flat elements, inline | — |
| `shadow.sm` | Row items, list elements | `0 1px 4px rgba(0,0,0,0.25)` |
| `shadow.md` | Cards (base) | `0 2px 12px rgba(0,0,0,0.35)` |
| `shadow.lg` | Elevated cards, dropdowns | `0 8px 32px rgba(0,0,0,0.50)` |
| `shadow.brand` | Primary button | `0 4px 16px rgba(61,142,248,0.30)` |
| `shadow.gain` | Gain cards, progress ring | `0 4px 16px rgba(0,200,150,0.20)` |

_Rule: Shadow color always tinted to background or element color — never pure black._

---

## 6. Motion & Animation Principles

| Interaction | Duration | Easing | Notes |
|---|---|---|---|
| Screen entry | 280ms | `ease-out` | Translate Y +20px → 0, opacity 0→1 |
| Button press | 100ms | `ease-in` | Scale 0.97 |
| Card press | 120ms | `ease-in-out` | Opacity 0.85 |
| Progress fill | 600ms | `ease-out` | On screen mount, 0 → actual % |
| Toast appear | 250ms | `spring (tension 80, friction 10)` | Slide down from top |
| Modal appear | 320ms | `ease-out` | Scale 0.94→1, opacity 0→1 |
| Mascot float | 2400ms | `sin ease-in-out` | Continuous loop |
| Mascot entry | 300ms + 400ms delay | `ease-out` | Slide up + fade |

---

## 7. Iconography

**Library:** Lucide React Native (already likely available; consistent, clean, 2px stroke)
**Size standard:** 
- Nav bar icons: 24px
- Card/row icons: 20px  
- Inline / label icons: 16px
**Stroke width:** 1.5px (lighter than default for premium feel)
**Color:** Inherit from text context (text.secondary default, brand.primary for active)

---

## 8. Screen-Level Layout Template

```
SafeAreaView (bg.base)
├── StatusBar: light-content, translucent
├── ScrollView / FlatList
│   ├── Screen header (h1, text.primary) — 20px horizontal padding, 24px top
│   ├── Hero section — large number or key stat (display type, tabular-nums)
│   ├── Section 1 (space.7 top margin)
│   │   ├── Section label (caption, text.tertiary, UPPERCASE, letter-spacing 1px)
│   │   └── Cards / rows (space.3 gap between items)
│   ├── Section 2 (space.7 top margin)
│   └── ...
└── Bottom Tab Bar (fixed, bg.elevated)
```

---

## 9. Fintech-Specific Conventions Applied

Per the `references/industry-conventions.md` guidance for fintech:

1. **Values larger than labels** — ₹82,000 in `display` type; "Monthly Income" in `caption`. Never reversed.
2. **Gain = teal, Loss = red** — globally consistent. No other element uses these colors for non-semantic purposes.
3. **Monospace numbers everywhere** — `fontVariant: ['tabular-nums']` on all currency/metric Text components.
4. **Trust signals** — subtle animations, soft shadows, consistent spacing communicate precision and reliability.
5. **Empty states** — never blank; always show mascot + guidance + primary CTA.
6. **Pull-to-refresh** — keep existing behavior; style refresh indicator to match brand blue.
7. **Contribution day / calendar** — keep as-is (good UX); restyle modal to match elevated card spec.

---

## 10. What Changes vs. What Stays

| Element | Current | Proposed change |
|---|---|---|
| Background | `#0a0a14` | `#080811` (minimal, barely perceptible — maintains continuity) |
| Card background | `#12121f` | `#0f0f1c` |
| Primary blue | `#2d7ff9` | `#3d8ef8` (warmer, better contrast) |
| Success green | `#4dff7c` (neon) | `#00c896` (teal — less jarring, more premium) |
| Error red | `#ff4d4d` | `#ff5252` (nearly same) |
| Heading size | 28px (h1) | 26px h1 + new 38px display tier |
| Body size | 16px | 15px (tighter, more content per screen) |
| Spacing base | 4px inconsistent | Strict 8pt grid |
| Tab navigation | Stack-only | Add persistent bottom tab bar |
| Shadow style | Not defined | Soft, brand-tinted shadow system |
| Number rendering | Default font | `fontVariant: ['tabular-nums']` |
| Mascot | Keep exactly | Elevate with cleaner tooltip card style |
| AnimatedMascot | Keep exactly | Tooltip card updated to `bg.elevated` spec |

---

## Summary Checklist for Phase 3 Approval

- [ ] Color system — 5 surface tiers, brand, 3 semantic (gain/loss/warning), text hierarchy, borders, chart palette
- [ ] Typography — Inter font, 5-tier scale (display + h1 + h2 + body + caption), tabular-nums for numbers
- [ ] Spacing — strict 8pt grid, 10 named tokens
- [ ] Buttons — 4 variants (primary, secondary, ghost, destructive)
- [ ] Cards — 5 variants (base, elevated, accent, gain, loss)
- [ ] Input — with focus, error, currency-prefix states
- [ ] Progress bar + Goal ring
- [ ] Bottom tab bar (new)
- [ ] Badges, chips, notification badges
- [ ] AnimatedMascot elevation
- [ ] Shadow system (6 levels)
- [ ] Motion/animation timing table
- [ ] Iconography standard (Lucide, 1.5px stroke)
