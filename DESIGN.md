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

Conventional routes stay in fast, editorial Read mode. Each page intro and entry header carries one restrained, noninteractive section mark derived from its world landmark: court and gantry for Employment, stepped chambers for Writing, nested gate for Projects, carousel plan for Interests, orrery rings for About, and an isolated landing pad for utility routes. Project case studies use ruled overview rows, semantic evidence figures, code-native flow diagrams, and a single next-project handoff instead of a card grid.

## Motion

Pointer drag directly sets a continuous orbit target; Q/E and visible controls nudge by 22.5°. Immediate reactions use 140–180ms, entry morphs and closing use 420ms, camera reframing uses 900ms ease-in-out, window opening uses 620ms, and miniature dusk uses 900ms—all with ease-out-quint except camera return/approach which uses ease-in-out-cubic. Reduced motion makes travel, environmental reactions, reframing, and window changes immediate while preserving their final states.

## Component Rules

No identical card grids, gradient text, decorative glass, excessive rounding, repeated eyebrow labels, realistic surface textures, ornamental shadows, or accumulating generated geometry. Reactions must be deterministic, reversible, and composed from the authored primitive set.

## Vegetation

Five low-poly pines and eight compact shrubs soften the six platforms without occupying walk nodes or competing with landmarks. Pines use a short dirt-coloured trunk and two stacked five-sided olive cones; shrubs use a single faceted olive dodecahedron. All 13 plants are merged into one vertex-coloured draw call. Authored index controls their small scale and yaw differences, while wind and pointer response remain within 0.03 units and resolve to the exact static mesh under reduced motion. Dirt and foliage vertex colours follow the shared 900ms dusk mix.

## Zone landmarks

The four zone towers are narrative “impossible mechanisms”: a shared Monument Valley–inspired family whose silhouettes, negative space, and held active poses express their content. They use authored primitive assemblies inside a 1.8×1.8-unit envelope, merged by material or instanced when parts repeat. Warm window slits remain attached to all four compass faces and coral always identifies the moving focal piece.

| Landmark | Zone | Silhouette | Arrival and held pose | Neutral ambient life |
| --- | --- | --- | --- | --- |
| Project Court (`employment-tower`) | Employment | Two unequal L-shaped wings frame an open diagonal courtyard | Front terrace unfolds first; at 0.48s the rear terrace and coral gantry rise, travel, extend, and seat together across the court | Gantry hovers and wobbles in its rear cradle; held pose adds seated beam tension and terrace micro-settle |
| Index Engine (`writing-tower`) | Writing | Stepped base, offset spine, warm-lit core, exterior guide rail, four keyed chambers, and two crown halves | Chambers unlock upward while the coral cap stays seated, then drifts up slowly with a lazy summit spin as the crown opens | Coral carriage floats subtly at the neutral crown |
| Paradox Gate (`projects-tower`) | Projects | Wide twin-pier portal with dark nested frames | Frames resolve into a 0°/45°/90° aperture and hold the coral cube | Nested frames counter-spin; cube hovers and turns |
| Orrery Beacon (`about-tower`) | About | Slender offset beacon with a large segmented halo | Three rings align and hold a warm inward-facing beam | Rings counter-rotate slowly |

Tower arrivals run forward for 1.05 seconds and reverse for 0.65 seconds, except Project Court and the Index Engine, which use 1.4s arrivals and 0.8s exits for their longer ceremonies. Reselecting an active zone replays its performance; reduced motion snaps directly to the held pose. Ambient loops fade out as the active pose resolves, while the shared 50ms demand tick continues to serve neutral life. Layouts, window transforms, instancing groups, envelopes, and per-archetype budget estimates live in `tower-designs.ts`; pure reversible poses live in `world-motion.ts`; R3F assemblies live in `tower-modules.tsx`.
