---
name: ios-readiness
description: "Assess whether the Finova React Native app can be built, signed, and submitted to iOS TestFlight / the App Store. Deterministic checks covering the Xcode project, Podfile / pod install state, Info.plist required keys, App Icon / Launch Screen assets, permission strings for the modules actually imported, Firebase iOS config, font linking, and known bare-RN + iOS gotchas. Use when the user asks 'can we ship on iOS', 'is the iOS build ready', 'assess iOS readiness', or before starting an iOS build."
allowed-tools: Bash, Read
---

# iOS-readiness assessment

Deterministic checks — every one is a shell command with a boolean or count outcome. No judgment calls. Print `CHECK <n> <PASS|FAIL|WARN>: <one-line>` for each, then write the report.

## Setup

```bash
cd $(git rev-parse --show-toplevel)
mkdir -p docs/audit
DATE=$(date +%F)
REPORT=docs/audit/${DATE}-ios-readiness.md
echo "# iOS readiness — ${DATE}" > "$REPORT"
IOS_DIR=$(find ios -maxdepth 2 -name "Info.plist" -not -path "*Tests*" | head -1 | xargs dirname)
echo "iOS project directory: $IOS_DIR" | tee -a "$REPORT"
```

## Checks

### CHECK 1 — Xcode workspace present

```bash
find ios -maxdepth 2 -name "*.xcworkspace" -type d | head
```
**PASS:** at least one `.xcworkspace` (means CocoaPods integration is set up). **FAIL:** only `.xcodeproj` — Cocoapods not integrated, `pod install` never ran.

### CHECK 2 — `pod install` state is fresh

```bash
[ -f "$IOS_DIR/../Podfile.lock" ] && echo "lock present" || echo "MISSING"
grep -c "spec_checksum" "$IOS_DIR/../Podfile.lock" 2>/dev/null || echo 0
```
**PASS:** lock exists and has ≥ 20 spec checksums. **FAIL:** missing Podfile.lock → `cd ios && pod install`.

### CHECK 3 — Every native RN module the app imports has a matching Pod

Cross-reference JS-side native imports against Podfile.lock:

```bash
# native modules used in JS
NATIVE_MODULES="react-native-gesture-handler react-native-reanimated react-native-svg react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage @notifee/react-native @react-native-firebase/app @react-native-firebase/messaging"
for m in $NATIVE_MODULES; do
    if grep -q "$m" "$IOS_DIR/../Podfile.lock" 2>/dev/null; then
        echo "  $m: linked"
    else
        echo "  $m: MISSING from Podfile.lock"
    fi
done
```
**PASS:** every module reports `linked`. **FAIL:** any module missing → `cd ios && pod install` (or, if the pod itself is missing, add `use_native_modules!` autolink block to Podfile).

### CHECK 4 — Info.plist has the mandatory keys

```bash
PLIST="$IOS_DIR/Info.plist"
for key in CFBundleIdentifier CFBundleDisplayName CFBundleShortVersionString CFBundleVersion UILaunchStoryboardName; do
    grep -q "<key>$key</key>" "$PLIST" && echo "  $key: present" || echo "  $key: MISSING"
done
```
**PASS:** all five present. **FAIL:** any missing → Xcode won't build a submittable IPA.

### CHECK 5 — Permission-string keys for modules the app actually uses

For each iOS permission the app triggers, Info.plist MUST declare a `NS…UsageDescription` string, or the app crashes on first use.

```bash
# push notifications (RNFB messaging + notifee)
grep -q "aps-environment" "$IOS_DIR"/../*/*.entitlements 2>/dev/null && echo "  push entitlement: present" || echo "  push entitlement: MISSING (aps-environment)"

# Firebase messaging needs no UsageDescription but does need APNs registration.
# Notifee's ForegroundHandler uses UNUserNotificationCenter — request goes to system, no UsageDescription needed.
```
**WARN** if push entitlement missing — required to receive FCM messages on iOS.

### CHECK 6 — Firebase iOS config present

```bash
find ios -name "GoogleService-Info.plist" | head
```
**PASS:** file exists inside the iOS bundle target. **FAIL:** `@react-native-firebase/messaging` will crash at init. Get it from Firebase Console → Project Settings → iOS app → GoogleService-Info.plist, place in `$IOS_DIR/`.

### CHECK 7 — Inter fonts registered in Info.plist

```bash
grep -c "Inter-.*\.ttf" "$PLIST"          # expect 5
ls "$IOS_DIR"/../../assets/fonts/Inter-*.ttf | wc -l  # expect 5
# Fonts must also be added to the Xcode project's Copy Bundle Resources for iOS to find them at run time.
grep -c "Inter-" "$IOS_DIR"/../*.xcodeproj/project.pbxproj 2>/dev/null
```
**PASS:** all three counts are 5+. **FAIL:** if Info.plist has 5 but pbxproj has 0, run `cd ios && npx react-native-asset` OR add the .ttf files manually in Xcode → Add Files → check the app target.

