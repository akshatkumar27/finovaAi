# ios-eas-build

Replaces `ios-setup` when Xcode is not installed on the developer's Mac. Uses Expo Application Services (EAS Build) — a managed cloud-mac build farm that handles pod install, signing, `xcodebuild archive`, and IPA upload.

## When to use which skill

| Situation | Skill |
| --- | --- |
| Xcode is installed on this Mac | `ios-setup` — walks through pod install + Xcode signing + local build |
| No Xcode installed OR building from CI / a Linux dev machine | `ios-eas-build` — this skill |
| Just want a readiness check without doing anything | `ios-readiness` — deterministic status |

## What EAS Build costs

- **Free tier:** ~30 iOS builds/month, includes managed signing credentials
- **Paid tier ($19/month):** unlimited priority builds
- **Apple Developer account:** $99/year (required regardless of build path — needed for TestFlight and the App Store)

Total minimum for a first TestFlight ship: **$99/year Apple + free EAS tier**.

## Design principles

- **Every automated step is idempotent** — safe to re-run if interrupted.
- **Human steps stop the runner cold.** The skill prints exact instructions, waits for `done`, then verifies from the filesystem or a CLI check before continuing.
- **Bare RN preserved.** `install-expo-modules` adds only the Expo autolinking layer that EAS needs to read `app.json` for build metadata — it does not convert the project to Managed Expo.
- **Never uploads signing certs generated outside EAS.** Managed credentials (EAS generates and stores them in their cloud) is the safe path for solo devs.
- **Never touches App Store Connect metadata.** Screenshots, descriptions, review answers all go through App Store Connect UI or a separate Fastlane skill.

## Twelve-step sequence at a glance

| # | Type | What it does |
| --- | --- | --- |
| 0 | auto | Prereq check (node, npm) |
| 1 | auto | `npm install -g eas-cli` |
| 2 | **human** | `eas login` (interactive Expo credentials) |
| 3 | auto | `npx install-expo-modules` (adds Expo autolinking to the bare RN Podfile + AppDelegate) |
| 4 | auto | Write `eas.json` with preview + production build profiles |
| 5 | auto | Write `app.json` with iOS bundle ID, display name, version, icon path |
| 6 | **human** | Enroll in Apple Developer Program + register the bundle ID |
| 7 | **human** | Generate an app-specific password on appleid.apple.com (for `eas submit`) |
| 8 | auto | `eas build --platform ios --profile preview` — first cloud build |
| 9 | **human** | Wait for EAS build to finish (5-15 min); paste log if it fails |
| 10 | **human** | Download `GoogleService-Info.plist` from Firebase Console; skill wires it into `app.json` |
| 11 | auto | `eas submit --platform ios --profile production --latest` — upload to TestFlight |
| 12 | **human** | (Optional) Upload APNs auth key to Firebase for push in TestFlight builds |

## Hand-off prompt (paste into a fresh session on a smaller model)

> You have a skill named `ios-eas-build`. Invoke it. Follow every step in order. Run each automated step, then run its verification. If a step is labeled HUMAN NEEDED, print the instruction block verbatim and wait for the user to reply `done` before verifying and continuing. Stop and hand back to the user (do not retry) if any verification fails twice in a row, if `install-expo-modules` produces a Podfile conflict, or if an EAS command fails on cert generation.

## What still remains after this skill completes

- **Public App Store submission** — this skill only ships to TestFlight (internal + external). For the store you also need: App Store Connect app metadata, review answers, screenshots at every required size, age rating, privacy questions, and Apple's review turnaround (~1-3 days).
- **Real-device install without TestFlight** — needs the device UDID registered in Apple Developer Portal + an ad-hoc provisioning profile. Not covered here.
- **CI-triggered builds** — the manual `eas build` command can be wrapped in a GitHub Action; separate task.

## Files

- `SKILL.md` — the twelve-step runner.
- `README.md` — this file.

## Related

- `ios-readiness` — the audit skill you should run first to see what's blocked.
- `ios-setup` — the Xcode-required companion. Use `ios-setup` if the user later installs Xcode.
- `full-audit` — pre-build sanity check for the JS side.
