---
name: ios-eas-build
description: "Build and submit Finova to iOS TestFlight without Xcode installed locally. Uses Expo Application Services (EAS Build) — a cloud-mac build farm that handles pod install, Xcode signing, xcodebuild archive, and IPA upload. Works with this project's bare React Native 0.74.2 setup (adds expo-modules-core but does not force a full Expo migration). Every step is either fully automated or a clearly-flagged human action (create Apple ID, upload app-specific password, TestFlight tester setup). Idempotent — safe to re-run if interrupted. Use when the user says 'build for iOS in the cloud', 'ship to TestFlight', 'iOS build without Xcode'."
allowed-tools: Bash, Read, Edit, Write
---

# iOS build via EAS — no Xcode required

Takes the Finova app from "no iOS build possible on this Mac" to a signed IPA on TestFlight, using Expo's cloud build service. The developer's laptop only needs `node`, `npm`, and network access.

Split into **automated steps** (you run them) and **human steps** (you print instructions and wait for the user to reply `done`). Every human step has a filesystem or CLI verification that must pass before continuing. If a verification fails twice, stop and hand back to the user.

## Prereqs

- Free Expo account (sign up at https://expo.dev/signup)
- Paid Apple Developer account ($99/year, required for TestFlight)
- No Xcode local install required
- `node >= 18` on the dev machine

## What EAS costs

- Free tier: ~30 iOS builds/month (~1 GB build limit)
- Paid tier ($19/month): unlimited priority builds
- Both tiers include automatic signing-cert management

## Setup

```bash
cd $(git rev-parse --show-toplevel)
mkdir -p docs/audit
DATE=$(date +%F)
REPORT="docs/audit/${DATE}-ios-eas.md"
echo "# iOS EAS build — ${DATE}" > "$REPORT"
```

Each step logs to `$REPORT`.

---

## Step 0 — Prereqs

```bash
node -v          # expect >= 18
npm -v           # expect >= 8
which npx        # expect a path
```

- **All succeed:** continue.
- **Any missing:** `brew install node` and re-verify. Node 18 or newer is required by eas-cli.

## Step 1 — Install eas-cli globally

```bash
npm install -g eas-cli 2>&1 | tail -3
```

**Verification:**
```bash
eas --version
```
Should print `eas-cli/x.y.z`. If it doesn't, fix PATH: `npm bin -g` names the directory to add. On some Mac setups, `sudo npm install -g eas-cli` is needed for permissions.

## Step 2 — HUMAN: Sign in to Expo

Print:

> **HUMAN NEEDED — Expo account.**
> 1. If you don't have an Expo account, sign up: https://expo.dev/signup (free).
> 2. Reply **`done`** and I'll log you in via the CLI.

Then run:

```bash
eas login
```

This is an interactive prompt (email + password). Do NOT try to script it — let the user type into the terminal.

**Verification:**
```bash
eas whoami
```
Should print the user's Expo username. If it errors, ask the user to try `eas login` again.

## Step 3 — Add expo-modules-core to the bare RN project

EAS Build works with any RN project, but the tooling reads Expo's config layer for build profiles + credentials management. Installing `expo` (which pulls `expo-modules-core`) into a bare RN project is a 10-minute autolink integration — it doesn't convert your app to Managed Expo, just adds the modules-core plumbing so EAS can read `app.json` for build metadata.

```bash
npx install-expo-modules@latest 2>&1 | tail -20
```

The installer will:
- Add `expo` to `dependencies`
- Modify `ios/Podfile` to include Expo autolinking
- Modify `AppDelegate.mm` to enable Expo modules
- Add `android/settings.gradle` and `android/app/build.gradle` bits (already present in a native way, this is idempotent)
- Update `metro.config.js` (adds Expo assets extension)

**Verification:**
```bash
grep -q '"expo":' package.json && echo "expo dep added" || echo "MISSING"
grep -q "ExpoModulesCore" ios/*.xcodeproj/project.pbxproj 2>/dev/null || \
    grep -q "expo-modules-core" ios/Podfile 2>/dev/null && echo "podfile updated" || echo "podfile NOT updated"
```

If verification fails, review `npx install-expo-modules` output for a Podfile merge conflict — bare RN Podfiles sometimes need a hand merge. Stop and hand back.

## Step 4 — Create `eas.json` build profile

Write the EAS build config:

```bash
cat > eas.json <<'JSON'
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "resourceClass": "m-medium",
        "buildConfiguration": "Release"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium",
        "buildConfiguration": "Release",
        "autoIncrement": "buildNumber"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "REPLACE_WITH_APP_STORE_CONNECT_APP_ID",
        "appleId": "REPLACE_WITH_APPLE_ID_EMAIL",
        "appleTeamId": "REPLACE_WITH_TEAM_ID"
      }
    }
  }
}
JSON
```

`preview` builds an internal-distribution IPA installable via TestFlight (or direct link).
`production` builds a store IPA. Both live-sign via EAS credentials.

**Verification:**
```bash
[ -f eas.json ] && node -e "JSON.parse(require('fs').readFileSync('eas.json'))" && echo "valid JSON"
```

## Step 5 — Update `app.json` with the iOS bundle ID + display name

`install-expo-modules` created `app.json`. Set the iOS-specific fields:

```bash
python3 <<PYEOF
import json, pathlib
p = pathlib.Path('app.json')
cfg = json.loads(p.read_text())
cfg.setdefault('expo', {})
cfg['expo'].update({
    'name': 'Finova AI',
    'slug': 'finova-ai',
    'version': '1.0.0',
    'orientation': 'portrait',
    'icon': './ios/monefyai/Images.xcassets/AppIcon.appiconset/AppIcon-1024.png',
    'ios': {
        'bundleIdentifier': 'ai.finova.app',
        'buildNumber': '1',
        'supportsTablet': False,
    },
})
p.write_text(json.dumps(cfg, indent=2))
print('app.json updated')
PYEOF
```

Change `ai.finova.app` to whatever bundle ID you own or plan to register in the Apple Developer Portal. The bundle ID must be unique across the App Store, so pick a reverse-DNS string tied to a domain you control.

**Verification:**
```bash
node -e "const j=require('./app.json'); console.log('bundle:', j.expo.ios.bundleIdentifier); console.log('name:', j.expo.name)"
```

## Step 6 — HUMAN: Apple Developer account + bundle ID registration

Print:

> **HUMAN NEEDED — Apple Developer account.**
> If you don't already have one, this step costs $99/year and is required for TestFlight and the App Store.
> 1. Enroll at https://developer.apple.com/programs/enroll/ (Apple ID + payment). Enrollment can take 24-48h if it's a first-time company registration.
> 2. Once enrolled: go to https://developer.apple.com/account → Certificates, Identifiers & Profiles → Identifiers → **+** → App IDs → App.
> 3. Register the exact bundle ID you set in Step 5 (e.g. `ai.finova.app`). Enable capability: **Push Notifications**.
> 4. Reply **`done`** with your Apple ID email so I can plug it into the next step.

No filesystem check possible — trust the user's `done` and proceed.

## Step 7 — HUMAN: Generate an app-specific password (for EAS submit)

EAS's `submit` command needs to authenticate to App Store Connect. The recommended way is an app-specific password (safer than your primary Apple ID password).

Print:

> **HUMAN NEEDED — App-specific password.**
> 1. Sign in at https://appleid.apple.com/account/manage.
> 2. Under **Sign-In and Security → App-Specific Passwords → Generate an app-specific password**.
> 3. Label it "EAS Submit", copy the password (format: xxxx-xxxx-xxxx-xxxx).
> 4. Reply with **`done`** — EAS will prompt for it during Step 9's first submit run; don't paste it here in chat, keep it in a password manager.

## Step 8 — First EAS build (preview / TestFlight-installable)

```bash
eas build --platform ios --profile preview --non-interactive=false
```

This is an interactive command. EAS will:
1. Ask if it should generate a new distribution certificate + provisioning profile (say **yes** — managed credentials are much simpler than uploading your own).
2. Ask for your Apple ID (from Step 6).
3. Prompt for a 2FA code (via Apple ID SMS or authenticator).
4. Upload the source to Expo's servers.
5. Queue a mac build (5-15 min typical wait).
6. Print a URL like `https://expo.dev/accounts/<user>/projects/finova-ai/builds/<uuid>`.

**Verification:** the command exits 0 and the URL is printed. If the build fails on their servers, the log link tells you why. Common failures:
- **Bundle ID not registered:** return to Step 6.
- **Podfile conflict from `install-expo-modules`:** open `ios/Podfile` and hand-merge (the installer may have failed silently). Stop and hand back to the user.
- **Missing GoogleService-Info.plist:** you'll need one from Firebase Console (see Step 10). EAS lets you add it as a build resource — see the failure log.

## Step 9 — HUMAN: Wait for the build to finish

Print:

> **HUMAN NEEDED — Wait for the EAS build.**
> Open the build URL from Step 8. When it says "Build finished", download the IPA (or, better, use `eas submit` in Step 10 to send it straight to TestFlight).
> Reply **`done`** once the build shows Finished. Typical wait: 5-15 min. If it fails, paste the last 30 lines of the build log so we can diagnose.

## Step 10 — Get `GoogleService-Info.plist` in place (if not done)

Firebase needs its config file inside the iOS bundle. Without Xcode, you can't drag it in — instead, put it at the exact path EAS's build expects and reference it in `app.json`:

```bash
# The user downloaded GoogleService-Info.plist from Firebase Console in Step 6-ish.
# Put it in ios/monefyai/ so the Podfile / build finds it.
# If they gave you a path, move it there. Otherwise:
```

Print:

> **HUMAN NEEDED — Firebase iOS config.**
> 1. https://console.firebase.google.com/ → your Finova project → Project Settings.
> 2. If no iOS app registered: Add app → iOS → bundle ID from Step 5.
> 3. Download `GoogleService-Info.plist` and reply with its local file path (e.g. `~/Downloads/GoogleService-Info.plist`).

Then:

```bash
GSI_SOURCE="<path the user gave>"
mv "$GSI_SOURCE" ios/monefyai/GoogleService-Info.plist
python3 <<PYEOF
import json, pathlib
p = pathlib.Path('app.json')
cfg = json.loads(p.read_text())
cfg['expo'].setdefault('ios', {})['googleServicesFile'] = './ios/monefyai/GoogleService-Info.plist'
p.write_text(json.dumps(cfg, indent=2))
print('app.json updated with googleServicesFile')
PYEOF
```

**Verification:** `[ -f ios/monefyai/GoogleService-Info.plist ] && echo OK`.

## Step 11 — Submit to TestFlight

```bash
eas submit --platform ios --profile production --latest
```

EAS will prompt for the app-specific password from Step 7. It uploads the IPA to App Store Connect. Apple's processing takes 15-30 min before the build shows up in TestFlight.

**Verification:** the command exits 0 and prints a submission URL. If it fails, common causes:
- **Wrong ascAppId in eas.json:** get the app ID from App Store Connect → My Apps → your app → Apple ID (10-digit number). Update Step 4's `eas.json`.
- **App not yet created in App Store Connect:** log in at https://appstoreconnect.apple.com → My Apps → **+** → New App. Bundle ID must match Step 5.
- **APNs not configured:** required for push notifications to work. Upload your APNs auth key (see below).

## Step 12 — HUMAN: TestFlight Push (optional but recommended)

Print:

> **HUMAN NEEDED — APNs auth key (only if you want push in TestFlight builds).**
> 1. https://developer.apple.com/account/resources/authkeys → **+** → APNs.
> 2. Download the `.p8` file and note the Key ID + Team ID.
> 3. Firebase Console → Project Settings → Cloud Messaging → Apple app config → APNs Authentication Key → Upload.
> 4. Reply **`done`**.

## Final report

Append to the report:
- Expo project URL
- Latest build ID + status
- Submission URL if step 11 ran
- Bundle ID + version + build number
- Anything the user needs to do next in App Store Connect

---

## What this skill will NOT do

- **Never uploads signing certs generated outside EAS.** Managed credentials are the safe path; manual cert management is out of scope.
- **Never touches App Store Connect metadata.** Screenshots, descriptions, review answers all go through the App Store Connect UI or a separate Fastlane skill.
- **Never runs `eas login` non-interactively.** Password prompt must go to the human.
- **Does not migrate the app to Managed Expo.** `install-expo-modules` only adds the autolinking layer needed for EAS to build a bare RN app.

## Escalation

- If Step 3's `install-expo-modules` produces a Podfile conflict: stop. Bare RN Podfiles diverge from what the installer expects; a hand merge is needed. Hand back to the user with the diff.
- If Step 8 fails on cert generation: the user may not have the Apple Developer role that lets EAS create distribution certs. They need to log into Apple Developer Portal and check Team roles. Stop and hand back.
- If Step 11 fails with "cannot resolve ascAppId": user must create the App Store Connect app manually first; the automated `submit` can't create the app record for them.

## Rollback

- `eas.json`, `app.json`, `expo` dependency — all removable if the user decides not to use EAS after all: `npm uninstall expo expo-modules-core && rm eas.json app.json` and revert the Podfile / AppDelegate changes with git.
