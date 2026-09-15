---
name: ios-setup
description: "Walk the Finova app from 'never built on iOS' to first successful simulator run + submittable state. Handles every step a script can safely do (pod install, font linking, AppIcon generation, Info.plist edits, AppDelegate wiring). Stops and prints exact instructions for every step that needs a real Apple Developer account or Xcode UI action. Idempotent — safe to re-run if you get interrupted. Use after the ios-readiness assessment when the user says 'fix the iOS setup', 'get iOS building', 'set up iOS'."
allowed-tools: Bash, Read, Edit, Write
---

# iOS setup — resolve every ios-readiness blocker

Split into **automated steps** (you run them) and **human steps** (you print instructions and wait). At each stopping point, print `HUMAN NEEDED — <what to do>` and wait for the user to reply `done` before proceeding to the next check.

**Preconditions:** must be run on a Mac with Xcode installed and the user signed into their Apple ID in Xcode → Settings → Accounts. If Xcode is missing, stop before Step 1 with `HUMAN NEEDED — install Xcode from the Mac App Store, then re-run`.

## Verification protocol

After every automated step, run its verification command. Print `STEP <n> VERIFIED` or `STEP <n> FAILED: <reason>`. If failed, stop and hand back to the human — do NOT continue with subsequent steps because they usually depend on prior ones landing.

Everything is safe to re-run. Every command should either be a no-op if already done or produce the same idempotent result.

---

## Step 0 — Prereqs

```bash
cd $(git rev-parse --show-toplevel)
xcodebuild -version 2>/dev/null | head -1        # expect Xcode >= 15
pod --version 2>/dev/null                        # expect >= 1.14
ls ios/monefyai.xcworkspace 2>/dev/null          # workspace present
```

- **All three succeed:** continue to Step 1.
- **`pod` missing:** `sudo gem install cocoapods` OR `brew install cocoapods`. Then re-verify.
- **`xcodebuild` missing:** `HUMAN NEEDED — install Xcode from the Mac App Store, launch it once to accept the license, then reply 'done'`.

## Step 1 — `pod install`

```bash
cd ios && pod install 2>&1 | tail -20
```

**Verification:**
```bash
grep -qE "^  - (RNGestureHandler|RNReanimated|RNSVG|RNScreens|RNFB|RNCAsyncStorage)" ios/Podfile.lock && echo OK || echo MISSING
```
- **OK:** the RN native modules that were missing before now appear. Continue.
- **MISSING:** capture the `pod install` output and stop. Common failures: Ruby version mismatch (fix: `xcode-select --install`), CocoaPods version too old (fix: `sudo gem install cocoapods`), pod repo out of date (fix: `pod repo update`).

## Step 2 — Link Inter fonts into the Xcode target

```bash
npx react-native-asset 2>&1 | tail -10
```

**Verification:**
```bash
grep -c "Inter-.*\.ttf" ios/monefyai.xcodeproj/project.pbxproj
```
- **≥ 5:** fonts are now in Copy Bundle Resources. Continue.
- **0:** the asset linker didn't find `react-native.config.js` or the assets directory. Verify `react-native.config.js` at repo root exports `{ assets: ['./assets/fonts'] }`, then retry.

If `react-native-asset` isn't installed: `npm install --save-dev react-native-asset` first, then re-run.

## Step 3 — Add `ITSAppUsesNonExemptEncryption` to Info.plist

Saves a click on every TestFlight upload. HTTPS-only apps qualify for the exemption.

```bash
PLIST="ios/monefyai/Info.plist"
grep -q "ITSAppUsesNonExemptEncryption" "$PLIST" && echo "already declared" && exit 0
python3 -c "
import pathlib
p = pathlib.Path('$PLIST')
s = p.read_text()
inject = '\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>\n'
new = s.replace('</dict>\n</plist>', inject + '</dict>\n</plist>', 1)
assert new != s, 'plist close tag not found'
p.write_text(new)
print('added')
"
```

**Verification:**
```bash
grep -A1 "ITSAppUsesNonExemptEncryption" ios/monefyai/Info.plist | head -2
```
Should print the key and `<false/>`. If not, stop.

