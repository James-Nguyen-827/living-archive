import {
  Component,
  lazy,
  Suspense,
  type ErrorInfo,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { THEME_COLORS } from '../../config/theme';
import { ArchiveWindow } from './ArchiveWindow';
import { bottomOcclusionHeight, resolveLabelLayout, type ProjectedLabel } from './label-layout';
import { findPath } from './pathfinding';
import { readTheme, writeTheme } from './theme-storage';
import { WORLD_MAP, ZONE_NODES } from './world-map';
import type { ZoneData } from './world-content';
import { WorldFallback } from './WorldFallback';
import { createInitialWorldState, worldReducer } from './world-state';
import { angleFromDrag, nudgeAngle, travelerStepDuration } from './world-motion';
import type { WindowContent, ZoneId } from './world-types';
import './world.css';

const LazyWorldCanvas = lazy(() => import('./WorldCanvas').then((module) => ({ default: module.WorldCanvas })));

interface Props { zones: readonly ZoneData[] }
interface BoundaryProps { children: ReactNode; onError: () => void }

class CanvasBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function fallbackReason(): string | null {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return 'data saving is enabled';
  if (!('WebGL2RenderingContext' in window)) return 'WebGL2 is not supported';
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') ? null : 'WebGL2 could not initialize';
  } catch {
    return 'WebGL2 could not initialize';
  }
}

function zoneFromUrl(): ZoneId | null {
  const value = new URLSearchParams(window.location.search).get('zone');
  return value && Object.prototype.hasOwnProperty.call(ZONE_NODES, value) ? value as ZoneId : null;
}

const ORBIT_DRAG_THRESHOLD_PX = 6;

