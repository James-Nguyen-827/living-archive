# Living Archive

An Astro portfolio with an optional React Three Fiber world. Visitors can freely orbit one connected low-poly habitat, select an island, and watch a geometric traveler find its route. The complete archive remains available through conventional static routes before the world loads.

## Local development

```sh
npm install
npm run dev
```

The Codex-hosted Astro CLI starts a managed background server. Use `npx astro dev stop` when finished.

## Verification

```sh
npm test
npm run check
npm run build
npm run test:e2e
```

Visual regression baselines live beside `tests/e2e/visual.spec.ts`. Regenerate them intentionally with:

```sh
npx playwright test tests/e2e/visual.spec.ts --update-snapshots
```

Start the local server, then capture the real WebGL scene used by the no-WebGL/data-saving fallback:

```sh
npm run capture:poster
```

## Content and identity

- Edit identity, email, canonical URL, and profile links in `src/config/site.ts`.
- Add professional case studies to `src/content/work/`.
- Add dated writing to `src/content/notes/`.
- Add hobbies and experiments to `src/content/archive/` with the appropriate `kind`.
- The schemas in `src/content.config.ts` fail the build when required metadata is missing or invalid.

Publishing should wait until the placeholder email, profile URLs, résumé details, canonical domain, and launch content are replaced.

Set `PUBLIC_SITE_URL`, `PUBLIC_EMAIL`, `PUBLIC_GITHUB_URL`, and `PUBLIC_LINKEDIN_URL`, then run `npm run validate:release` before deployment. Astro, canonical metadata, JSON-LD, RSS, and the sitemap all read the same public site URL.

## World rules

The world is authored in `src/components/world/world-map.ts`. It uses fixed, grid-aligned primitives and one stable traversal graph; only the presentation group rotates. `validateWorld()` runs during the homepage build and its tests cover grid alignment, half-unit elevations, rotations, overlaps, bridge/stair endpoints, protected edges, and all-zone reachability. WASD and arrow locomotion are intentionally disabled: selecting an island starts deterministic A* travel, while Q/E and pointer drag orbit the habitat.
