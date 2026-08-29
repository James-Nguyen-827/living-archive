# Field Notes Index Engine Redesign — Handoff

## Exact goal

Replace the Field Notes Pagewell landmark with a tall, intricate **Index Engine** while preserving the public Field Notes experience and the site's fixed-world constraints.

The finished landmark must:

- Keep the public module ID `notes-tower`, Field Notes label/content/routes, world topology, vegetation, camera framing, label projection, archive-window behavior, and 4.5-unit authored height.
- Replace internal archetype `pagewell` with `index-engine` and reaction kind `page-riffle` with `index-sequence`.
- Use a stepped base, offset rear spine, warm-lit core, exterior guide rail, four keyed chambers, two crown halves, and a coral carriage/cap.
- Use six keyed pieces sharing one instanced three-box primitive geometry, differentiated by authored scale, orientation, and placement.
- Keep warm window slits on all four faces of the static core.
- Keep the complete neutral and animated geometry inside the 1.8 × 1.8 horizontal envelope and below the existing stable label clearance.
- Resolve to exactly five draw calls: two merged static tones, one instanced keyed-piece mesh, one coral carriage mesh, and one merged window mesh.
- Animate over 1.4 seconds on arrival: cap drops to the base, climbs the guide rail, unlocks four chambers bottom-to-top, opens the crown, and re-docks at the summit.
- Reverse over 0.8 seconds on exit. Replay, reverse-from-current-progress retargeting, dusk, demand rendering, and reduced-motion snapping must remain deterministic.
- Hold without looping motion when active. Neutral carriage motion may dip by at most 0.03 units and must disappear under reduced motion.
- Refresh affected visual baselines and `public/world-poster.png`, then run the complete verification matrix.

## Workspace and branch

Implementation is isolated from the main checkout.

- Main checkout: `C:\Users\James\Documents\Website`
- Feature worktree: `C:\Users\James\Documents\Website\.superpowers\worktrees\codex-index-engine`
- Feature branch: `codex/index-engine`
- Base commit: `6fa555ae4f489b16209dc6065e875baecf2053a7`
- No commits have been created. This is intentional: `AGENTS.md` says not to commit unless the user requests it.
- The main checkout has only the pre-existing/untracked `output/` directory plus this handoff file. Do not delete or reset `output/`.
- Continue implementation inside the feature worktree, not the main checkout.

## Decisions made

- Used the already ignored `.superpowers/worktrees` directory because `.worktrees` was not ignored and the project instructions prohibit incidental commits.
- Preserved all visitor-facing Field Notes copy and routes; only internal tower/reaction names changed.
- Added `INDEX_ENGINE_REACTION_DURATIONS = { arrival: 1.4, exit: 0.8 }` and passed it through the existing reversible tower-reaction state machine.
- Kept the six keyed assemblies on one shared C-shaped three-box geometry/instance group.
- Kept the coral carriage as its own mesh and the warm four-face windows as one merged mesh.
- Kept static structure split into two material meshes, yielding the required five-call renderer shape.
- Authored four independently staged chamber poses, two crown-half poses, a carriage path, and a neutral ambient carriage offset as pure typed motion helpers.
- The first carriage path collided with moving chambers, so integration moved it to an exterior route. That collision fix introduced the timing defect described below and is not yet acceptable.
- Visual assets and screenshots were deliberately deferred until code and spatial behavior pass review.

## Current code state

### Completed and reviewed core work

Task 1 (design and pure motion contracts) was implemented test-first and passed a specification review after one correction to make final re-docking occur during `0.94–1.00` rather than arriving early and holding.

Implemented in the feature worktree:

- `src/components/world/tower-designs.ts`
  - `pagewell` replaced by `index-engine`.
  - Index Engine static assembly, four keyed chambers, two keyed crown halves, coral carriage, four-face windows, envelope, and budget definitions added.
  - `TowerAssembly` supports authored rotation.
- `src/components/world/tower-designs.test.ts`
  - Covers archetype mapping, authored composition, shared keyed primitive, distinct proportions, four-face windows, envelope, height, and exact five-draw-call estimate.
- `src/components/world/world-motion.ts`
  - Adds typed Index Engine chamber, crown, carriage, ambient, and duration helpers.
