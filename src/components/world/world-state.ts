import type { WindowContent, WorldState, ZoneId } from './world-types';

export type WorldAction =
  | { type: 'travel-requested'; zone: ZoneId; path: readonly string[] }
  | { type: 'return-home-requested'; path: readonly string[] }
  | { type: 'walk-step-completed' }
  | { type: 'arrival-completed' }
  | { type: 'window-opened' }
  | { type: 'index-requested' }
  | { type: 'entry-requested'; href: string }
  | { type: 'zone-returned' }
  | { type: 'window-close-requested' }
  | { type: 'window-closed' }
  | { type: 'zone-restored'; zone: ZoneId; nodeId: string }
  | { type: 'window-restored'; content: WindowContent; nodeId?: string }
  | { type: 'theme-changed'; theme: WorldState['theme'] };

const ZONE_LABELS: Record<ZoneId, string> = {
  work: 'Work',
  'field-notes': 'Field Notes',
  experiments: 'Experiments',
  hobbies: 'Hobbies',
  about: 'About',
};

export function createInitialWorldState(spawnNodeId: string): WorldState {
  return {
    theme: 'day',
    phase: 'explore',
    characterNodeId: spawnNodeId,
    path: [],
    targetZone: null,
    selectedZone: null,
    windowContent: null,
    announcement: 'Interactive world ready.',
  };
}

export function worldReducer(state: WorldState, action: WorldAction): WorldState {
  switch (action.type) {
    case 'travel-requested':
      if (action.path.length === 0) return state;
      return {
        ...state,
        phase: action.path.length === 1 ? 'arriving' : 'travelling',
        path: action.path,
        targetZone: action.zone,
        selectedZone: null,
        windowContent: null,
        announcement: `Traveler moving toward ${ZONE_LABELS[action.zone]}.`,
      };
    case 'return-home-requested': {
      if (action.path.length === 0) return state;
      const atHome = action.path.length === 1;
      return {
        ...state,
        phase: atHome ? 'explore' : 'travelling',
        characterNodeId: atHome ? action.path[0] : state.characterNodeId,
        path: atHome ? [] : action.path,
        targetZone: null,
        selectedZone: null,
        windowContent: null,
        announcement: atHome ? 'Returned to the central ground.' : 'Traveler returning home.',
      };
    }
    case 'walk-step-completed': {
      if (state.phase !== 'travelling' || state.path.length < 2) return state;
      const characterNodeId = state.path[1];
      const path = state.path.slice(1);
      const arrived = path.length === 1;
      return {
        ...state,
        characterNodeId,
        path: arrived ? [] : path,
        phase: arrived ? 'arriving' : 'travelling',
        announcement: arrived
          ? (state.targetZone ? 'Traveler reached the destination.' : 'Traveler reached the central ground.')
          : state.announcement,
      };
    }
    case 'arrival-completed':
      if (!state.targetZone) {
        return {
          ...state,
          phase: 'explore',
          path: [],
          targetZone: null,
          selectedZone: null,
          windowContent: null,
          announcement: 'Returned to the central ground.',
        };
      }
      return {
        ...state,
        phase: 'opening-window',
        path: [],
        selectedZone: state.targetZone,
        targetZone: null,
        windowContent: { kind: 'zone', zone: state.targetZone },
        announcement: `Arrived at ${ZONE_LABELS[state.targetZone]}.`,
      };
    case 'window-opened':
      return state.phase === 'opening-window' ? { ...state, phase: 'zone-open' } : state;
    case 'index-requested':
      return {
        ...state,
        phase: 'opening-window',
        path: [],
        targetZone: null,
        selectedZone: null,
        windowContent: { kind: 'index' },
        announcement: 'Index opening.',
      };
    case 'entry-requested':
      if (!state.selectedZone) return state;
      return {
        ...state,
        phase: 'entry-preview',
        windowContent: { kind: 'entry', zone: state.selectedZone, href: action.href },
        announcement: 'Entry preview open.',
      };
    case 'zone-returned':
      if (!state.selectedZone) return state;
      return {
        ...state,
        phase: 'zone-open',
        windowContent: { kind: 'zone', zone: state.selectedZone },
        announcement: `${ZONE_LABELS[state.selectedZone]} index open.`,
      };
    case 'window-close-requested':
      return state.windowContent ? { ...state, phase: 'closing-window', announcement: 'Window closing.' } : state;
    case 'window-closed':
      return {
        ...state,
        phase: 'explore',
        path: [],
        targetZone: null,
        selectedZone: null,
        windowContent: null,
        announcement: 'Returned to the world.',
      };
    case 'zone-restored':
      return {
        ...state,
        phase: 'zone-open',
        characterNodeId: action.nodeId,
        path: [],
        targetZone: null,
        selectedZone: action.zone,
        windowContent: { kind: 'zone', zone: action.zone },
        announcement: `${ZONE_LABELS[action.zone]} open.`,
      };
    case 'window-restored': {
      const zone = action.content.kind === 'zone' || action.content.kind === 'entry' ? action.content.zone : null;
      return {
        ...state,
        phase: action.content.kind === 'entry' ? 'entry-preview' : 'zone-open',
        characterNodeId: action.nodeId ?? state.characterNodeId,
        path: [],
        targetZone: null,
        selectedZone: zone,
        windowContent: action.content,
        announcement: action.content.kind === 'index'
          ? 'Index open.'
          : `${ZONE_LABELS[zone!]} ${action.content.kind === 'entry' ? 'preview' : 'index'} open.`,
      };
    }
    case 'theme-changed':
      return {
        ...state,
        theme: action.theme,
        announcement: `${action.theme === 'day' ? 'Day' : 'Night'} environment active.`,
      };
  }
}
