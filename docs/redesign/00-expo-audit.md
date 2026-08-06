# Expo Go Compatibility Audit — finovaAi
_Date: 2026-08-05 · Read-only audit · No files were modified_

---

## Project Info

| Property | Value |
|---|---|
| App name | monefyai |
| React Native | 0.74.2 |
| React | 18.2.0 |
| TypeScript | 5.0.4 |
| Entry point | `index.js` → `App.tsx` |
| Min Android SDK | 24 |
| Target Android SDK | 35 |
| Min iOS | 12.4 |
| Project type | React Native CLI (bare — not Expo init) |

---

## Dependency Audit

| Package | Version | Native Code? | Expo Go Status | Notes |
|---|---|---|---|---|
| `react` | 18.2.0 | No | ✅ | Pure JS |
| `react-native` | 0.74.2 | N/A | — | Core RN |
| `@react-navigation/native` | 7.1.28 | No | ✅ | Pure JS |
| `@react-navigation/native-stack` | 7.11.0 | No | ✅ | Pure JS |
| `@react-navigation/bottom-tabs` | 7.10.1 | No | ✅ | Pure JS |
| `react-native-safe-area-context` | 4.14.1 | YES | ✅ In Expo SDK | Fully supported in Expo Go |
| `react-native-screens` | 4.0.0 | YES | ✅ In Expo SDK | Fully supported in Expo Go |
| `react-native-svg` | 13.4.0 | YES | ✅ In Expo SDK | Fully supported in Expo Go |
| `react-native-reanimated` | 3.9.0 | YES | ✅ In Expo SDK | Fully supported in Expo Go |
| `react-native-toast-message` | 2.3.3 | No | ✅ | Pure JS — works anywhere |
| `@react-native-async-storage/async-storage` | 2.2.0 | YES | ✅ In Expo SDK | Bundled in Expo Go |
| `@reduxjs/toolkit` | 2.11.2 | No | ✅ | Pure JS |
| `react-redux` | 9.2.0 | No | ✅ | Pure JS |
| `redux` | 5.0.1 | No | ✅ | Pure JS |
| `axios` | 1.10.0 | No | ✅ | Pure JS |
| **`@react-native-firebase/app`** | **23.8.6** | **YES** | ❌ **BLOCKER** | Native Firebase SDK — not in Expo Go |
| **`@react-native-firebase/messaging`** | **23.8.6** | **YES** | ❌ **BLOCKER** | FCM native SDK — not in Expo Go |
| **`@notifee/react-native`** | **9.1.8** | **YES** | ❌ **BLOCKER** | Native notifications — not in Expo Go. Replace: `expo-notifications` |
| `@babel/core` + presets | 7.20.x | No | ✅ | Dev only |
| `@react-native/*` tooling | 0.74.x | No | ✅ | Dev only |
| `typescript` | 5.0.4 | No | ✅ | Dev only |
| `jest`, `babel-jest` | 29.6.x | No | ✅ | Dev only |

---

## Custom Native Code

### iOS (`ios/`)

| File | Type | Verdict |
|---|---|---|
| `ios/monefyai/AppDelegate.mm` | ObjC++ | ✅ Boilerplate only — standard RN AppDelegate |
| `ios/monefyai/AppDelegate.h` | Header | ✅ Boilerplate only |
| `ios/monefyai/main.m` | ObjC | ✅ Boilerplate only — standard UIApplicationMain |
| `ios/monefyaiTests/monefyaiTests.m` | Test | ✅ Boilerplate only |

**No custom native iOS code found.**

### Android (`android/`)

| File | Type | Verdict |
|---|---|---|
| `android/app/src/main/java/com/monefyai/MainActivity.kt` | Kotlin | ✅ Boilerplate only — extends ReactActivity |
| `android/app/src/main/java/com/monefyai/MainApplication.kt` | Kotlin | ✅ Boilerplate only — auto-linking setup |

**No custom native Android code found.**

---

## Native Config Findings

### `ios/monefyai/Info.plist`
- `NSLocationWhenInUseUsageDescription` — location permission declared (empty string; appears unused)
- `NSAllowsLocalNetworking: true` — allows local network debugging
- `NSAllowsArbitraryLoads: false` — HTTP restricted (correct)
- **No Firebase config keys**
- **No `GoogleService-Info.plist` found in `ios/`** — Firebase iOS not fully configured yet
- **No custom URL schemes or push entitlements**

