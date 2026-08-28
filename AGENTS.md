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

Tower window lamplight pass complete (2026-08-27). Verification:

- `npm test -- --run` — 50 passed
- `npm run check` — 0 errors
- `npm run build` — succeeded (budget check included)
- `npx playwright test --workers=3` — 59 passed, 2 skipped
- `public/world-poster.png` regenerated; all Playwright visual baselines refreshed

Shipped in this pass:

- Tower windows use their own warm pair (`TOWER_WINDOW`) instead of the sun/moon tones, so night reads as lit yellow lamplight
- Window slits are authored on all four tower faces, still one merged mesh and one draw call per tower
- Window brightness comes from the tested `towerWindowGlow` helper; colour and brightness crossfade with the 900ms dusk and snap under reduced motion

Note on `npm run test:e2e`: at the default six workers, `archive.spec.ts` "closing after visiting multiple islands" starves the 4s `data-selected-zone` assertion on the desktop and tablet viewports (six concurrent WebGL contexts delay the walk `setTimeout` chain). It passes consistently at three workers or fewer.

Shipped in the earlier polish pass:

- Close archive window returns traveler to spawn (walk or snap)
- Day sun / night moon framed in-frustum with crossfade; night lamps, stars, fireflies
- Hobbies planter clicks select the zone; traveler head stays readable at night
- Camera return uses 900ms ease-in-out; softer zoom lerp
- Distinct pine vs bush trees, living water + waterfall ledge, windy grass, ruin accents, work bridge-sweep

Remaining before publish (content, not interaction): real name/brand, email, profile links, résumé details, canonical URL, and launch content in `src/config/site.ts`.
