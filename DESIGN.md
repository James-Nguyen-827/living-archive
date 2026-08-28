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
