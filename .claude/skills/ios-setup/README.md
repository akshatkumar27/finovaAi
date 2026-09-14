# ios-setup

> **Requires Xcode locally.** If you do NOT have Xcode installed on this Mac, use `ios-eas-build` instead — it drives EAS Build (Expo's cloud-mac service) and never needs a local Xcode.

Companion to `ios-readiness`. Takes the app from "never built on iOS" → first successful simulator run + submittable state.

## Design principles

- **Every automated step is idempotent.** If a step has already been done, its command is a no-op or produces the same result. Safe to re-run if the user gets interrupted mid-way.
- **Human-only steps stop the runner cold.** Steps that need an Apple ID, Firebase Console, or Xcode UI action print exact instructions, wait for the user to reply `done`, then verify with a filesystem check before continuing. No blind trust — every human step has a verification.
- **Never touches `project.pbxproj` by regex.** The pbxproj is Xcode's authoritative store; hand-editing it silently corrupts projects. Icon generation goes through `sips`, plist edits are structured, `AppDelegate` edits are localized. Signing / capabilities go through the Xcode UI (Step 7).
- **Business logic + certs are off-limits.** No signing key generation, no Fastlane, no TestFlight upload. The developer stays in the loop for anything that could authorize a build to leave the Mac.

## Hand-off prompt (paste into a fresh session on a smaller model)

> You have a skill named `ios-setup`. Invoke it. Follow every step in order. Run each automated step, then run its verification. If a step is labeled HUMAN NEEDED, print the instruction block verbatim and wait for the user to reply `done` before verifying and continuing. Stop and hand back to the user (do not retry) if any verification fails twice in a row, or if a step produces an error the skill's remediation notes don't cover.

## Ten-step sequence at a glance

| # | Type | What it does | Verification |
| --- | --- | --- | --- |
| 0 | auto | Prereq checks (Xcode, CocoaPods, workspace) | version outputs |
| 1 | auto | `pod install` | Podfile.lock contains RN native modules |
| 2 | auto | `npx react-native-asset` for Inter fonts | pbxproj references Inter TTFs |
| 3 | auto | Add `ITSAppUsesNonExemptEncryption=false` to Info.plist | key present |
| 4 | auto | Generate 15 AppIcon PNGs from `logotrans-light.png` via `sips` + write Contents.json | 15 PNGs + JSON |
| 5 | auto | Wire `[FIRApp configure]` into AppDelegate | grep succeeds |
| 6 | **human** | Download GoogleService-Info.plist from Firebase Console → place in `ios/monefyai/` → drag into Xcode target | file exists |
| 7 | **human** | Xcode → set Bundle ID, Team, add Push Notifications + Background Modes capability | `aps-environment` in entitlements + bundle ID no longer template |
| 8 | **human** | Upload APNs auth key to Firebase Console | no filesystem check — trust human's `done` |
| 9 | auto | `xcodebuild … clean build` for iOS Simulator | `** BUILD SUCCEEDED **` |
| 10 | auto | Boot Simulator + `run-ios` for smoke check | visual — human confirms |

## Ordering rationale

Steps 1–5 are pure automation (no external services). They must land before the human steps so the human is asked for only the things a script literally can't do.

Steps 6–8 are ordered so the human only opens Xcode once (Step 7) — Steps 6 and 8 are Firebase Console + Apple Portal. If you asked for Xcode work first and then Firebase work, they'd have to context-switch back to Xcode after.

Step 9 verifies everything before Step 10 (which needs Metro running and a booted simulator). If Step 9 succeeds, Step 10 is a smoke test — not a blocker.

## What still remains after this skill completes

- **Real device install** — needs the device's UDID registered in the Apple Developer Portal and the device provisioning profile refreshed in Xcode.
- **TestFlight archive** — `xcodebuild archive` + `xcodebuild -exportArchive` + `altool` / `xcrun altool`. Deliberately out of scope: this skill is about getting to first-run, not first-ship.
- **App Store metadata** — screenshots, descriptions, review answers, privacy questions. Fastlane or App Store Connect UI.
- **Icon polish** — the auto-generated AppIcons use the raw light-variant mark. If the icon has transparency in shipped app-store PNGs, Apple warns; final icons usually get hand-crafted vs derived. This skill leaves the automation in place as a good enough baseline.

## Files

- `SKILL.md` — the ten-step runner.
- `README.md` — this file.
