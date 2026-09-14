---
name: full-audit
description: "Run every automated functional check on the Finova app — TypeScript compile, button/handler wiring, navigation targets, API call shapes, Redux action/selector consistency, icon-registry hits, sonner-native call shapes, theme leakage, and a manual test matrix. Emits a structured findings report and applies safe auto-fixes. Designed to be runnable by a low-end model (Haiku, Gemini Flash, GPT-4o-mini): every check is grep/tsc/deterministic — no judgment calls. Use when the user says 'audit the app', 'check everything works', 'run the full audit', or before a release."
allowed-tools: Bash, Read, Edit, Write
---

# Finova full functional audit

Your job: verify the Finova React Native app builds and every user-facing interaction is correctly wired, then either auto-fix or flag each failure. Every check below is deterministic — no aesthetic judgment. Work **top to bottom, don't skip**. Stop only if a check errors and its guidance says to stop.

## How to work

- **You are running in the app repo.** All paths in this skill are relative to the repo root. If your CWD is a worktree, that's fine.
- **Report as you go.** After each numbered check, print one line: `CHECK <n> <PASS|FAIL|WARN>: <one-line summary>`. If FAIL, also print the grep output that triggered it (max 20 lines).
- **Only apply auto-fixes explicitly labeled `AUTO-FIX SAFE:` below.** For anything else, print the finding and move on — the human decides.
- **Never touch business logic.** No changes to API URLs, financial-calc math, reducer semantics, auth flow, or `NotificationService.ts`. If a check demands one of these, flag it, don't fix it.
- **After all checks, write the report** to `docs/audit/<YYYY-MM-DD>-report.md` and list every FAIL/WARN.

## Setup

```bash
cd $(git rev-parse --show-toplevel)
mkdir -p docs/audit
DATE=$(date +%F)
REPORT=docs/audit/${DATE}-report.md
echo "# Full functional audit — ${DATE}" > "$REPORT"
echo "" >> "$REPORT"
```

Every `>> "$REPORT"` line below appends to this file.

---

## Checks

### CHECK 1 — TypeScript compiles cleanly

```bash
npx tsc --noEmit 2>&1 | tee /tmp/tsc.out
```

- **PASS:** exit 0, no output.
- **FAIL:** any error. Print the first 30 lines to the report. **AUTO-FIX SAFE:** only for `TS2305 Cannot find name` when it's a plain typo of an existing export (grep for the near-miss). For everything else — flag and stop; a broken type-check invalidates every downstream check.

### CHECK 2 — No dangling `Toast.show` (should be sonner-native `toast(...)`)

```bash
grep -rn "Toast\.show\|from 'react-native-toast-message'" src/ App.tsx index.js 2>/dev/null
```

- **PASS:** empty output.
- **FAIL:** any hit. **AUTO-FIX SAFE:** convert `Toast.show({type:'X', text1, text2})` → `toast.X(text1, { description: text2 })` per the migration in commit `e80d7c5`. Update import to `import { toast } from 'sonner-native'`.

### CHECK 3 — No `react-native-vector-icons` / `@expo/vector-icons` (Lucide only)

```bash
grep -rn "react-native-vector-icons\|@expo/vector-icons" src/ App.tsx 2>/dev/null
```

- **PASS:** empty. **FAIL:** flag, don't fix (replacement requires design intent).

### CHECK 4 — Every `<Icon name="X">` uses a name from the registry

```bash
# extract names used
grep -rhoE "<Icon [^/]*name=\"([a-z0-9-]+)\"" src/ | sed -E 's/.*name="([a-z0-9-]+)".*/\1/' | sort -u > /tmp/icon-names-used
# extract names registered
# Match both  'compound-name':  and  simplename:  registry keys.
python3 -c "
import re, pathlib
src = pathlib.Path('src/components/Icon.tsx').read_text()
m = re.search(r'const ICONS = \\{(.+?)\\} as const;', src, re.S)
if m:
    for k in re.findall(r'^\\s*[\"\\']?([a-z0-9-]+)[\"\\']?\\s*:', m.group(1), re.M):
        print(k)
" | sort -u > /tmp/icon-names-registered
# every used name must be registered
comm -23 /tmp/icon-names-used /tmp/icon-names-registered
```

- **PASS:** last command prints nothing. **FAIL:** every unregistered name will crash the render. **AUTO-FIX SAFE:** none — user must register the icon in `src/components/Icon.tsx`. Flag.

### CHECK 5 — Every `navigation.navigate('X')` targets a registered route

```bash
# routes used
grep -rhoE "navigation\.navigate\(['\"]([A-Z][A-Za-z0-9]+)['\"]" src/ | sed -E "s/.*navigate\(['\"]([A-Z][A-Za-z0-9]+)['\"].*/\1/" | sort -u > /tmp/routes-used
# routes declared
grep -rhoE "name=['\"]([A-Z][A-Za-z0-9]+)['\"]" src/navigation/ | sed -E "s/.*name=['\"]([A-Z][A-Za-z0-9]+)['\"].*/\1/" | sort -u > /tmp/routes-declared
comm -23 /tmp/routes-used /tmp/routes-declared
```

