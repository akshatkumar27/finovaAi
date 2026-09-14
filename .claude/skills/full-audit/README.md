# full-audit

A functional QA skill for the Finova React Native app, designed to be run by a **low-end / cheap model** (Haiku 4.5, GPT-4o-mini, Gemini Flash) with high reliability.

## Design principles

- **Every check is deterministic.** Grep, `tsc`, or a small Python one-liner produces a boolean pass/fail. No aesthetic judgment, no "does this feel right".
- **Auto-fix is guarded.** Only 4 of the 16 checks have `AUTO-FIX SAFE:` blocks — the rest are flag-only. The escalation section lists exact conditions that mean "stop and hand back to the human".
- **Business logic is out of scope.** API URLs, financial math, reducer semantics, and the Firebase push code path are explicitly off-limits.
- **The report is the deliverable.** Everything the audit finds goes into `docs/audit/YYYY-MM-DD-report.md` — so a smaller model doesn't need to hold the state in context; it just appends.

## Hand-off prompt (paste into a fresh session on a smaller model)

> You have a skill named `full-audit`. Invoke it. Follow every step top-to-bottom. Do not skip checks. When a check has an `AUTO-FIX SAFE:` block and the fix's precondition holds, apply the fix and re-run the check. Otherwise print the finding. At the end, write the report to `docs/audit/<today>-report.md` and print its path. Do not push, deploy, or run tests.

## What's covered

**Static wiring (16 automated checks):**
1. TypeScript compiles
2. No `Toast.show` dangling from the sonner migration
3. No `react-native-vector-icons` / `@expo/vector-icons`
4. Every `<Icon name="X">` uses a registered name
5. Every `navigation.navigate('X')` targets a real route
6. Every `dispatch(X())` targets a real action
7. Every `state.X.Y` selector reads a real slice
8. Every `onPress`/`onSubmit`/etc. references a defined identifier (covers `useState` array destructuring)
9. Every `api.get/post/…` URL matches the `/api/*` shape
10. Whole-slice selectors carry `shallowEqual` (perf)
11. `react-native-toast-message` gone from `package.json`
12. Legacy `constants/theme.ts` isn't leaking into v3 screens
13. Inter font files present in Android + iOS bundles
14. `GestureHandlerRootView` wraps the app root; gesture-handler imported first in `index.js`
15. No hardcoded dark hex colors in shared components
16. No leftover `console.log` in production paths

**Manual test matrix:** appended to the report as a checklist for the human to fill in on-device (auth flows, onboarding validation, main tabs, edit flows, cross-cutting theme + gesture + tabular-figures checks).

## What's NOT covered

- Real end-to-end testing (would need Detox/Maestro — not set up)
- API integration (would need the backend live and a test account)
- Visual regression (would need Chromatic/Percy or on-device screenshotting)
- Native crash / ANR checks (would need actual builds)
- Business-logic correctness (out of scope by design)

If any of these become priorities, they're separate skills.

## Files

- `SKILL.md` — the skill Claude Code loads. Frontmatter's `description` field is what triggers auto-discovery on prompts like "audit the app".
- `README.md` — this file. Meta / usage.

## Extending

Every check follows the same template:
```
### CHECK <n> — <one-line what it verifies>

<bash | python> command

- **PASS:** …
- **FAIL:** …
- **WARN:** …  (optional)
- **AUTO-FIX SAFE:** … (only if the fix is mechanical and won't touch business logic)
```

Add new checks after CHECK 16 and update the count in the finalization section.
