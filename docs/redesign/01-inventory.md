# Finova AI — Screen & Component Inventory
_Phase 1 of redesign. Read-only scan. Date: 2026-08-04_

---

## Project Overview

| Property | Value |
|---|---|
| App name | monefyai (display) / finovaai (package) |
| Tech stack | React Native 0.74.2, React 18.2.0, TypeScript 5.0.4 |
| Styling approach | React Native `StyleSheet` API — dark theme only |
| Navigation | React Navigation (native-stack + bottom-tabs) |
| State management | Redux Toolkit + React Context (currency) + AsyncStorage |
| Animation | RN Animated API + Reanimated 3 |
| Push notifications | Firebase Cloud Messaging + Notifee |
| API base URL | `https://finance-management-service.onrender.com` |

---

## Navigation Architecture

```
RootNavigator (Stack)
├── AuthNavigator (Stack)
│   ├── Login  ← initial screen
│   ├── Signup
│   └── OTPVerification
├── OnboardingNavigator (Stack)
│   ├── MonthlyIncome  ← initial screen
│   ├── MonthlyExpenses
│   ├── MonthlyEMI
│   ├── EMIOutstanding
│   ├── MonthlyInvestment
│   ├── GoalSelection
│   └── AddGoal
└── MainStackNavigator (Stack)
    ├── Pulse  ← initial screen (Goal Pulse dashboard)
    ├── Vault
    ├── Invest
    ├── Profile
    ├── Notifications
    ├── EditGoal
    ├── GoalChat
    ├── AddGoal
    ├── Contributions
    ├── PersonalInfo
    ├── PrivacySecurity
    ├── HelpSupport
    ├── NotificationSettings
    └── EditFinancialDetails
```

Routing logic (App.tsx): no token → Auth; token + no profile → Onboarding; token + profile → Main.

---

## Screen Inventory

### Auth Screens (3)

#### 1. LoginScreen
- **File:** `src/screens/auth/LoginScreen.tsx`
- **Nav entry:** `AuthNavigator` → `Login` (initial)
- **Key UI elements:** Logo (large), "Welcome Back" title + subtitle, email input, Continue button, sign-up link, AnimatedMascot (bottom)
- **Shared components:** `Logo`, `Input`, `Button`, `FooterLinks`, `AnimatedMascot`

#### 2. SignupScreen
- **File:** `src/screens/auth/SignupScreen.tsx`
- **Nav entry:** `AuthNavigator` → `Signup`
- **Key UI elements:** Logo (medium), "Create Account" title + subtitle, Full Name / Email / Age inputs, Continue button, login link, AnimatedMascot, FooterLinks
- **Shared components:** `Logo`, `Input`, `Button`, `FooterLinks`, `AnimatedMascot`

#### 3. OTPVerificationScreen
- **File:** `src/screens/auth/OTPVerificationScreen.tsx`
- **Nav entry:** `AuthNavigator` → `OTPVerification`
- **Key UI elements:** BackButton, "Verify your email" title, email display + edit link, 6-digit OTPInput, 54-second resend countdown, Verify & Continue button
- **Shared components:** `BackButton`, `OTPInput`, `Button`

---

### Onboarding Screens (7)

#### 4. MonthlyIncomeScreen
- **File:** `src/screens/onboarding/MonthlyIncomeScreen.tsx`
- **Nav entry:** `OnboardingNavigator` → `MonthlyIncome` (initial)
- **Progress:** Step 1 / 5 (20%)
- **Key UI elements:** Step counter header, progress bar, 💰 emoji, title, currency + amount input, Continue button, AnimatedMascot
- **Shared components:** `Header`, `Button`, `AnimatedMascot`

#### 5. MonthlyExpensesScreen
- **File:** `src/screens/onboarding/MonthlyExpensesScreen.tsx`
- **Nav entry:** `OnboardingNavigator` → `MonthlyExpenses`
- **Progress:** Step 2 / 5 (40%)
- **Key UI elements:** Step counter header, progress bar, 🛒 emoji, title, currency + amount input, Continue button, AnimatedMascot
- **Shared components:** `Header`, `Button`, `AnimatedMascot`

#### 6. MonthlyEMIScreen
- **File:** `src/screens/onboarding/MonthlyEMIScreen.tsx`
- **Nav entry:** `OnboardingNavigator` → `MonthlyEMI`
- **Progress:** Step 3 / 5 (60%)
- **Key UI elements:** Step counter header, progress bar, title, currency + amount input, Continue button, AnimatedMascot
- **Shared components:** `Header`, `Button`, `AnimatedMascot`

#### 7. EMIOutstandingScreen
- **File:** `src/screens/onboarding/EMIOutstandingScreen.tsx`
- **Nav entry:** `OnboardingNavigator` → `EMIOutstanding`
- **Progress:** Step 4 / 5 (80%)
- **Key UI elements:** Step counter header, progress bar, title, currency + amount input, Continue button
- **Shared components:** `Header`, `Button`

