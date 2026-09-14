# iOS readiness assessment — 2026-09-14

**Verdict: NOT READY.** The app has never been built for iOS. Same story as most bare-RN projects where Android was the primary target. Nothing here is a design problem — the JS side is fine and would run identically on iOS — but the iOS project scaffolding, native module linking, Firebase config, and Apple submission metadata all need one-time setup.

Estimated effort to first successful TestFlight build: **1 focused day** for someone comfortable with Xcode.

---

## Check-by-check

| # | Check | Result | Note |
| --- | --- | --- | --- |
| 1 | Xcode workspace | ✅ | `ios/monefyai.xcworkspace` exists |
| 2 | `Podfile.lock` fresh | ❌ | Last modified **2025-08-03** — pre-dates gesture-handler, sonner-native, and probably most current deps |
| 3 | Native RN modules linked | ❌ | **Zero** of gesture-handler, reanimated, svg, screens, safe-area, async-storage, firebase, notifee are in the lockfile |
| 4 | Mandatory Info.plist keys | ✅ | Bundle-id / display-name / short-version / bundle-version / launch-storyboard all present |
| 5 | Push entitlement | ❌ | No `aps-environment` in any `.entitlements` — FCM messages won't arrive on iOS |
| 6 | `GoogleService-Info.plist` | ❌ | Missing — `@react-native-firebase/messaging` will crash on init |
| 7 | Inter fonts | ⚠️ | In `assets/fonts/` (5) and `Info.plist` (5), but **0** references in `project.pbxproj` — Xcode isn't copying them into the bundle, so iOS won't find them at runtime |
| 8 | App icon | ❌ | `AppIcon.appiconset` directory exists but is **empty** — no PNGs. Marketing 1024×1024 and every device size missing |
| 9 | Launch storyboard | ✅ | `LaunchScreen.storyboard` present |
| 10 | Bundle identifier | ❌ | Template default `org.reactjs.native.example.$(PRODUCT_NAME...)` — App Store will reject; also mismatch — the Xcode project is named `monefyai` but the RN app is `finovaAi` |
| 11 | Deployment target | ✅ | `IPHONEOS_DEPLOYMENT_TARGET = 13.4` — meets RN 0.74's floor |
| 12 | `ITSAppUsesNonExemptEncryption` | ⚠️ | Not declared — Apple will prompt on every TestFlight upload |
| 13 | Privacy manifest | ✅ | `ios/monefyai/PrivacyInfo.xcprivacy` present |
| 14 | Reanimated Babel plugin | ✅ | Configured — worklets will compile |
| 15 | `use_frameworks!` | ⚠️ | Gated on `USE_FRAMEWORKS` env var — default is off (`use_modular_headers!`), safe for Firebase |
| 16 | Signing team | ⚠️ | No `DEVELOPMENT_TEAM` set — fine for local Xcode, must be set for CI or `xcodebuild archive` |

**Totals:** 6 FAIL, 4 WARN, 6 PASS.

---

## Blocker checklist (in the order to fix)

1. **`cd ios && bundle exec pod install`** — refreshes the lockfile and links every currently installed RN native module. This one command clears checks **2, 3, 7 (partially — fonts get linked into the Copy Bundle Resources phase via `react-native-asset`).**
   - Prereq: `sudo gem install cocoapods` or `bundle install` from `ios/Gemfile` if present.
   - If `pod install` fails on Ruby / Xcode CLI version mismatch, use `xcode-select --install` and retry.
2. **`npx react-native-asset`** — copies the fonts into `Copy Bundle Resources` on the Xcode target. (Alternative: open Xcode → drag `assets/fonts/*.ttf` onto the app target, tick "Copy items if needed" and the app target's checkbox.)
3. **Bundle identifier + team**. Open `ios/monefyai.xcworkspace` in Xcode → target `monefyai` → General:
   - Set `Bundle Identifier` to something you own, e.g. `ai.finova.app`.
   - Signing & Capabilities → pick your Apple Developer team; enable **Push Notifications**, **Background Modes → Remote notifications**. (Creates the `.entitlements` file with `aps-environment` automatically — clears check 5.)
4. **App icons.** Xcode → `AppIcon.appiconset` → drop the icons. Easiest: use [`appicon.co`](https://appicon.co) with `src/asset/logotrans-light.png` at 1024 — it generates the whole set. Alternatively, script it with `sips` + a JSON contents file. Clears check 8.
5. **`GoogleService-Info.plist`** — from Firebase Console → Project Settings → your iOS app (add one if none) → download → drag into `ios/monefyai/` in Xcode. Clears check 6.
6. **`AppDelegate.mm`** — must call `[FIRApp configure]` at launch. Add:
   ```objc
   #import <Firebase.h>
   // inside didFinishLaunchingWithOptions:
   [FIRApp configure];
   ```
   (RNFirebase docs cover this; without it, Firebase modules crash on first use.)
7. **APNs authentication key** — Apple Dev Portal → Keys → APNs → generate → upload to Firebase Console → Project Settings → Cloud Messaging → Apple app configuration. Without this, FCM can't push to your app even after entitlement is set.
8. **Add `ITSAppUsesNonExemptEncryption = NO`** to Info.plist (assuming you don't ship custom crypto — HTTPS via TLS is exempt). Saves you a click on every TestFlight upload.
9. **Rename the Xcode project** from `monefyai` → `finovaAi` (matches `app.json`). Cosmetic but recommended before first App Store submission. Optional — you can also just keep `monefyai` as the internal Xcode name and set the display name via `CFBundleDisplayName` (already `monefyai` — change that to `Finova AI`).

---

## What's already good on iOS side (no work needed)

- LaunchScreen storyboard exists.
- Deployment target is at the RN 0.74 minimum (13.4).
- Privacy manifest exists (Apple's May 2024 requirement satisfied for the basics).
- Reanimated Babel plugin is configured — sonner-native's swipe animations + our SplashScreen pulsing dots will work.
- Fonts are physically bundled in `assets/fonts/` and listed in Info.plist's `UIAppFonts`; only the Xcode "Copy Bundle Resources" step is missing.
- iOS Podfile's `use_frameworks!` guard is behind an env var — the default path (`use_modular_headers!`) is Firebase-compatible.

---

## What can't be checked by this script

- Signing certificates / provisioning profiles — those live in Apple Dev Portal + Keychain.
- APNs auth key upload to Firebase — Firebase Console setting.
- Actual `xcodebuild archive` success — needs signing set up first.
- App Store metadata (screenshots, description, category, age rating) — Fastlane or App Store Connect UI.
- Whether the app behaves correctly on iPhone hardware — needs manual QA.

---

## Recommended path forward

**Phase 1 — Local dev build (couple of hours):** items 1–5 above. Result: app launches on iOS simulator with Finova branding, fonts, and (locally) push registration.

**Phase 2 — Real device push (~1 hour):** items 6–7. Result: FCM notifications work on a real iPhone.

**Phase 3 — TestFlight (~half day):** items 8–9 + first archive + upload. Result: first internal-test build in TestFlight.

**Phase 4 — Store submission (~1 day):** screenshots, review answers, ATT / privacy disclosures if not already covered by the manifest.