- `src/components/world/world-motion.test.ts`
  - Covers staging, final re-docking, clamping, finite values, reversibility, and held/reduced-motion contracts.

### Integrated but not yet approved

Task 2 integrated the design into the scene and metadata:

- `src/components/world/tower-modules.tsx`
  - `PagewellTower` replaced by `IndexEngineTower`.
  - Uses one six-instance keyed mesh, two static meshes, one carriage mesh, and one window mesh.
  - Applies authored base rotations/scales plus pure pose transforms.
  - Neutral ambient carriage offset fades with reaction progress and is absent for reduced motion/held state.
- `src/components/world/world-map.ts` and `world-map.test.ts`
  - Field Notes now uses `index-sequence` with `1_400` ms metadata while retaining `notes-tower`.
- `src/components/world/world-types.ts`
  - Reaction union renamed from `page-riffle` to `index-sequence`.
- `src/components/world/index-engine-tower.test.tsx` (new)
  - Renderer integration coverage exists but is still too permissive.
- `src/components/world/index-engine-spatial.test.ts` (new)
  - Samples 101 arrival and 101 exit poses with OBBs for bounds, label clearance, guide/rack collision, and moving-part collision checks.
- `DESIGN.md`
  - Index Engine documentation added, with one wording error still present.

Current feature-worktree changes reported by `git status --short`:

- Modified: `DESIGN.md`
- Modified: `src/components/world/tower-designs.test.ts`
- Modified: `src/components/world/tower-designs.ts`
- Modified: `src/components/world/tower-modules.tsx`
- Modified: `src/components/world/world-map.test.ts`
- Modified: `src/components/world/world-map.ts`
- Modified: `src/components/world/world-motion.test.ts`
- Modified: `src/components/world/world-motion.ts`
- Modified: `src/components/world/world-types.ts`
- Untracked: `src/components/world/index-engine-spatial.test.ts`
- Untracked: `src/components/world/index-engine-tower.test.tsx`

## Review failures and interrupted fix state

The Task 2 specification review returned **Needs fixes** with no critical issues and three important issues:

1. **Initial carriage drop is not monotonic.** In `world-motion.ts`, the `0.00–0.04` segment currently moves from `[0, 4.38, 0]` to `[0.68, 4.5, -0.55]`, so the carriage rises before descending. This violates the approved `0.00–0.16` drop beat.
2. **Spatial collision exclusions were too broad.** The reviewed version ignored whole chamber/rack and crown/rack categories until stage thresholds, plus carriage/crown pairs across broad docking windows. Exemptions must name exact authored socket/contact pairs and use the smallest legitimate progress windows.
3. **Renderer regression coverage is too weak.** `index-engine-tower.test.tsx` asserts one instanced mesh but only requires at least three ordinary meshes. It must enforce the exact five draw-call-producing renderer structure and verify all six keyed instance transforms.

Minor review issue:

- `DESIGN.md` says “six keyed C-shaped chambers”; it must say four chambers plus two crown halves.

An implementer began the first fix round, but the user asked for this handoff and all implementation was immediately interrupted. The worktree is therefore in a **partial, unverified fix state**:

- A new sampled monotonic-drop assertion is present in `world-motion.test.ts` (65 samples over `0.00–0.16`).
- The carriage implementation still contains the rising clearance waypoint at `[0.68, 4.5, -0.55]`, so that new test is expected to fail.
- The current spatial test records all rack/rail and pairwise collisions without exclusions. This is stricter than the rejected broad exemptions, but it has not been run and may expose intentional authored socket contacts that need narrowly named exceptions.
- The renderer test is still permissive (`mesh` count `>= 3`) and does not verify all six instance matrices/transforms.
- The incorrect DESIGN wording remains.
- No tests were run after this interrupted partial fix. Treat the current suite status as unknown until rerun.

## Last verified results

These results were recorded before the rejected review and before the interrupted partial fix:

- Baseline before implementation: `npm test -- --run` — 14 files, 88 tests passed.
- Task 1 after re-docking fix: `npm test -- --run` — 14 files, 93 tests passed.
- Task 2 focused suite: 5 files, 51 tests passed.
- Task 2 full unit suite: 16 files, 96 tests passed.
- Task 2 type/content check: 74 files, 0 errors, 0 warnings, 0 hints.

