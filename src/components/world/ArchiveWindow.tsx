import { useEffect, useMemo, useRef } from 'react';
import type { ZoneData } from './world-content';
import type { ExperiencePhase, WindowContent, ZoneId } from './world-types';

interface Props {
  content: WindowContent;
  phase: ExperiencePhase;
  zones: readonly ZoneData[];
  onClose: () => void;
  onSelectZone: (zone: ZoneId, source?: HTMLElement | null) => void;
  onSelectEntry: (href: string) => void;
  onBackToZone: () => void;
}

export function ArchiveWindow({ content, phase, zones, onClose, onSelectZone, onSelectEntry, onBackToZone }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const zone = content.kind === 'zone' || content.kind === 'entry'
    ? zones.find((item) => item.id === content.zone) ?? null
    : null;
  const entry = useMemo(() => content.kind === 'entry'
    ? zone?.entries.find((item) => item.href === content.href) ?? null
    : null, [content, zone]);

  useEffect(() => {
    if (phase !== 'closing-window') {
      const frame = requestAnimationFrame(() => panelRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [content, phase]);

  return (
    <aside
      ref={panelRef}
      id="archive-window"
      className="archive-window"
      data-phase={phase}
      data-content={content.kind}
      tabIndex={-1}
      aria-labelledby="archive-window-title"
    >
      <div className="archive-window__head">
        <button type="button" onClick={onClose} aria-label="Close archive window">Close</button>
      </div>

      <div className="archive-window__content" key={content.kind === 'entry' ? content.href : `${content.kind}-${zone?.id ?? 'all'}`}>
        {content.kind === 'index' && (
          <>
            <h2 id="archive-window-title">Index</h2>
            <ol className="archive-window__zones">
              {zones.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={(event) => onSelectZone(item.id, event.currentTarget)}>
                    <strong>{item.label}</strong>
                    <small>{item.summary}</small>
                  </button>
                </li>
              ))}
            </ol>
            <a className="archive-window__primary" href="/index">All routes</a>
          </>
        )}

        {content.kind === 'zone' && zone && (
          <>
            <h2 id="archive-window-title">{zone.label}</h2>
            <p className="archive-window__summary">{zone.summary}</p>
            {zone.entries.length > 0 && (
              <ol className="archive-window__entries">
                {zone.entries.map((item) => (
                  <li key={item.href}>
                    <button type="button" onClick={() => onSelectEntry(item.href)}>
                      <strong>{item.title}</strong>
                      <small>{item.meta}</small>
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {zone.entries.length === 0 && zone.emptyMessage && <p className="archive-window__empty">{zone.emptyMessage}</p>}
            <a className="archive-window__primary" href={zone.href}>{zone.label}</a>
          </>
        )}

        {content.kind === 'entry' && zone && entry && (
          <>
            <button type="button" className="archive-window__back" onClick={onBackToZone}>Back</button>
            <h2 id="archive-window-title">{entry.title}</h2>
            <p className="archive-window__meta">{entry.meta}</p>
            {entry.previewImage && (
              <figure className="archive-window__media">
                <img src={entry.previewImage} alt={entry.previewAlt ?? ''} />
              </figure>
            )}
            <p>{entry.summary}</p>
            <a className="archive-window__primary" href={entry.href}>Open</a>
          </>
        )}
      </div>
    </aside>
  );
}
