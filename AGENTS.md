# Living Archive — Agent Handoff

This file is the durable project context for coding agents, including Cursor. Read it before changing the site.

## Project intent

Build an original personal portfolio that behaves like a place rather than a résumé grid. The homepage is a low-poly, orthographic eco-brutalist habitat inspired by the playfulness of Monument Valley and spatial portfolio experiences, without copying their assets or identity.

Visitors can freely orbit one stable sculpture, select an island, and watch a small geometric traveler navigate there automatically. Work, Field Notes, Experiments, Hobbies, and About must also remain immediately accessible through semantic HTML, static routes, and `/index`.

## Non-negotiable interaction rules

- No WASD, arrow-key locomotion, physics, scores, collectibles, audio, or click-to-enter gate.
- Pointer/touch drag controls continuous yaw at about `0.008` radians per horizontal pixel. Q/E and visible buttons nudge by 22.5 degrees.
- The world topology never changes with rotation. Island selection runs A* over one fixed graph and may be retargeted mid-route.
- Labels are accessible DOM projected from authored 3D anchors; they stay upright and clickable.
- The coral traveler and tower caps remain. The old central coral/orange rail must not return.
- Zone, World Index, and entry-preview content share one architectural DOM window. Long-form work keeps dedicated routes.
- Theme changes use a reversible 900ms miniature-dusk transition. Reduced motion presents final states immediately.
- WebGL, reduced-motion, data-saving, JavaScript-disabled, keyboard-only, and conventional-route paths are first-class.
- Never replace authored primitive geometry with generated meshes or realistic textures.

## Stack and commands

- Astro 7, strict TypeScript, React 19, React Three Fiber 9, Three.js, MDX.
- Styling is vanilla CSS with project tokens; do not add a utility or animation framework.

```powershell
npm install
npm run dev
npm test -- --run
npm run check
npm run build
npm run test:e2e
npm run capture:poster
```

The Playwright configuration builds the static site and serves it on `127.0.0.1:4322`. Poster capture expects an already-running local site on port `4321`.

## Important files

- `src/components/world/world-types.ts` — domain and experience-state types.
- `src/components/world/world-map.ts` — fixed primitive modules, walk graph, zone nodes, reaction data.
- `src/components/world/world-validator.ts` — build-blocking geometry/connectivity validation.
- `src/components/world/pathfinding.ts` — deterministic A*.
- `src/components/world/world-state.ts` — playable experience/window reducer.
- `src/components/world/WorldExplorer.tsx` — DOM shell, orbit input, travel timing, history, focus, fallback.
- `src/components/world/WorldScene.tsx` — R3F sculpture, traveler, projection, reactions, dusk.
- `src/components/world/world-materials.tsx` — day/night palettes, `AnimatedLambert`, `useNightMix`, tower window colours.
- `src/components/world/tower-designs.ts` — static tower part layouts and merged window geometry.
- `src/components/world/tower-modules.tsx` — four zone landmark archetypes.
- `src/components/world/use-ambient-tick.ts` — shared 50ms demand tick for carousel spin and tower idle motion.
- `src/components/world/ArchiveWindow.tsx` — accessible zone/index/preview window.
- `src/components/world/world.css` — responsive labels, controls, desktop window, mobile sheet, motion.
- `src/pages/index.astro` — collection-to-zone data and homepage island.
- `tests/e2e/archive.spec.ts` — interaction, history, accessibility, fallback, and responsive checks.
- `tests/e2e/visual.spec.ts` — day/night, window, preview, fallback, and orbit visual regressions.
- `DESIGN.md`, `PRODUCT.md`, and `README.md` — design, product, and operating context.

## Content model

`work`, `notes`, and `archive` are local build-time collections. Archive entries use `kind: experiment | hobby`. Zone preview entries require `title`, `href`, `meta`, and `summary`, with optional `previewImage` and `previewAlt`.

Identity and publishing placeholders live in `src/config/site.ts`. Do not publish until the real name/brand decision, email, profile links, résumé details, canonical URL, and launch content are supplied.

## Geometry and performance constraints

- One-unit square grid, half-unit elevations, quarter-turn module transforms, 0.25-unit structural thickness.
- Run `validateWorld(WORLD_MAP)` whenever geometry or walk nodes change.
- Desktop scene budget: at most 100 draw calls and 150k triangles; mobile target: 75k triangles.
- DPR is capped at 1.5. Keep the canvas lazy and essential DOM immediate.
- Preserve the generated `public/world-poster.png` fallback and regenerate it after visible scene changes.