### `android/app/src/main/AndroidManifest.xml`
- `android.permission.INTERNET` — only custom permission
- `MainApplication` and `MainActivity` — standard
- **No Firebase receivers, services, or intent filters**
- **No `google-services.json` found at `android/app/`** — Firebase Android not fully configured yet

### `ios/Podfile`
- Uses `use_native_modules!` for auto-linking
- Standard `react_native_post_install` hook
- **No manually added custom pods**
- Firebase and Notifee pods will be auto-linked when `pod install` runs

### `android/app/build.gradle`
- `com.google.gms.google-services` plugin applied — **Firebase Gradle plugin configured**
- Standard RN auto-linking dependencies
- No other custom native dependencies

### `src/services/NotificationService.ts` — Native API surface
```ts
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
```
Native calls made:
- `messaging().requestPermission()` — FCM native bridge
- `messaging().getToken()` — FCM token retrieval
- `messaging().onMessage()` — foreground handler
- `messaging().setBackgroundMessageHandler()` — background task
- `notifee.requestPermission()` — native permission
- `notifee.createChannel()` — Android notification channel
- `notifee.displayNotification()` — local notification

**`NotificationService` is called on app startup in `App.tsx` — this means the app WILL crash immediately on Expo Go.**

---

## Verdict

### ✅ Expo Go Compatible (no changes needed)
- All `@react-navigation/*` packages
- `react-native-safe-area-context`
- `react-native-screens`
- `react-native-svg`
- `react-native-reanimated`
- `react-native-toast-message`
- `@react-native-async-storage/async-storage`
- `@reduxjs/toolkit`, `react-redux`, `redux`
- `axios`
- All dev dependencies

### ⚠️ Needs Replacement (Expo SDK equivalent exists)
| Package | Expo Replacement | Migration Effort |
|---|---|---|
| `@notifee/react-native` | `expo-notifications` | Medium — API surface differs |

### 🚫 Blockers (no pure Expo Go path)
| Package | Reason | Options |
|---|---|---|
| `@react-native-firebase/app` | Native Firebase SDK not bundled in Expo Go — app crashes on init | A) Expo Dev Client · B) Firebase JS SDK (loses native push) · C) Stay RN CLI |
| `@react-native-firebase/messaging` | FCM native SDK not in Expo Go — token retrieval and background handlers unavailable | A) Expo Dev Client · B) `expo-notifications` + backend push service · C) Stay RN CLI |

**Root cause:** Firebase is initialized at app startup in `App.tsx` before any screen renders. There is no way to lazy-load around this in Expo Go.

---

## Migration Effort Estimate

### Option A — Expo Dev Client (recommended)
**Effort: Easy · ~1–2 days · Zero code changes**

Keep Firebase + Notifee. Use EAS to build a custom dev client that includes the native modules.

```bash
npm install -g eas-cli
eas init
eas build --platform android --profile preview
```

Install the resulting APK, then run `expo start --dev-client` locally. Full Firebase + Notifee support, all Expo tooling benefits, OTA updates via EAS Update.

### Option B — Migrate to pure Expo Go
**Effort: Hard · ~2–3 weeks · Significant refactor**

1. Remove `@react-native-firebase/app` and `@react-native-firebase/messaging`
2. Remove `@notifee/react-native`
3. Install `expo-notifications`
4. Rewrite `NotificationService.ts` entirely — new permission flow, new token API, new channel setup
5. Implement backend push delivery via `expo-notifications` server SDK or a 3rd-party service (OneSignal, Courier, etc.)
6. Re-test all notification flows (foreground / background / terminated state)

### Option C — Stay on React Native CLI
**Effort: None · Already done**

No Expo Go support. Build APKs via `./gradlew assembleDebug` or EAS Build without `eas init`. Maximum native flexibility.

---

## Recommendation

**→ Use Expo Dev Client (Option A).**

The app has no custom native code — every native dependency comes from npm packages. This is the ideal profile for Expo Dev Client: you get all Expo tooling (EAS Build, OTA updates, unified config) without rewriting anything. The migration is 1–2 days of configuration, not code.

Pure Expo Go is not viable without replacing the entire notification infrastructure — a significant risk for a production feature.

---

## Quick Reference — What Would Crash in Expo Go

```
App starts
  └─ App.tsx initializes NotificationService
       ├─ import messaging from '@react-native-firebase/messaging'  ← CRASH: native module missing
       └─ import notifee from '@notifee/react-native'              ← CRASH: native module missing
```

**Crash type:** `Invariant Violation: Native module cannot be null` or similar bridge error — happens before any UI renders.
