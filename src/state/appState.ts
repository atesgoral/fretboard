import type { NoteName } from '../components/chords'

export const APP_PREFERENCES_STORAGE_KEY = 'fretboard-app-preferences'

export type ChordSelection = { root: NoteName; qualityId: string; extensionIds: string[] }

export type TimelineState = {
  root: NoteName
  qualityId: string
  extensionIds: string[]
  swatches: ChordSelection[]
  activeSwatchIndex: number | null
}

export type UserPreferences = {
  linear: boolean
  lowEAtBottom: boolean
  naturalDecay: boolean
  reverbEnabled: boolean
  muted: boolean
}

type TimelineHistory = {
  snapshots: TimelineState[]
  currentIndex: number
}

export type AppState = {
  preferences: UserPreferences
  timeline: TimelineHistory
}

export type StoredPreferences = Partial<UserPreferences> & Partial<TimelineState>

const DEFAULT_TIMELINE_STATE: TimelineState = {
  root: 'C',
  qualityId: 'maj',
  extensionIds: [],
  swatches: [],
  activeSwatchIndex: null,
}

const DEFAULT_PREFERENCES: UserPreferences = {
  linear: true,
  lowEAtBottom: true,
  naturalDecay: true,
  reverbEnabled: true,
  muted: false,
}

function cloneChordSelection(chord: ChordSelection): ChordSelection {
  return { ...chord, extensionIds: [...chord.extensionIds] }
}

function cloneTimelineState(state: TimelineState): TimelineState {
  return {
    ...state,
    extensionIds: [...state.extensionIds],
    swatches: state.swatches.map(cloneChordSelection),
  }
}

function getInitialTimelineState(stored: StoredPreferences): TimelineState {
  return {
    root: stored.root ?? DEFAULT_TIMELINE_STATE.root,
    qualityId: stored.qualityId ?? DEFAULT_TIMELINE_STATE.qualityId,
    extensionIds: stored.extensionIds ?? DEFAULT_TIMELINE_STATE.extensionIds,
    swatches: stored.swatches ?? DEFAULT_TIMELINE_STATE.swatches,
    activeSwatchIndex: stored.activeSwatchIndex ?? DEFAULT_TIMELINE_STATE.activeSwatchIndex,
  }
}