#### 8. MonthlyInvestmentScreen
- **File:** `src/screens/onboarding/MonthlyInvestmentScreen.tsx`
- **Nav entry:** `OnboardingNavigator` → `MonthlyInvestment`
- **Progress:** Step 5 / 5 (100%)
- **Key UI elements:** Step counter header, progress bar, title, currency + amount input, Continue button
- **Shared components:** `Header`, `Button`

#### 9. GoalSelectionScreen
- **File:** `src/screens/onboarding/GoalSelectionScreen.tsx`
- **Nav entry:** `OnboardingNavigator` → `GoalSelection`
- **Key UI elements:** BackButton, "Select your goal" title, AI-generated GoalCard list (emoji + title + description), AnimatedMascot, loading state
- **Shared components:** `BackButton`, `Button`, `GoalCard`, `AnimatedMascot`

#### 10. AddGoalScreen (onboarding entry)
- **File:** `src/screens/onboarding/AddGoalScreen.tsx`
- **Nav entry:** `OnboardingNavigator` → `AddGoal` (also accessible from Main)
- **Key UI elements:** BackButton, goal name input, target amount input, duration chips (6mo/1yr/2yr/3yr/5yr/custom), auto-calculated monthly contribution display, contribution day picker, calendar modal, Submit button, AnimatedMascot
- **Shared components:** `BackButton`, `Button`, `Header`, `AnimatedMascot`

---

### Main App Screens (13)

#### 11. GoalPulseScreen
- **File:** `src/screens/main/GoalPulseScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `Pulse` (initial)
- **Key UI elements:** Goal list, circular SVG progress rings (160px), GoalCardWithSuggestion components, AI suggestion cards, average achievement metric, "New Goal" section, MascotLoader (loading), pull-to-refresh
- **Shared components:** `Card`, `GoalCardWithSuggestion`, `ProgressBar`, `AnimatedMascot`, `MascotLoader`
- **Navigates to:** EditGoal, GoalChat, AddGoal, Contributions

#### 12. VaultScreen
- **File:** `src/screens/main/VaultScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `Vault`
- **Key UI elements:** Consolidated/Manual toggle, total liquid balance, "Available to Invest" + "Monthly Yield" stat cards, connected accounts list (AccountRow per account), monthly spends chart placeholder, category legend
- **Shared components:** `Card`, `StatCard`, `AccountRow`, `AIInsightCard`

#### 13. InvestHubScreen
- **File:** `src/screens/main/InvestHubScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `Invest`
- **Key UI elements:** "Invest Hub" header + search icon, portfolio value + +1.2% badge, AI Portfolio Optimizer card, asset rows (Mutual Funds / Digital Gold / Fixed Deposits), FAB for adding assets
- **Shared components:** `Card`, `AssetRow`, `AIInsightCard`

#### 14. ProfileScreen
- **File:** `src/screens/main/ProfileScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `Profile`
- **Key UI elements:** BackButton, "Profile" title, user avatar (initials/emoji), name + email, menu items (Profile Info / Settings / Help), Logout button, logout confirmation modal
- **Shared components:** `BackButton`

#### 15. NotificationScreen
- **File:** `src/screens/main/NotificationScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `Notifications`
- **Key UI elements:** BackButton, notification list with type-coded items (suggestion ⚡ orange / alert ⚠️ red / update ✅ green / achievement 🏆 purple), timestamp, read status
- **Shared components:** `BackButton`

#### 16. EditGoalScreen
- **File:** `src/screens/main/EditGoalScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `EditGoal`
- **Key UI elements:** Edit form (name, target, duration, monthly contribution, contribution day), Save button, Delete button, confirmation modals
- **Shared components:** (inline styles + modals)

#### 17. GoalChatScreen
- **File:** `src/screens/main/GoalChatScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `GoalChat`
- **Key UI elements:** Header with goal title, "Coming Soon" UI, "Join Waitlist" button, loading state
- **Shared components:** (minimal)

#### 18. ContributionsScreen
- **File:** `src/screens/main/ContributionsScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `Contributions`
- **Key UI elements:** Contribution details, timeline visualization, contribution history, upcoming contributions forecast
- **Shared components:** (to be confirmed — file not fully read)

#### 19. PersonalInfoScreen
- **File:** `src/screens/main/PersonalInfoScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `PersonalInfo`
- **Key UI elements:** User details display, edit form (name, email, phone, DOB)
- **Shared components:** (to be confirmed)

#### 20. PrivacySecurityScreen
- **File:** `src/screens/main/PrivacySecurityScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `PrivacySecurity`
- **Key UI elements:** Privacy policy section, security settings, permission toggles, data deletion options
- **Shared components:** (to be confirmed)

#### 21. HelpSupportScreen
- **File:** `src/screens/main/HelpSupportScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `HelpSupport`
- **Key UI elements:** FAQ section, contact support form, help topics list
- **Shared components:** (to be confirmed)

#### 22. NotificationSettingsScreen
- **File:** `src/screens/main/NotificationSettingsScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `NotificationSettings`
- **Key UI elements:** Notification category toggles (suggestions, alerts, achievements), quiet hours settings
- **Shared components:** (to be confirmed)

