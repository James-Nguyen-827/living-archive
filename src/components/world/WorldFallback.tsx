interface Props {
  reason?: string;
}

export function WorldFallback({ reason }: Props) {
  return (
    <div className="world-fallback" data-testid="world-fallback">
      <img
        src="/world-poster.png"
        width="1200"
        height="648"
        alt="Orthographic low-poly archive with square platforms, bridges, towers, water, trees, and a small traveler."
      />
      {reason && <p className="world-fallback__reason">3D view unavailable: {reason}. The complete archive remains below.</p>}
    </div>
  );
}