## Working-tree caution

The repository was initialized without a base commit; the current branch is `codex/living-archive` and the project files may all appear untracked. Treat every existing file as user work. Do not reset, clean, delete, or mass-reformat the workspace. Do not commit unless the user requests it.

## Current handoff status

Impossible-mechanisms tower redesign complete (2026-08-28). The four landmarks are now the Work Gearhouse, Field Notes Pagewell, Experiments Paradox Gate, and About Orrery Beacon. Verification from this pass:

- `npm test -- --run` — 69 passed
- `npm run check` — 0 errors, warnings, or hints
- `npm run build` — succeeded; WorldCanvas 242,735 gzip bytes of 307,200
- Playwright visual/dependency run at three workers — 63 passed, 10 skipped
- Impeccable detector — no findings
- `public/world-poster.png` regenerated; responsive, night, fallback, active-tower, and orbit baselines refreshed

Shipped in this pass:

- Four narrative silhouettes: short/dense Gearhouse, tall/hollow Pagewell, wide/porous Paradox Gate, and slender/celestial Orrery Beacon
- Reversible shared tower state: 1.05s arrival, 0.65s exit, replay on reselection, immediate reduced-motion final poses
- Held active forms: turned workshop and aligned stair, fanned folios, 0°/45°/90° portal with locked cube, aligned halo with inward beam
- Authored four-face window placements, merged static materials, instanced Pagewell folios and Paradox frames
- Archetype-specific scene-budget accounting replaces the old generic six-call-per-tower estimate; the authored scene stays under 100 draw calls and 75k triangles
- Dedicated desktop reduced-motion baselines for all four active landmark poses

The previous Monument Valley tower redesign completed on 2026-08-27 with this verification:

- `npm test -- --run` — 56 passed
- `npm run check` — 0 errors
- `npm run build` — succeeded (budget check included)
- `npx playwright test --workers=3` — 59 passed, 2 skipped
- `public/world-poster.png` regenerated; Playwright visual baselines refreshed

Shipped in this pass:

- Four distinct zone tower archetypes: work keep, notes archive spire, experiments gate, about armillary lighthouse
- Each tower keeps four-face warm window slits, coral crown, visit reaction, and slow ambient life on a shared 50ms `AmbientMotionDriver` tick
- Tower code split into `tower-designs.ts`, `tower-modules.tsx`, and `world-materials.tsx`; carousel no longer runs its own interval
- Reaction kinds renamed: `page-riffle`, `gate-slot`, `lantern-rings`
- Motion helpers unit-tested: `keepCrankTurn`, `pageRiffleYaw`, `gateBlockPose`, `lanternRingSpin`

Shipped in the night lamplight pass:

- Tower windows use their own warm pair (`TOWER_WINDOW`) instead of the sun/moon tones, so night reads as lit yellow lamplight
- Window slits are authored on all four tower faces, still one merged mesh and one draw call per tower
- Window brightness comes from the tested `towerWindowGlow` helper
- Carousel rim bulbs stay lit all night through `carouselLightOpacity`, and brighten further once hobbies is visited; daylight still keeps them dark until a visit
- Visiting hobbies revs the carousel to five times speed via `carouselSpinSpeed`, coasting back to the 0.25 rad/s idle over about four seconds; the burst is the only window where the ride forces full-rate frames
- Lit props that use raw basic materials share the `useNightMix` hook so colour and brightness crossfade with the 900ms dusk and snap under reduced motion

Note on `npm run test:e2e`: at the default six workers, `archive.spec.ts` "closing after visiting multiple islands" starves the 4s `data-selected-zone` assertion on the desktop and tablet viewports (six concurrent WebGL contexts delay the walk `setTimeout` chain). It passes consistently at three workers or fewer.

Shipped in the earlier polish pass:

- Close archive window returns traveler to spawn (walk or snap)
- Day sun / night moon framed in-frustum with crossfade; night lamps, stars, fireflies
- Hobbies planter clicks select the zone; traveler head stays readable at night
- Camera return uses 900ms ease-in-out; softer zoom lerp
- Distinct pine vs bush trees, living water + waterfall ledge, windy grass, ruin accents, work bridge-sweep

Remaining before publish (content, not interaction): real name/brand, email, profile links, résumé details, canonical URL, and launch content in `src/config/site.ts`.