### CHECK 8 — App Icon set exists

```bash
find "$IOS_DIR" -type d -name "AppIcon*.appiconset" | head
ls "$IOS_DIR"/Images.xcassets/AppIcon.appiconset/*.png 2>/dev/null | wc -l
```
**PASS:** appiconset dir exists with several PNGs. **WARN:** if fewer than 6 PNGs, the App Store 1024×1024 marketing icon or one of the required device sizes may be missing.

### CHECK 9 — Launch Screen storyboard exists

```bash
find "$IOS_DIR" -name "LaunchScreen.storyboard" -o -name "SplashScreen.storyboard" | head
```
**PASS:** at least one storyboard. **FAIL:** iOS 13+ requires a storyboard launch screen; static launch images no longer accepted.

### CHECK 10 — Bundle identifier is not a template default

```bash
grep -A1 "CFBundleIdentifier" "$PLIST" | head -2
grep "PRODUCT_BUNDLE_IDENTIFIER" "$IOS_DIR"/../*.xcodeproj/project.pbxproj | sort -u
```
**WARN** if the identifier is `org.reactjs.native.example.*` or otherwise starter-template shaped. App Store rejects those.

### CHECK 11 — Deployment target ≥ iOS 13

```bash
grep -E "IPHONEOS_DEPLOYMENT_TARGET|platform :ios" "$IOS_DIR"/../Podfile "$IOS_DIR"/../*.xcodeproj/project.pbxproj 2>/dev/null | sort -u
```
**PASS:** all values ≥ 13.4 (RN 0.74 minimum). **FAIL:** older target won't compile RN 0.74 pods.

### CHECK 12 — Encryption / export declaration

```bash
grep -q "ITSAppUsesNonExemptEncryption" "$PLIST" && echo "  declared" || echo "  not declared (Apple will ask on every upload)"
```
**WARN** if missing. Not a build-blocker, but saves you a click on every TestFlight upload.

### CHECK 13 — Privacy manifest (iOS 17+ required for API-using modules)

```bash
find "$IOS_DIR" -name "PrivacyInfo.xcprivacy" | head
```
**WARN** if none. Apple requires a privacy manifest as of May 2024 for any app that uses one of the required-reason APIs (AsyncStorage → file timestamp APIs, and any lib that reads UserDefaults for non-app-specific keys triggers this). App Store submission will show a validation warning until this exists.

### CHECK 14 — Reanimated Babel plugin present

```bash
grep -q "react-native-reanimated/plugin" babel.config.js && echo "OK" || echo "MISSING"
```
**FAIL** if missing — Reanimated worklets will silently no-op → sonner-native's swipe-to-dismiss + our splash pulse animation break on device.

### CHECK 15 — `use_frameworks!` compatibility with Firebase

```bash
grep -E "use_frameworks!|use_modular_headers!" "$IOS_DIR"/../Podfile
```
**WARN** if `use_frameworks!` is set without `:linkage => :static`. Firebase pods historically clash with `use_frameworks!` unless static linkage is chosen. RN 0.74's default Podfile uses `use_modular_headers!` which is fine.

### CHECK 16 — Signing team / provisioning present

```bash
grep -E "DEVELOPMENT_TEAM|CODE_SIGN_STYLE|PROVISIONING_PROFILE" "$IOS_DIR"/../*.xcodeproj/project.pbxproj | grep -v "\"\"" | head -5
```
**WARN** if DEVELOPMENT_TEAM is empty — will fail on any CI or non-interactive build. Fine for local dev if you'll open Xcode and sign there.

---

## Report

At the end, print totals and a top-line verdict:
- **READY:** every FAIL is 0 and no WARN blocks a submission (push cert, Firebase config, launch storyboard, deployment target).
- **NEEDS WORK:** any FAIL, or any WARN in {CHECK 5, CHECK 6, CHECK 9, CHECK 11}.
- **NOT STARTED:** if CHECK 1 or CHECK 2 fails, everything else may be misleading — flag and stop.

## Escalation

- Never attempt `pod install` yourself unless the user asks — it modifies `Podfile.lock` and installs native code, and depends on the local CocoaPods version.
- Never edit the `.xcodeproj` file — hand-editing pbxproj files breaks Xcode.
- Never write Apple certs/keys/entitlements from a script — the developer signs from their own Apple ID.
- For every failure, name the exact remediation (which command to run, or what to add to which file) and leave the running to the developer.