These passing results do **not** clear the current partial worktree. Production build, world validation, scene-budget confirmation, Impeccable detection, Playwright, screenshots, visual baselines, and poster refresh have not yet been completed for this redesign.

## Remaining work

1. Finish Task 2 fix round 1 test-first:
   - Redesign the carriage route so every sampled Y value is non-increasing from `0.00–0.16`, while keeping the carriage collision-free and inside the envelope.
   - Run the strict spatial test, inspect each collision, and add only exact, named, minimal socket/contact exclusions when physically intentional.
   - Make the renderer test prove exactly two static tone meshes + one instanced keyed mesh + one carriage mesh + one window mesh, and validate six instance matrices/transforms.
   - Correct the DESIGN wording.
   - Run focused tests, full unit tests, and `npm run check`.
2. Perform a fresh Task 2 specification review focused on motion timing, exclusion precision, renderer budget assertions, reduced motion, and deterministic reversibility.
3. Refresh visual coverage:
   - Rename/update the obsolete active Pagewell snapshot to the Index Engine name where applicable.
   - Update affected desktop/mobile, neutral/held, day/night, and orbit baselines.
   - Regenerate `public/world-poster.png` using the existing capture workflow (poster capture expects a local site on port 4321).
   - Inspect representative views for silhouette, negative space, carriage path, crown docking, label clearance, mobile framing, and night window readability.
4. Run full release verification:
   - `npm test -- --run`
   - `npm run validate:world`
   - `npm run check`
   - `npm run build`
   - scene-budget checks (must remain at or below 100 desktop draw calls / 150k triangles and 75k mobile target; Index Engine itself must be exactly five calls)
   - Impeccable detector: `node C:\Users\James\.agents\skills\impeccable\scripts\detect.mjs --json <changed targets>`
   - `npx playwright test --workers=3` (the project handoff warns six workers can starve a WebGL timing assertion)
5. Request a final whole-change code/spec review. Resolve any important issues and re-run affected verification.
6. Do not commit, merge, delete, reset, or clean unless the user explicitly asks.

## Supporting notes

- Project instructions are in `C:\Users\James\Documents\Website\AGENTS.md` and must be read before resuming.
- The implementation plan is at `.superpowers/sdd/2026-08-29-index-engine/../../plans/2026-08-29-index-engine.md` inside the feature worktree; the canonical absolute path is `C:\Users\James\Documents\Website\.superpowers\worktrees\codex-index-engine\.superpowers\plans\2026-08-29-index-engine.md`.
- Task reports and review artifacts are under `C:\Users\James\Documents\Website\.superpowers\worktrees\codex-index-engine\.superpowers\sdd\2026-08-29-index-engine`.
- Windows sandboxed Vitest/Vite sometimes fails with `spawn EPERM`; rerun the same command with the required execution approval rather than changing application code.
- Preserve all unrelated existing work. Do not touch the main checkout's `output/` directory.

## Resume Prompt

```text
Open C:\Users\James\Documents\Website\HANDOFF.md and read it completely, then read C:\Users\James\Documents\Website\AGENTS.md. Continue the Field Notes Index Engine redesign only in C:\Users\James\Documents\Website\.superpowers\worktrees\codex-index-engine on branch codex/index-engine; do not commit, reset, clean, delete unrelated files, or work in the main checkout. Start by inspecting the current partial fix and running the focused Index Engine tests. Finish Task 2 fix round 1 test-first: make carriage Y monotonic non-increasing throughout progress 0.00–0.16 without collisions or envelope violations; allow only exact named socket/contact collision exceptions over minimal time windows; strengthen the renderer test to enforce the exact five draw-call-producing structure and all six keyed instance transforms; and correct DESIGN.md from “six chambers” to four chambers plus two crown halves. Then obtain a fresh specification review, refresh affected Playwright visual baselines and public/world-poster.png, visually inspect representative desktop/mobile, neutral/held, day/night, and orbit views, run the full verification matrix documented in HANDOFF.md with Playwright at three workers, run the Impeccable detector once at the end, request a final whole-change review, and report evidence. Preserve notes-tower, Field Notes content/routes/topology, deterministic replay/retargeting/dusk/reduced-motion behavior, the 1.8 × 1.8 envelope, stable label clearance, and exactly five Index Engine draw calls.
```