export function WorldExplorer({ zones }: Props) {
  const [state, dispatch] = useReducer(worldReducer, createInitialWorldState(WORLD_MAP.spawnNodeId));
  const [mounted, setMounted] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [reactionSequence, setReactionSequence] = useState(0);
  const worldRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<ZoneId, HTMLLIElement>());
  const lastProjectedLabels = useRef<readonly ProjectedLabel[]>([]);
  const initiatingControl = useRef<HTMLElement | null>(null);
  const historyDepth = useRef(0);
  const zoneHistoryOnArrival = useRef<'push' | 'replace' | false>(false);
  const journeyStepMs = useRef(140);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startAngle: number;
    active: boolean;
  } | null>(null);

  const staticMode = mounted && Boolean(fallback);

  const writeArchiveHistory = useCallback((content: WindowContent | null, replace = false) => {
    const url = new URL(window.location.href);
    const zone = content && content.kind !== 'index' ? content.zone : null;
    if (zone) url.searchParams.set('zone', zone);
    else url.searchParams.delete('zone');
    const depth = replace ? historyDepth.current : historyDepth.current + 1;
    historyDepth.current = depth;
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({ archive: content, archiveDepth: depth }, '', url);
  }, []);

  useEffect(() => {
    setMounted(true);
    setFallback(fallbackReason());
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener?.('change', updateMotion);
    dispatch({ type: 'theme-changed', theme: readTheme(window.localStorage) });
    const initialZone = zoneFromUrl();
    const storedContent = window.history.state?.archive as WindowContent | null | undefined;
    historyDepth.current = Number(window.history.state?.archiveDepth ?? 0);
    if (initialZone) {
      const content: WindowContent = storedContent?.kind === 'entry' && storedContent.zone === initialZone
        ? storedContent
        : { kind: 'zone', zone: initialZone };
      dispatch({ type: 'window-restored', content, nodeId: ZONE_NODES[initialZone] });
      window.history.replaceState({ archive: content, archiveDepth: historyDepth.current }, '', window.location.href);
    } else if (storedContent?.kind === 'index') {
      dispatch({ type: 'window-restored', content: storedContent });
    } else {
      window.history.replaceState({ archive: null, archiveDepth: historyDepth.current }, '', window.location.href);
    }
    const handlePopState = (event: PopStateEvent) => {
      historyDepth.current = Number(event.state?.archiveDepth ?? 0);
      const content = event.state?.archive as WindowContent | null | undefined;
      if (content) {
        const nodeId = content.kind === 'index' ? undefined : ZONE_NODES[content.zone];
        dispatch({ type: 'window-restored', content, nodeId });
        return;
      }
      const nextZone = zoneFromUrl();
      if (nextZone) dispatch({ type: 'zone-restored', zone: nextZone, nodeId: ZONE_NODES[nextZone] });
      else dispatch({ type: 'window-close-requested' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      media.removeEventListener?.('change', updateMotion);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[state.theme]);
  }, [state.theme]);

  useEffect(() => {
    if (!state.windowContent) return;
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeWindow();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [state.windowContent]);

  useEffect(() => {
    if (state.phase !== 'travelling' || state.path.length < 2) return;
    const timer = window.setTimeout(
      () => dispatch({ type: 'walk-step-completed' }),
      reducedMotion ? 0 : journeyStepMs.current,
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion, state.path, state.phase]);

  useEffect(() => {
    if (state.phase !== 'arriving') return;
    if (state.targetZone) setReactionSequence((value) => value + 1);
    const timer = window.setTimeout(() => dispatch({ type: 'arrival-completed' }), reducedMotion ? 0 : 140);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, state.phase, state.targetZone]);

  useEffect(() => {
    if (state.phase !== 'opening-window') return;
    if (state.selectedZone && zoneHistoryOnArrival.current) {
      writeArchiveHistory({ kind: 'zone', zone: state.selectedZone }, zoneHistoryOnArrival.current === 'replace');
      zoneHistoryOnArrival.current = false;
    }
    const timer = window.setTimeout(() => dispatch({ type: 'window-opened' }), reducedMotion ? 0 : 620);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, state.phase, state.selectedZone, writeArchiveHistory]);

  useEffect(() => {
    if (state.phase !== 'closing-window') return;
    const fromNodeId = state.characterNodeId;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'window-closed' });
      initiatingControl.current?.focus();
      beginReturnHome(fromNodeId);
    }, reducedMotion ? 0 : 420);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, state.phase, state.characterNodeId, staticMode]);

  const projectLabels = useCallback((projected: readonly ProjectedLabel[]) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    lastProjectedLabels.current = projected;
    const measured = projected.map((label) => {
      const element = labelRefs.current.get(label.id as ZoneId);
      if (!element) return label;
      const rect = element.getBoundingClientRect();
      return {
        ...label,
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      };
    });
    const viewportBounds = viewport.getBoundingClientRect();
    const archiveBounds = worldRef.current?.querySelector<HTMLElement>('.archive-window')?.getBoundingClientRect() ?? null;
    const laidOut = resolveLabelLayout(measured, {
      width: viewport.clientWidth,
      height: viewport.clientHeight,
      padding: 12,
      bottomOcclusion: bottomOcclusionHeight(viewportBounds, archiveBounds),
    });
    for (const label of laidOut) {
      const element = labelRefs.current.get(label.id as ZoneId);
      if (!element) continue;
      element.style.setProperty('--label-x', `${Math.round(label.x)}px`);
      element.style.setProperty('--label-y', `${Math.round(label.y)}px`);
      element.style.zIndex = String(20 + Math.round((1 - label.depth) * 10));
      element.dataset.projected = 'true';
    }
  }, []);

  useLayoutEffect(() => {
    if (lastProjectedLabels.current.length === 0) return;
    projectLabels(lastProjectedLabels.current);
  }, [projectLabels, state.windowContent]);

  function beginReturnHome(fromNodeId: string) {
    if (fromNodeId === WORLD_MAP.spawnNodeId) return;
    if (staticMode || reducedMotion) {
      dispatch({ type: 'return-home-requested', path: [WORLD_MAP.spawnNodeId] });
      return;
    }
    const path = findPath(WORLD_MAP.nodes, fromNodeId, WORLD_MAP.spawnNodeId);
    if (path.length === 0) {
      dispatch({ type: 'return-home-requested', path: [WORLD_MAP.spawnNodeId] });
      return;
    }
    journeyStepMs.current = travelerStepDuration(Math.max(1, path.length - 1));
    dispatch({ type: 'return-home-requested', path });
  }

  function requestZone(zoneId: ZoneId, source?: HTMLElement | null) {
    const sourceInsideWindow = Boolean(source?.closest('.archive-window'));
    initiatingControl.current = sourceInsideWindow
      ? labelRefs.current.get(zoneId)?.querySelector('a') ?? worldRef.current
      : source ?? (document.activeElement as HTMLElement | null);
    if (source && worldRef.current) {
      const origin = source.getBoundingClientRect();
      const bounds = worldRef.current.getBoundingClientRect();
      const panelWidth = Math.min(624, bounds.width * .42);
      worldRef.current.style.setProperty('--heading-origin-x', `${origin.left - (bounds.right - panelWidth + 36)}px`);
      worldRef.current.style.setProperty('--heading-origin-y', `${origin.top - (bounds.top + 112)}px`);
    }
    const immediate = staticMode || reducedMotion;
    const replaceHistory = sourceInsideWindow || historyDepth.current > 0;
    setReactionSequence((value) => value + 1);
    if (immediate) {
      dispatch({ type: 'zone-restored', zone: zoneId, nodeId: ZONE_NODES[zoneId] });
      writeArchiveHistory({ kind: 'zone', zone: zoneId }, replaceHistory);
      return;
    }
    const path = findPath(WORLD_MAP.nodes, state.characterNodeId, ZONE_NODES[zoneId]);
    if (path.length === 0) return;
    journeyStepMs.current = travelerStepDuration(Math.max(1, path.length - 1));
    zoneHistoryOnArrival.current = replaceHistory ? 'replace' : 'push';
    dispatch({ type: 'travel-requested', zone: zoneId, path });
  }

  function closeWindow() {
    writeArchiveHistory(null, true);
    historyDepth.current = 0;
    dispatch({ type: 'window-close-requested' });
  }

  function openEntry(href: string) {
    if (!state.selectedZone) return;
    const content: WindowContent = { kind: 'entry', zone: state.selectedZone, href };
    dispatch({ type: 'entry-requested', href });
    writeArchiveHistory(content);
  }

  function backToZone() {
    if (historyDepth.current > 0) window.history.back();
    else dispatch({ type: 'zone-returned' });
  }

  function rotate(direction: -1 | 1) {
    setRotationAngle((angle) => nudgeAngle(angle, direction));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'q' || event.key === 'Q') { event.preventDefault(); rotate(-1); }
    if (event.key === 'e' || event.key === 'E') { event.preventDefault(); rotate(1); }
  }

  function isInteractiveTarget(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest('a, button, .archive-window'));
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (isInteractiveTarget(event.target)) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startAngle: rotationAngle,
      active: false,
    };
    worldRef.current?.focus();
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.current.startX;
    const dy = event.clientY - drag.current.startY;
    if (!drag.current.active) {
      if (Math.hypot(dx, dy) < ORBIT_DRAG_THRESHOLD_PX) return;
      drag.current.active = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    setRotationAngle(angleFromDrag(drag.current.startAngle, drag.current.startX, event.clientX));
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (drag.current?.pointerId === event.pointerId) {
      if (drag.current.active && event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      drag.current = null;
    }
  }

  function handleLostPointerCapture(event: PointerEvent<HTMLElement>) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  function toggleTheme() {
    const theme = state.theme === 'day' ? 'night' : 'day';
    writeTheme(theme, window.localStorage);
    dispatch({ type: 'theme-changed', theme });
  }

  return (
    <div
      ref={worldRef}
      className="world-explorer"
      role="region"
      data-theme={state.theme}
      data-phase={state.phase}
      data-angle={rotationAngle}
      data-node={state.characterNodeId}
      data-selected-zone={state.selectedZone ?? ''}
      data-fallback={!mounted || Boolean(fallback) || !canvasReady}
      tabIndex={0}
      aria-label="Interactive portfolio world for James Nguyen"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handleLostPointerCapture}
    >
      <div ref={viewportRef} className="world-viewport">
        {mounted && !fallback ? (
          <CanvasBoundary onError={() => setFallback('the renderer stopped unexpectedly')}>
            <Suspense fallback={<WorldFallback />}>
              <LazyWorldCanvas
                rotationAngle={rotationAngle}
                theme={state.theme}
                phase={state.phase}
                characterNodeId={state.characterNodeId}
                path={state.path}
                targetZone={state.targetZone}
                selectedZone={state.selectedZone}
                reactionSequence={reactionSequence}
                reducedMotion={reducedMotion}
                onZoneRequest={(zone) => requestZone(
                  zone,
                  labelRefs.current.get(zone)?.querySelector('a') ?? worldRef.current,
                )}
                onLabelsProject={projectLabels}
                onReady={() => setCanvasReady(true)}
              />
            </Suspense>
          </CanvasBoundary>
        ) : (
          <WorldFallback reason={mounted ? fallback ?? undefined : undefined} />
        )}

        <ol className="world-zone-labels" aria-label="World zones">
          {zones.map((item) => (
            <li
              key={item.id}
              data-zone={item.id}
              ref={(element) => { if (element) labelRefs.current.set(item.id, element); else labelRefs.current.delete(item.id); }}
            >
              <a
                href={item.href}
                aria-current={state.selectedZone === item.id ? 'true' : undefined}
                aria-controls="archive-window"
                aria-expanded={state.selectedZone === item.id}
                onClick={(event) => { event.preventDefault(); requestZone(item.id, event.currentTarget); }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>

        <div className="world-controls" aria-label="World controls">
          <button type="button" onClick={() => rotate(-1)} aria-label="Rotate world left 22.5 degrees">←</button>
          <button type="button" onClick={() => rotate(1)} aria-label="Rotate world right 22.5 degrees">→</button>
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${state.theme === 'day' ? 'night' : 'day'} theme`}>
            {state.theme === 'day' ? 'Night' : 'Day'}
          </button>
        </div>
      </div>

      <p className="world-help">
        <span className="world-help__desktop">Drag to orbit · choose a place; the traveler opens its archive</span>
        <span className="world-help__mobile">Tap a place; the traveler opens its archive · drag to orbit</span>
      </p>
      <p className="sr-only" aria-live="polite">{state.announcement}</p>

      {state.windowContent && (
        <ArchiveWindow
          content={state.windowContent}
          phase={state.phase}
          zones={zones}
          onClose={closeWindow}
          onSelectZone={requestZone}
          onSelectEntry={openEntry}
          onBackToZone={backToZone}
        />
      )}
    </div>
  );
}