- **PASS:** nothing printed. **FAIL:** dead route — the button navigates to a screen that doesn't exist. Flag with the calling file + route name.

### CHECK 6 — Every Redux `dispatch(X())` targets a real action creator

```bash
# action creators exported by slices
grep -rhE "^export const \{ ([^}]+) \} = \w+\.actions" src/store/slices/ | sed -E 's/.*\{ ([^}]+) \}.*/\1/' | tr ',' '\n' | tr -d ' ' | sort -u > /tmp/actions-declared
# actions dispatched
grep -rhoE "dispatch\(([a-zA-Z][A-Za-z0-9]+)\(" src/ App.tsx | sed -E 's/.*dispatch\(([a-zA-Z][A-Za-z0-9]+)\(.*/\1/' | sort -u > /tmp/actions-dispatched
comm -23 /tmp/actions-dispatched /tmp/actions-declared > /tmp/action-diff
# Filter out non-slice dispatches (thunks, custom action creators are OK — only fail if the name looks like a slice action but isn't declared)
```

- **PASS:** `/tmp/action-diff` is empty or only contains identifiers you can trace to an imported thunk. **WARN:** any name that isn't imported anywhere. Grep for the name; if `import.*<name>.*from.*slices` doesn't appear in the caller, flag.

### CHECK 7 — Every `state.X.Y` selector reads a slice/field that exists

```bash
grep -rhoE "state\.([a-zA-Z]+)\.([a-zA-Z]+)" src/ | sort -u > /tmp/selectors
# slice keys declared in store/index.ts
grep -oE "^\s+([a-z][a-zA-Z]+):" src/store/index.ts | grep -v "reducer:" | tr -d ' :' | sort -u > /tmp/slice-keys
```

Grep every selector's first segment against `/tmp/slice-keys`. Report any misses. **FAIL:** typo'd slice name. **AUTO-FIX SAFE:** only for a clear near-miss to an existing key (e.g. `state.setting.X` vs `state.settings.X`). Otherwise flag.

### CHECK 8 — Every `onPress` / `onSubmit` / `onChangeText` references a defined identifier

```bash
# For each <Component ... onPress={handleFoo}> — check handleFoo is defined in the same file
python3 <<'PY'
import re, pathlib, sys
issues = []
for f in pathlib.Path('src').rglob('*.tsx'):
    s = f.read_text()
    for m in re.finditer(r'on(?:Press|Submit|ChangeText|SubmitEditing|Focus|Blur|EndEditing)=\{([a-zA-Z_][A-Za-z0-9_]*)\}', s):
        name = m.group(1)
        # skip inline arrows / known props
        if name in ('onPress','onSubmit','handleSubmit','undefined','null'):
            continue
        # heuristic: identifier must appear as a const/function/prop
        pat = rf'\b(const|let|var|function)\s+{name}\b|\b{name}\s*:\s*|\({name}(,|\))|,\s*{name}\s*[,)]|\[[^\]]*,\s*{name}\s*\]'
        if not re.search(pat, s):
            issues.append(f'{f}: {name}')
for i in issues:
    print(i)
PY
```

- **PASS:** empty. **FAIL:** button handler is undefined. Flag — never auto-fix (could be a typo or missing implementation).

### CHECK 9 — `api.get/post/put/delete` URL paths look like real endpoints

```bash
grep -rhoE "api\.(get|post|put|delete|patch)\(['\"]([^'\"]+)['\"]" src/ | sed -E "s/.*api\.[a-z]+\(['\"]([^'\"]+)['\"].*/\1/" | sort -u | tee /tmp/api-urls
```

- **WARN** on each URL that:
  - doesn't start with `/api/`  (all backend endpoints in this app do)
  - contains `${` template braces (may or may not be intentional — flag for review)
- Do not modify URLs.

### CHECK 10 — `useSelector` on whole slices carries `shallowEqual` (perf)

```bash
grep -rn "useAppSelector((state) => state\.[a-z]\+);\?$\|useSelector((state: RootState) => state\.[a-z]\+);\?$" src/ 2>/dev/null | grep -v shallowEqual
```

- **PASS:** empty. **WARN:** every hit is an unnecessary-re-render risk. **AUTO-FIX SAFE:** add `, shallowEqual` before the closing paren and add `import { shallowEqual } from 'react-redux'` if missing (pattern established in commit `1b1c089`).

### CHECK 11 — No lingering `react-native-toast-message` in package.json

```bash
grep -c "react-native-toast-message" package.json || echo 0
```

- **PASS:** 0. **FAIL:** `npm uninstall react-native-toast-message --legacy-peer-deps`. **AUTO-FIX SAFE.**

### CHECK 12 — `constants/theme.ts` legacy import isn't leaking into v3 screens

```bash
grep -rln "from '\.\./\.\./constants'" src/screens/ 2>/dev/null | while read f; do
  # v3 screens should not import legacy theme; only API_BASE_URL is OK
  if grep -qE "from '\.\./\.\./constants';?" "$f" && ! grep -qE "import.*API_BASE_URL.*from '\.\./\.\./constants'" "$f"; then
    echo "$f"
  fi
done
```

