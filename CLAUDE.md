# Finova Redesign Project

You are leading a full UI/UX redesign of this app using the `mobile-app-ui-design` skill 
located in .claude/skills/mobile-app-ui-design. Load it for every design decision.

## Workflow — follow these phases IN ORDER. Do not skip ahead.

### Phase 1: Inventory (read-only)
Scan the full codebase and produce a complete screen inventory: file path, screen name, 
nav entry point, key UI elements, shared components used. Also inventory existing shared 
components and the current styling approach/theme files.
Save this to `docs/redesign/01-inventory.md`.
STOP after this phase and summarize what you found. Wait for my go-ahead before Phase 2.

### Phase 2: Design System Proposal
Using the skill, propose a full design system: color palette (including fintech-specific 
gain/loss/status/balance colors), typography scale, spacing (8pt grid), and core component 
specs (buttons, cards, inputs, nav bar, charts).
Save this to `docs/redesign/02-design-system.md`.
STOP after this phase. Wait for my approval before Phase 3.

### Phase 3: Apply to one flagship screen
Once I name the flagship screen, apply the approved design system to it fully. 
Show a before/after summary of what changed and why.
STOP after this phase. Wait for my approval before Phase 4.

### Phase 4: Propagate to remaining screens
Apply the same design system to all remaining screens from the inventory, one at a time, 
in the order listed in 01-inventory.md. After each screen, log it as done in 
`docs/redesign/03-progress.md` before moving to the next.

## Rules
- Never touch business logic, API calls, or data handling — visual/UI layer only.
- Keep every screen's existing navigation and functionality intact.
- Reuse/update shared components rather than creating one-off styles per screen.
- If a screen's current implementation conflicts with the design system in a way that 
  needs a judgment call, stop and ask rather than guessing.