## Step 4 — Generate AppIcon PNGs from `logotrans-light.png`

Use the Finova mark (light variant — better on iOS's iridescent icon backgrounds) as the marketing icon. `sips` is built into macOS; no external tools required.

```bash
SRC="src/asset/logotrans-light.png"
DEST="ios/monefyai/Images.xcassets/AppIcon.appiconset"
[ -f "$SRC" ] || { echo "source mark missing"; exit 1; }
mkdir -p "$DEST"

# iOS AppIcon required sizes (iOS 14+ single-size layout). Names match the
# default Contents.json Xcode generates for a fresh AppIcon set.
declare -a icons=(
    "1024:AppIcon-1024.png"
    "180:AppIcon-60@3x.png"
    "120:AppIcon-60@2x.png"
    "120:AppIcon-40@3x.png"
    "80:AppIcon-40@2x.png"
    "40:AppIcon-40.png"
    "87:AppIcon-29@3x.png"
    "58:AppIcon-29@2x.png"
    "29:AppIcon-29.png"
    "60:AppIcon-20@3x.png"
    "40:AppIcon-20@2x.png"
    "20:AppIcon-20.png"
    "167:AppIcon-83.5@2x.png"
    "152:AppIcon-76@2x.png"
    "76:AppIcon-76.png"
)
for entry in "${icons[@]}"; do
    size="${entry%%:*}"
    name="${entry#*:}"
    sips -s format png -z "$size" "$size" "$SRC" --out "$DEST/$name" >/dev/null 2>&1
done
ls "$DEST"/*.png | wc -l
```

Then write a matching `Contents.json`:

```bash
cat > "$DEST/Contents.json" <<'JSON'
{
  "images" : [
    { "size" : "20x20", "idiom" : "iphone", "filename" : "AppIcon-20@2x.png", "scale" : "2x" },
    { "size" : "20x20", "idiom" : "iphone", "filename" : "AppIcon-20@3x.png", "scale" : "3x" },
    { "size" : "29x29", "idiom" : "iphone", "filename" : "AppIcon-29@2x.png", "scale" : "2x" },
    { "size" : "29x29", "idiom" : "iphone", "filename" : "AppIcon-29@3x.png", "scale" : "3x" },
    { "size" : "40x40", "idiom" : "iphone", "filename" : "AppIcon-40@2x.png", "scale" : "2x" },
    { "size" : "40x40", "idiom" : "iphone", "filename" : "AppIcon-40@3x.png", "scale" : "3x" },
    { "size" : "60x60", "idiom" : "iphone", "filename" : "AppIcon-60@2x.png", "scale" : "2x" },
    { "size" : "60x60", "idiom" : "iphone", "filename" : "AppIcon-60@3x.png", "scale" : "3x" },
    { "size" : "20x20", "idiom" : "ipad", "filename" : "AppIcon-20.png", "scale" : "1x" },
    { "size" : "20x20", "idiom" : "ipad", "filename" : "AppIcon-20@2x.png", "scale" : "2x" },
    { "size" : "29x29", "idiom" : "ipad", "filename" : "AppIcon-29.png", "scale" : "1x" },
    { "size" : "29x29", "idiom" : "ipad", "filename" : "AppIcon-29@2x.png", "scale" : "2x" },
    { "size" : "40x40", "idiom" : "ipad", "filename" : "AppIcon-40.png", "scale" : "1x" },
    { "size" : "40x40", "idiom" : "ipad", "filename" : "AppIcon-40@2x.png", "scale" : "2x" },
    { "size" : "76x76", "idiom" : "ipad", "filename" : "AppIcon-76.png", "scale" : "1x" },
    { "size" : "76x76", "idiom" : "ipad", "filename" : "AppIcon-76@2x.png", "scale" : "2x" },
    { "size" : "83.5x83.5", "idiom" : "ipad", "filename" : "AppIcon-83.5@2x.png", "scale" : "2x" },
    { "size" : "1024x1024", "idiom" : "ios-marketing", "filename" : "AppIcon-1024.png", "scale" : "1x" }
  ],
  "info" : { "version" : 1, "author" : "xcode" }
}
JSON
```

**Verification:** `ls "$DEST"/*.png | wc -l` ≥ 15, and `Contents.json` present.

⚠️ **Caveat:** iOS AppIcons must be square-opaque. If `logotrans-light.png` has transparency, App Store validation warns but still accepts. Optionally re-flatten each PNG against `#F7F5F0` canvas with:
```bash
for f in "$DEST"/AppIcon-*.png; do
    sips -s format png -s dpiHeight 72.0 -s dpiWidth 72.0 "$f" --out "$f" >/dev/null 2>&1
done
```
Or leave it — the human can polish this later.

## Step 5 — Wire Firebase into AppDelegate

```bash
APP_DELEGATE=$(find ios -name "AppDelegate.mm" -o -name "AppDelegate.swift" | head -1)
echo "AppDelegate: $APP_DELEGATE"
grep -q "FIRApp configure" "$APP_DELEGATE" && echo "already wired" || echo "needs wiring"
```

If not wired:

**For `.mm`:**
```bash
python3 <<PYEOF
import pathlib
p = pathlib.Path('$APP_DELEGATE')
s = p.read_text()
# Add import
if '#import <Firebase.h>' not in s:
    s = s.replace('#import "AppDelegate.h"', '#import "AppDelegate.h"\n#import <Firebase.h>', 1)
# Add configure at top of didFinishLaunchingWithOptions
if '[FIRApp configure]' not in s:
    marker = 'didFinishLaunchingWithOptions:(NSDictionary *)launchOptions\n{'
    s = s.replace(marker, marker + '\n  [FIRApp configure];', 1)
p.write_text(s)
print('AppDelegate.mm patched')
PYEOF
```

**For `.swift`:**
```bash
python3 <<PYEOF
import pathlib
p = pathlib.Path('$APP_DELEGATE')
s = p.read_text()
if 'import FirebaseCore' not in s:
    s = s.replace('import UIKit', 'import UIKit\nimport FirebaseCore', 1)
if 'FirebaseApp.configure' not in s:
    s = s.replace('didFinishLaunchingWithOptions', 'didFinishLaunchingWithOptions').replace(
        '-> Bool {\n', '-> Bool {\n    FirebaseApp.configure()\n', 1)
p.write_text(s)
print('AppDelegate.swift patched')
PYEOF
```

**Verification:** `grep -c "FIRApp configure\|FirebaseApp.configure" "$APP_DELEGATE"` returns 1.

## Step 6 — HUMAN: `GoogleService-Info.plist`

Print exactly:

> **HUMAN NEEDED — Firebase iOS config.**
> 1. Open https://console.firebase.google.com/ → your Finova project → Project Settings.
> 2. If no iOS app is registered yet: **Add app** → iOS → bundle ID (use whatever you'll set in Step 7 — pick it now, e.g. `ai.finova.app`).
> 3. Download `GoogleService-Info.plist`.
> 4. Move it to `ios/monefyai/GoogleService-Info.plist`.
> 5. Open `ios/monefyai.xcworkspace` in Xcode → drag the file into the `monefyai` group in the Project Navigator → check the `monefyai` target checkbox → click Finish.
> 6. Reply **`done`** here.

**Verification:** `find ios -name "GoogleService-Info.plist"` returns exactly one path. If not, stop and re-prompt.

## Step 7 — HUMAN: Bundle ID, team, push capability

Print exactly:

> **HUMAN NEEDED — Xcode signing and capabilities.**
> 1. In Xcode (workspace still open), select the `monefyai` project in the Project Navigator → target `monefyai`.
> 2. **General tab:** change **Bundle Identifier** from `org.reactjs.native.example.$(PRODUCT_NAME…)` to the id you gave Firebase in Step 6 (e.g. `ai.finova.app`). Also change **Display Name** to `Finova AI` if it says `monefyai`.
> 3. **Signing & Capabilities tab:**
>    - Team: pick your Apple Developer team from the dropdown. (If none listed, add your Apple ID in Xcode → Settings → Accounts.)
>    - Click **+ Capability** → add **Push Notifications**.
>    - Click **+ Capability** → add **Background Modes** → check **Remote notifications** and **Background fetch**.
> 4. Xcode will auto-create `ios/monefyai/monefyai.entitlements`. Confirm it contains `<key>aps-environment</key><string>development</string>`.
> 5. Reply **`done`**.

**Verification:**
```bash
grep -q "aps-environment" ios/monefyai/*.entitlements 2>/dev/null && echo OK || echo MISSING
grep "PRODUCT_BUNDLE_IDENTIFIER" ios/monefyai.xcodeproj/project.pbxproj | grep -v Test | sort -u
```
- `aps-environment` present AND bundle ID no longer contains `reactjs.native.example`: continue.
- Otherwise stop and re-prompt.

## Step 8 — HUMAN: APNs auth key in Firebase

Print exactly:

> **HUMAN NEEDED — APNs authentication key.**
> Without this, FCM messages can't reach iOS devices even with the entitlement set.
> 1. Go to https://developer.apple.com/account/resources/authkeys/list → **+** to generate a new Apple Push Notification service (APNs) key.
> 2. Enable **Apple Push Notifications service (APNs)**. Continue → Register → download the `.p8` file (only downloadable once).
> 3. Note the **Key ID** and your **Team ID** (top-right of Developer Portal).
> 4. In Firebase Console → your project → Project Settings → Cloud Messaging tab → Apple app configuration → APNs Authentication Key → **Upload**.
> 5. Upload the `.p8`, paste Key ID and Team ID.
> 6. Reply **`done`**.

No verification possible from the local filesystem. Trust the human's `done` and continue.

## Step 9 — First simulator build

```bash
cd ios && xcodebuild -workspace monefyai.xcworkspace -scheme monefyai \
    -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
    -configuration Debug clean build 2>&1 | tail -50
```

**Verification:** `** BUILD SUCCEEDED **` in the output.

- **Succeeded:** print `IOS BUILD READY`. Simulator ready to run via `npx react-native run-ios`.
- **Failed:** capture the error, stop. Common causes and fixes:
  - `Firebase.h not found` → pod install didn't complete; re-run Step 1.
  - `Duplicate symbols for architecture` → `pod deintegrate && pod install`.
  - `Signing for "monefyai" requires a development team` → return to Step 7.

## Step 10 — Confirm on Simulator (optional smoke)

```bash
open -a Simulator
xcrun simctl list devices | grep Booted || xcrun simctl boot "iPhone 15" 2>/dev/null
npx react-native run-ios --simulator="iPhone 15" 2>&1 | tail -20
```

If Metro isn't running, `run-ios` will start it. First launch takes 1-2 minutes.

Verify visually:
- Splash renders with Inter font + animated dots (both themes if you toggle in Profile)
- Login toast appears with sonner-native style
- No red-box errors on launch

## Final report

Append to `docs/audit/YYYY-MM-DD-ios-setup.md`:
- Steps completed
- Any human steps that were skipped or blocked
- Simulator build result
- Remaining work before TestFlight (checklist)

---

## What this skill will NOT do

- **Never edit `project.pbxproj` by regex.** Every attempted script fix is via `sips`, `Info.plist` (structured), or `AppDelegate` (localized). The pbxproj is Xcode's authoritative store; hand-editing it can silently corrupt the project.
- **Never generate certificates or provisioning profiles.** Apple's API requires an authenticated CLI session and specific tooling; Fastlane is the right layer if that becomes desired.
- **Never upload to TestFlight.** That's an explicit user-approved action.
- **Never edit Firebase Console settings via API.** All Firebase project-level changes go through the human in Steps 6 and 8.

## Escalation

- If any FAIL cause isn't listed in this skill's remediation notes, stop and hand back with the raw error output.
- If a human step's verification fails twice in a row, stop and hand back — assume the human misunderstood the instruction rather than clicking around Xcode more.
- If `pod install` needs `pod repo update` and repo update itself fails (network / auth), stop — this may need a proxy or SSH key rotation the human handles.
