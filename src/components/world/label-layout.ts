export interface ProjectedLabel {
  id: string;
  x: number;
  y: number;
  depth: number;
  width: number;
  height: number;
}

export interface LabelViewport {
  width: number;
  height: number;
  padding: number;
  bottomOcclusion?: number;
}

interface LayoutBounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function bottomOcclusionHeight(viewport: LayoutBounds, occluder: LayoutBounds | null): number {
  if (!occluder) return 0;
  const coversWidth = occluder.left <= viewport.left + 1 && occluder.right >= viewport.right - 1;
  const reachesBottom = occluder.bottom >= viewport.bottom - 1;
  if (!coversWidth || !reachesBottom) return 0;
  const occlusionTop = Math.min(viewport.bottom, Math.max(viewport.top, occluder.top));
  return viewport.bottom - occlusionTop;
}

function intersects(first: ProjectedLabel, second: ProjectedLabel): boolean {
  return Math.abs(first.x - second.x) < (first.width + second.width) / 2 + 8
    && Math.abs(first.y - second.y) < (first.height + second.height) / 2 + 6;
}

export function resolveLabelLayout(labels: readonly ProjectedLabel[], viewport: LabelViewport): ProjectedLabel[] {
  const ordered = [...labels].sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));
  const placed: ProjectedLabel[] = [];
  const usableHeight = Math.max(0, viewport.height - Math.max(0, viewport.bottomOcclusion ?? 0));
  for (const source of ordered) {
    const minX = viewport.padding + source.width / 2;
    const maxX = viewport.width - viewport.padding - source.width / 2;
    const minY = viewport.padding + source.height;
    const maxY = usableHeight - viewport.padding - source.height / 2;
    const anchorY = Math.min(maxY, Math.max(minY, source.y));
    const label = {
      ...source,
      x: Math.min(maxX, Math.max(minX, source.x)),
      y: anchorY,
    };
    let attempt = 0;
    while (placed.some((candidate) => intersects(label, candidate)) && attempt < 8) {
      const ring = Math.floor(attempt / 2) + 1;
      const direction = attempt % 2 === 0 ? 1 : -1;
      label.x = Math.min(maxX, Math.max(minX, source.x + direction * ring * 10));
      label.y = anchorY;
      attempt += 1;
    }
    placed.push(label);
  }
  return placed;
}