export function getInitialPreferences(): StoredPreferences {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as StoredPreferences
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function createInitialAppState(stored: StoredPreferences): AppState {
  return {
    preferences: {
      linear: stored.linear ?? DEFAULT_PREFERENCES.linear,
      lowEAtBottom: stored.lowEAtBottom ?? DEFAULT_PREFERENCES.lowEAtBottom,
      naturalDecay: stored.naturalDecay ?? DEFAULT_PREFERENCES.naturalDecay,
      reverbEnabled: stored.reverbEnabled ?? DEFAULT_PREFERENCES.reverbEnabled,
      muted: stored.muted ?? DEFAULT_PREFERENCES.muted,
    },
    timeline: {
      snapshots: [cloneTimelineState(getInitialTimelineState(stored))],
      currentIndex: 0,
    },
  }
}

function updateActiveSwatch(state: TimelineState, update: Partial<ChordSelection>): TimelineState {
  if (state.activeSwatchIndex === null) return state
  return {
    ...state,
    swatches: state.swatches.map((swatch, index) =>
      index === state.activeSwatchIndex ? { ...swatch, ...update } : swatch,
    ),
  }
}

function commitTimeline(previous: TimelineHistory, nextState: TimelineState): TimelineHistory {
  const committed = cloneTimelineState(nextState)
  const snapshots = previous.snapshots.slice(0, previous.currentIndex + 1)
  snapshots.push(committed)
  return { snapshots, currentIndex: snapshots.length - 1 }
}

function currentTimelineState(timeline: TimelineHistory): TimelineState {
  return timeline.snapshots[timeline.currentIndex]
}

function replaceCurrentTimelineSnapshot(
  previous: TimelineHistory,
  nextState: TimelineState,
): TimelineHistory {
  const snapshots = [...previous.snapshots]
  snapshots[previous.currentIndex] = cloneTimelineState(nextState)
  return { snapshots, currentIndex: previous.currentIndex }
}

export type AppAction =
  | { type: 'toggleLinear' }
  | { type: 'toggleLowEAtBottom' }
  | { type: 'toggleNaturalDecay' }
  | { type: 'toggleReverb' }
  | { type: 'toggleMuted' }
  | { type: 'setRoot'; root: NoteName }
  | { type: 'setQuality'; qualityId: string }
  | { type: 'setExtensions'; extensionIds: string[] }
  | { type: 'toggleExtension'; extensionId: string }
  | { type: 'addSwatch' }
  | { type: 'addSwatchChord'; chord: ChordSelection }
  | { type: 'selectCurrentChord' }
  | { type: 'selectSwatch'; index: number }
  | { type: 'removeSwatch'; index: number }
  | { type: 'undo' }
  | { type: 'redo' }

export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'undo') {
    if (state.timeline.currentIndex === 0) return state
    return {
      ...state,
      timeline: { ...state.timeline, currentIndex: state.timeline.currentIndex - 1 },
    }
  }
  if (action.type === 'redo') {
    if (state.timeline.currentIndex >= state.timeline.snapshots.length - 1) return state
    return {
      ...state,
      timeline: { ...state.timeline, currentIndex: state.timeline.currentIndex + 1 },
    }
  }

  if (
    action.type === 'toggleLinear' ||
    action.type === 'toggleLowEAtBottom' ||
    action.type === 'toggleNaturalDecay' ||
    action.type === 'toggleReverb' ||
    action.type === 'toggleMuted'
  ) {
    const keyMap = {
      toggleLinear: 'linear',
      toggleLowEAtBottom: 'lowEAtBottom',
      toggleNaturalDecay: 'naturalDecay',
      toggleReverb: 'reverbEnabled',
      toggleMuted: 'muted',
    } as const
    const key = keyMap[action.type]
    return { ...state, preferences: { ...state.preferences, [key]: !state.preferences[key] } }
  }

  const current = currentTimelineState(state.timeline)
  if (action.type === 'selectSwatch') {
    const swatch = current.swatches[action.index]
    if (!swatch) return state
    return {
      ...state,
      timeline: replaceCurrentTimelineSnapshot(state.timeline, {
        ...current,
        root: swatch.root,
        qualityId: swatch.qualityId,
        extensionIds: [...swatch.extensionIds],
        activeSwatchIndex: action.index,
      }),
    }
  }

  let next: TimelineState = current
  if (action.type === 'setRoot') {
    next = updateActiveSwatch({ ...current, root: action.root }, { root: action.root })
  } else if (action.type === 'setQuality') {
    next = updateActiveSwatch(
      { ...current, qualityId: action.qualityId },
      { qualityId: action.qualityId },
    )
  } else if (action.type === 'setExtensions') {
    next = updateActiveSwatch(
      { ...current, extensionIds: action.extensionIds },
      { extensionIds: action.extensionIds },
    )
  } else if (action.type === 'toggleExtension') {
    const extensionIds = current.extensionIds.includes(action.extensionId)
      ? current.extensionIds.filter((id) => id !== action.extensionId)
      : [...current.extensionIds, action.extensionId]
    next = updateActiveSwatch({ ...current, extensionIds }, { extensionIds })
  } else if (action.type === 'addSwatch') {
    const selected = {
      root: current.root,
      qualityId: current.qualityId,
      extensionIds: [...current.extensionIds],
    }
    next = {
      ...current,
      swatches: [...current.swatches, selected],
      activeSwatchIndex: current.swatches.length,
    }
  } else if (action.type === 'addSwatchChord') {
    const selected = {
      root: action.chord.root,
      qualityId: action.chord.qualityId,
      extensionIds: [...action.chord.extensionIds],
    }
    next = {
      ...current,
      swatches: [...current.swatches, selected],
      activeSwatchIndex: current.swatches.length,
    }
  } else if (action.type === 'selectCurrentChord') {
    return {
      ...state,
      timeline: replaceCurrentTimelineSnapshot(state.timeline, {
        ...current,
        activeSwatchIndex: null,
      }),
    }
  } else if (action.type === 'removeSwatch') {
    const swatches = current.swatches.filter((_, idx) => idx !== action.index)
    let activeSwatchIndex = current.activeSwatchIndex
    if (activeSwatchIndex !== null) {
      if (activeSwatchIndex === action.index) activeSwatchIndex = null
      else if (activeSwatchIndex > action.index) activeSwatchIndex -= 1
    }
    next = { ...current, swatches, activeSwatchIndex }
  }

  if (next === current) return state
  return { ...state, timeline: commitTimeline(state.timeline, next) }
}

export function getCurrentTimelineState(state: AppState): TimelineState {
  return currentTimelineState(state.timeline)
}

export function toStoredPreferences(state: AppState): StoredPreferences {
  const current = getCurrentTimelineState(state)
  return { ...state.preferences, ...current }
}