#### 23. EditFinancialDetailsScreen
- **File:** `src/screens/main/EditFinancialDetailsScreen.tsx`
- **Nav entry:** `MainStackNavigator` → `EditFinancialDetails`
- **Key UI elements:** Editable inputs for all 5 financial metrics (income, expenses, EMI, outstanding, investment), Save + Cancel buttons
- **Shared components:** (to be confirmed)

---

## Shared Components Inventory

All located in `src/components/`

| File | Export(s) | Description |
|---|---|---|
| `Button.tsx` | `Button` | Primary CTA — blue bg, 16px v-padding, 12px radius, loading + disabled states, optional arrow icon |
| `Input.tsx` | `Input` | Text input with label, left icon, error display, focus ring |
| `Logo.tsx` | `Logo` | Brand logo; sizes: small (48px) / medium (64px) / large (80px) |
| `BackButton.tsx` | `BackButton` | Bordered back chevron (`‹`) for stack navigation |
| `OTPInput.tsx` | `OTPInput` | 6-digit OTP boxes with auto-focus, numbers-only |
| `FooterLinks.tsx` | `FooterLinks` | Auth toggle link + Terms & Privacy links |
| `GoalCard.tsx` | `GoalCard` | Selectable goal card — emoji icon, title, description, amount badge, checkmark |
| `Header.tsx` | `Header` | Centered title + optional back button + right slot (used in onboarding) |
| `AnimatedMascot.tsx` | `AnimatedMascot` | Floating "Fino" mascot with tooltip and slide-in animation; configurable position/size |
| `MascotLoader.tsx` | `MascotLoader` | Mascot-based loading spinner with floating shadow |
| `SkeletonLoader.tsx` | `SkeletonLoader` | Pulsing placeholder; configurable width, height, border-radius |
| `ConfirmationModal.tsx` | `ConfirmationModal` | Reusable modal — variants: success/error/warning/info; dual action buttons |
| `CustomToast.tsx` | `toastConfig` | Toast config for react-native-toast-message; success/error/info; includes mascot image |
| `DashboardComponents.tsx` | `Card`, `ProgressBar`, `StatCard`, `AccountRow`, `GoalCard` (dashboard), `GoalCardWithSuggestion`, `AIInsightCard`, `AssetRow` | All main-app card/row primitives |
| `OnboardingComponents.tsx` | `SelectOption`, `ChipOption`, `Counter` | Single-select option, chip selector, +/- counter |

---

## Current Design System (theme.ts)

### Colors (`src/constants/theme.ts`)

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0a0a14` | App background (deep dark navy) |
| `cardBackground` | `#12121f` | Card surfaces |
| `inputBackground` | `#1a1a2e` | Input fields |
| `primary` | `#2d7ff9` | CTAs, links, focused borders, accent |
| `primaryDark` | `#1a5fc7` | Primary hover/pressed |
| `textPrimary` | `#ffffff` | Headings and main text |
| `textSecondary` | `#8a8a9a` | Secondary/muted text |
| `textMuted` | `#cacadb` | Very muted labels |
| `border` | `#2a2a3e` | Default borders |
| `borderFocused` | `#2d7ff9` | Input focused state |
| `error` | `#ff4d4d` | Errors, destructive actions |
| `success` | `#4dff7c` | Success states |
| `link` | `#2d7ff9` | Links (same as primary) |

**Missing fintech tokens:** No explicit gain/loss/neutral color tokens. No warning/amber. No chart series colors. No balance/surplus/deficit semantic tokens.

### Typography

| Token | Size | Usage |
|---|---|---|
| `h1` | 28px | Headings |
| `h2` | 24px | Subheadings |
| `h3` | 20px | Section titles |
| `body` | 16px | Body text |
| `bodySmall` | 14px | Small body |
| `caption` | 12px | Labels/captions |

Weights: regular (400), medium (500), semibold (600), bold (700).

**Missing:** No monospace font for financial numbers. No display/hero size (32–40px).

### Spacing

| Token | Value |
|---|---|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `xxl` | 48px |

**Gap:** Spacing scale uses a 4px base — partially 8pt grid compatible but `xs: 4` and non-multiples of 8 exist in screen stylesheets.

---

## Observations for Redesign

1. **No shared tab bar component** — the main app uses a stack navigator but no visible persistent bottom tab bar component was found. Navigation between Pulse/Vault/Invest/Profile appears to be through in-screen buttons or headers.
2. **Mascot is a central brand element** — AnimatedMascot appears on 8+ screens; must be preserved and elevated.
3. **DashboardComponents.tsx is a monolithic file** — all main-app card types live in one file; redesign should keep this pattern or split thoughtfully.
4. **Three screens are "shells"** — GoalChatScreen (Coming Soon), and some settings screens (PersonalInfo, PrivacySecurity, HelpSupport, NotificationSettings) may be minimal stubs.
5. **No chart library in use yet** — InvestHub and Vault have chart placeholders but no active charting library (no Victory, Recharts, or similar in package.json).
6. **Currency is dynamic** — ₹ is default but currency symbol is context-driven; redesign must keep all currency displays going through `useCurrency()`.
7. **Dark-only theme** — No light mode support exists; redesign can lean into premium dark fintech aesthetic (Revolut/Robinhood style).
