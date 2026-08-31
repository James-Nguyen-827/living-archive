# James Nguyen

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

- The public email, GitHub profile, and LinkedIn profile have committed defaults in `src/config/site.ts`; environment variables can still override them.
- Set `PUBLIC_SITE_URL` only when a real canonical domain exists. Local builds intentionally omit canonical, absolute social-image, sitemap, and structured URL metadata.
- Add professional case studies to `src/content/employment/`.
- Add dated writing to `src/content/writing/`.
- Add projects to `src/content/projects/`; the optional typed `caseStudy` block enables the reusable overview, evidence, diagram, and next-project treatment.
- Add interests to `src/content/interests/`. Entries marked `draft: true` are preserved locally but excluded from routes, indexes, the world archive, and production output.
- The schemas in `src/content.config.ts` fail the build when required metadata is missing or invalid.

Publishing remains blocked until a canonical domain is supplied.

Set `PUBLIC_SITE_URL`, then run `npm run validate:release` before deployment. Astro, canonical metadata, JSON-LD, RSS, and the sitemap all read the same public site URL. `PUBLIC_EMAIL`, `PUBLIC_GITHUB_URL`, and `PUBLIC_LINKEDIN_URL` remain optional overrides.

## World rules

The world is authored in `src/components/world/world-map.ts`. It uses fixed, grid-aligned primitives and one stable traversal graph; only the presentation group rotates. `validateWorld()` runs during the homepage build and its tests cover grid alignment, half-unit elevations, rotations, overlaps, bridge/stair endpoints, protected edges, and all-zone reachability. WASD and arrow locomotion are intentionally disabled: selecting an island starts deterministic A* travel, while Q/E and pointer drag orbit the habitat.