- **PASS:** empty. **WARN:** flag — legacy theme values (colors/typography from `constants/theme.ts`) will not match the current palette or Inter font. Do not auto-fix — needs case-by-case migration.

### CHECK 13 — Inter font files present in both Android and iOS bundles

```bash
ls android/app/src/main/assets/fonts/Inter-*.ttf 2>/dev/null | wc -l  # expect 5
grep -c "Inter-.*\.ttf" ios/monefyai/Info.plist                        # expect 5
```

- **PASS:** both are 5. **FAIL:** the font sweep in commit `3fab1ed` was undone; rebuild will render in system font. Print which side is missing.

### CHECK 14 — GestureHandlerRootView wraps the app root

```bash
grep -q "GestureHandlerRootView" App.tsx && echo OK || echo MISSING
grep -q "^import 'react-native-gesture-handler';" index.js && echo OK || echo MISSING
```

- **PASS:** both OK. **FAIL:** sonner-native's swipe-to-dismiss will crash the app. Flag — don't auto-fix (App.tsx surgery).

### CHECK 15 — No hardcoded dark colors in shared components

```bash
grep -rnE "#0a0a14|#141420|backgroundColor: ['\"]#0" src/components/ 2>/dev/null | grep -v CustomToast
```

- **PASS:** empty. **WARN:** hardcoded dark colors will read wrong under the light theme.

### CHECK 16 — No `console.log` left in production paths

```bash
grep -rn "console\.log" src/ App.tsx 2>/dev/null | grep -v NotificationService | head -20
```

- **WARN** each. Do not auto-delete — `console.error` is intentional in catch blocks and looks similar.

---

## Manual test matrix

The above catches static wiring problems. The following requires the app running on a device or simulator. Do **not** attempt to run these yourself — instead, print the checklist to the report so the human runs it on-device and pastes back results.

Append verbatim to the report:

```markdown
## Manual on-device checks

Run each flow on both light and dark theme. Mark ✅ / ❌ / ⚠️ per row.

### Auth
- [ ] Splash renders with Inter font + animated dots, both themes
- [ ] Login: enter valid email → OTP screen; invalid email → toast.error visible + description
- [ ] Signup: incomplete form → toast.error; success → OTP screen
- [ ] OTP resend timer counts down with tabular figures
- [ ] Wrong OTP → toast.error; correct OTP → onboarding (new) or main (existing)

### Onboarding
- [ ] Monthly income accepts amount; back preserves value
- [ ] Monthly expenses caps at income; error toast shows correct available number
- [ ] Monthly EMI validates against available budget
- [ ] EMI outstanding accepts 0
- [ ] Monthly investment caps at available
- [ ] Goal selection loads AI suggestions (or falls back silently)
- [ ] AddGoal validates budget, saves, lands on GoalPulse

### Main (tab home = GoalPulse)
- [ ] Score ring renders + animates
- [ ] Goal cards tap → Contributions screen
- [ ] Bell icon → NotificationScreen
- [ ] Profile icon → ProfileScreen
- [ ] + FAB → AddGoal (only if budget available; else toast.error)

### Contributions
- [ ] Amount editor accepts input, tabular figures line up
- [ ] Payment card enabled/disabled by due-date logic
- [ ] Edit pencil icon → editable state; save persists

### EditGoal
- [ ] Calendar month nav works (‹ / › chevrons)
- [ ] Day pick → date field updates with tabular-nums
- [ ] Budget-exceeded toast fires correctly
- [ ] Save + Delete both fire toasts and return to Pulse

### InvestHub / Vault / Notifications / Profile
- [ ] Hero values render with tabular figures
- [ ] Theme toggle in Profile flips instantly, all screens
- [ ] Sign out → confirm modal → returns to Login
- [ ] Personal info values match Redux state after edits

### Cross-cutting
- [ ] Toast swipe-to-dismiss works (proves gesture-handler wired)
- [ ] Back buttons align + navigate correctly on every screen
- [ ] Status bar barStyle flips between light-content and dark-content on theme toggle
```

---

## Finalization

At the end:
1. Count PASS/FAIL/WARN across the automated checks. Print totals to the report.
2. If any FAIL was auto-fixed, run `npx tsc --noEmit` again and stamp the report `RE-VERIFIED PASS` or list the new errors.
3. Do NOT run tests, deploy, or push to remote. This skill is read-mostly.
4. Print the report path so the user can open it.

## Escalation rules

Any of these means stop and hand back to the human — do not attempt to fix:
- CHECK 1 fails (broken type-check invalidates the rest).
- CHECK 8 flags an undefined handler in a critical flow (Auth, Onboarding, Save/Delete). These usually indicate a missing implementation, not a typo.
- Any check mentions `NotificationService.ts`, `api.ts`, or the Firebase/push code path.
- Any check would require changing an API URL, financial-math constant, or reducer semantics.
- More than 10 auto-fixes needed in one run — a run this dirty deserves a human review before the fix pass lands.
