# Design System

## Visual Theme

A low-poly, orthographic eco-brutalist habitat rendered from clean geometric primitives. Flat planes, faceted vegetation, cyan water, and coral interaction marks replace realistic concrete texture. The habitat is one stable sculpture that can be freely orbited at any angle. Day is the default; a manually selected miniature-dusk state is remembered locally.

## Color

- Background: `oklch(1 0 0)`
- Surface: `oklch(0.94 0.012 110)`
- Structure: `oklch(0.88 0.04 110)`
- Ink: `oklch(0.21 0.025 110)`
- Muted ink: `oklch(0.46 0.025 110)`
- Deep olive: `oklch(0.36 0.085 110)`
- Coral signal: `oklch(0.56 0.20 35)`
- Cyan water: `oklch(0.72 0.11 195)`

## Typography

Barlow Condensed 600 for display and navigation. Atkinson Hyperlegible Next 400, 500, and 700 for body and interface copy. Display tracking never tighter than `-0.03em`; prose width stays between 65 and 75 characters.

## Layout

Fluid page gutters use `clamp(1rem, 3vw, 3.5rem)`. The world is the desktop focal point; projected labels, navigation, and architectural windows remain accessible DOM outside the canvas. Desktop windows clip in from the right while leaving the world visible. Mobile uses a bottom sheet that preserves the selected island above it.

## Motion

Pointer drag directly sets a continuous orbit target; Q/E and visible controls nudge by 22.5°. Immediate reactions use 140–180ms, entry morphs and closing use 420ms, camera reframing uses 900ms ease-in-out, window opening uses 620ms, and miniature dusk uses 900ms—all with ease-out-quint except camera return/approach which uses ease-in-out-cubic. Reduced motion makes travel, environmental reactions, reframing, and window changes immediate while preserving their final states.

## Component Rules

No identical card grids, gradient text, decorative glass, excessive rounding, repeated eyebrow labels, realistic surface textures, ornamental shadows, or accumulating generated geometry. Reactions must be deterministic, reversible, and composed from the authored primitive set.

## Zone landmarks

The four zone towers are narrative “impossible mechanisms”: a shared Monument Valley–inspired family whose silhouettes, negative space, and held active poses express their content. They use authored primitive assemblies inside a 1.8×1.8-unit envelope, merged by material or instanced when parts repeat. Warm window slits remain attached to all four compass faces and coral always identifies the moving focal piece.

| Landmark | Zone | Silhouette | Arrival and held pose | Neutral ambient life |
| --- | --- | --- | --- | --- |
| Gearhouse (`work-tower`) | Work | Short, dense workshop with a cantilever room and stair | Room turns 90°, stair aligns, coral piston rises | Combined counterweight and pennant sway |
| Pagewell (`notes-tower`) | Field Notes | Tall hollow spine with five L-shaped folios | Folios fan upward into a spiral and the bookmark tips | Upper folios breathe |
| Paradox Gate (`experiments-tower`) | Experiments | Wide twin-pier portal with dark nested frames | Frames resolve into a 0°/45°/90° aperture and hold the coral cube | Nested frames counter-spin; cube hovers and turns |
| Orrery Beacon (`about-tower`) | About | Slender offset beacon with a large segmented halo | Three rings align and hold a warm inward-facing beam | Rings counter-rotate slowly |

Tower arrivals run forward for 1.05 seconds and reverse for 0.65 seconds. Reselecting an active zone replays its performance; reduced motion snaps directly to the held pose. Ambient loops fade out as the active pose resolves, while the shared 50ms demand tick continues to serve neutral life. Layouts, window transforms, instancing groups, envelopes, and per-archetype budget estimates live in `tower-designs.ts`; pure reversible poses live in `world-motion.ts`; R3F assemblies live in `tower-modules.tsx`.
