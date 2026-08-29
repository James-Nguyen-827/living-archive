# Project Court Redesign Handoff

Updated: 2026-08-28

## Workspace

- Main repository: `C:\Users\James\Documents\living-archive`
- Feature worktree: `C:\Users\James\Documents\living-archive\.superpowers\worktrees\project-court`
- Feature branch: `codex/project-court`
- The main working tree has not been modified by this implementation.
- No commit has been created. Do not commit unless the user requests it.
- Git operations in the worktree may require:
  `git -c safe.directory='C:/Users/James/Documents/living-archive/.superpowers/worktrees/project-court' -C 'C:/Users/James/Documents/living-archive/.superpowers/worktrees/project-court' ...`

An Astro development server was last observed on `127.0.0.1:4321` as Node PID `16604`. Confirm it is still running before using poster capture. Do not stop unrelated Node processes.

## Approved Direction

Replace the Work Gearhouse with Project Court while preserving the public `work-tower` module ID, Work content, world topology, interaction contract, palette, and `bridge-sweep` reaction.

Project Court uses two unequal L-shaped wings around a visible diagonal courtyard. It has a taller rear wing, broader lower front wing, rear and front moving project slabs, and a coral bridge that rotates down last. The footprint must remain within `1.8 x 1.8` units, height near `2.8` units, and the old Gearhouse budget of approximately 8 draw calls and 324 triangles.

Arrival remains `1.05s`; exit remains `0.65s`. Reselection replays the pose, reduced motion snaps to final states, and neutral coral bridge motion is limited to `+/-0.02` unit hover and `+/-0.025` radian tilt. Ambient bridge motion is disabled while active or under reduced motion.

## Implemented

- Renamed the internal archetype from `gearhouse` to `project-court`.
- Added a Project Court static design with nine merged-tone parts, an open courtyard, four-face warm windows, and an authored extent of `[1.78, 2.84, 1.78]`.
- Added ordered `rear-slab`, `front-slab`, and `coral-bridge` assemblies.
- Replaced `GearhousePose` and `gearhousePose()` with `ProjectCourtPose` and `projectCourtPose()`.
- Staged the rear slab first, front slab second, and coral bridge last.
- Added neutral-only coral bridge hover and tilt to `ProjectCourtTower`.
- Removed obsolete Work-specific Gearhouse pose and idle helpers.
- Added unit coverage for archetype mapping, assembly keys, envelope, proportions, four-face windows, budget, staged motion, clamping, and final poses.
- Renamed the active visual test to Project Court and generated the new active baseline.
- Regenerated all four orbit baselines and visually inspected them. The courtyard remains readable, the coral bridge is visible beside the Work label, and the landmark remains distinct from the Experiments portal.

## Verification Completed

- Fresh worktree install: 552 packages installed, 0 vulnerabilities.
- Baseline before implementation: 11 test files and 70 tests passed.
- Focused final unit run: 2 test files and 32 tests passed.
- `npm run check`: 67 files checked with 0 errors, warnings, or hints.
- Project Court active screenshot inspected and accepted.
- Orbit screenshots at 22, 67, 157, and 247 degrees regenerated and inspected.

The full post-change unit suite, world validation, production build, complete Playwright suite, and poster capture have not yet been completed.

## Current Changes

Modified source and tests:

- `src/components/world/tower-designs.ts`
- `src/components/world/tower-designs.test.ts`
- `src/components/world/tower-modules.tsx`
- `src/components/world/world-motion.ts`
- `src/components/world/world-motion.test.ts`
- `tests/e2e/tower-visual.spec.ts`

Modified visual baselines:

- `tests/e2e/visual-orbit.spec.ts-snapshots/world-angle-022-desktop-1440-orbit-win32.png`
- `tests/e2e/visual-orbit.spec.ts-snapshots/world-angle-067-desktop-1440-orbit-win32.png`
- `tests/e2e/visual-orbit.spec.ts-snapshots/world-angle-157-desktop-1440-orbit-win32.png`
- `tests/e2e/visual-orbit.spec.ts-snapshots/world-angle-247-desktop-1440-orbit-win32.png`
- New: `tests/e2e/tower-visual.spec.ts-snapshots/project-court-active-desktop-1440-win32.png`

Cleanup still needed:

- Remove obsolete `tests/e2e/tower-visual.spec.ts-snapshots/gearhouse-active-desktop-1440-win32.png` after confirming no test references it.
- Inspect and remove the untracked `debug.log` if it is only interrupted-tool output.

## Remaining Work

1. Update `DESIGN.md` and `AGENTS.md` to describe Project Court and remove Gearhouse handoff guidance.
2. Remove the obsolete Gearhouse active baseline and inspect `debug.log`.
3. Run the complete verification sequence from the feature worktree:

```powershell
npm test -- --run
npm run validate:world
npm run check
npm run build
npx playwright test --workers=3
```

4. Confirm the complete scene remains below 100 draw calls and 75,000 triangles.
5. Regenerate `public/world-poster.png` with a local site running on port 4321:

```powershell
npm run capture:poster
```

6. Inspect the final poster and representative active, day/night, reduced-motion, responsive, and orbit snapshots.
7. Review `git diff` and `git status`. Preserve unrelated user work and do not commit unless requested.

## Tooling Notes

- The in-app browser bootstrap failed twice with `Cannot redefine property: process`, so visual work used the repository Playwright setup instead.
- Playwright Chromium revision 1234 was installed successfully.
- On this Windows environment, focused Playwright commands produced their expected results and wrote snapshots but sometimes failed to terminate before the outer command timeout. Check the per-test report and generated artifacts rather than treating an outer timeout alone as a test failure.
- Use three Playwright workers or fewer. The project already documents WebGL timing starvation at the default six workers.
