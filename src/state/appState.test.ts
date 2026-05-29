import { describe, expect, it } from 'vitest'
import {
  appReducer,
  createInitialAppState,
  getCurrentTimelineState,
  toStoredPreferences,
} from './appState'
import { DEFAULT_CHORD_PLAYBACK_SETTINGS } from '../components/chordPlayback'

describe('appReducer timeline history', () => {
  it('tracks chord and swatch changes with undo and redo', () => {
    let state = createInitialAppState({})
    state = appReducer(state, { type: 'setRoot', root: 'D' })
    state = appReducer(state, { type: 'toggleExtension', extensionId: '7' })
    state = appReducer(state, { type: 'addSwatch' })
    state = appReducer(state, { type: 'setRoot', root: 'E' })

    expect(getCurrentTimelineState(state).root).toBe('E')
    expect(getCurrentTimelineState(state).swatches).toHaveLength(1)

    state = appReducer(state, { type: 'undo' })
    expect(getCurrentTimelineState(state).root).toBe('D')

    state = appReducer(state, { type: 'undo' })
    expect(getCurrentTimelineState(state).swatches).toHaveLength(0)

    state = appReducer(state, { type: 'redo' })
    expect(getCurrentTimelineState(state).swatches).toHaveLength(1)
  })

  it('updates selected swatch while editing chord', () => {
    let state = createInitialAppState({})
    state = appReducer(state, { type: 'setRoot', root: 'G' })
    state = appReducer(state, { type: 'addSwatch' })
    state = appReducer(state, { type: 'setRoot', root: 'A' })

    const current = getCurrentTimelineState(state)
    expect(current.root).toBe('A')
    expect(current.swatches[0]?.root).toBe('A')
  })

  it('does not add undo steps when switching selected swatches', () => {
    let state = createInitialAppState({})
    state = appReducer(state, { type: 'setRoot', root: 'D' })
    state = appReducer(state, { type: 'addSwatch' })
    state = appReducer(state, { type: 'setRoot', root: 'E' })
    state = appReducer(state, { type: 'addSwatch' })

    const beforeSwitchCount = state.timeline.snapshots.length
    const beforeSwitchIndex = state.timeline.currentIndex

    state = appReducer(state, { type: 'selectSwatch', index: 0 })
    state = appReducer(state, { type: 'selectSwatch', index: 1 })

    expect(state.timeline.snapshots.length).toBe(beforeSwitchCount)
    expect(state.timeline.currentIndex).toBe(beforeSwitchIndex)

    state = appReducer(state, { type: 'undo' })
    expect(getCurrentTimelineState(state).swatches).toHaveLength(1)
  })

  it('pins chords without changing the active swatch and allows duplicates', () => {
    let state = createInitialAppState({})
    const chord = { root: 'C' as const, qualityId: 'maj', extensionIds: [] as string[] }
    const pinnedChord = { ...chord, playbackSettings: DEFAULT_CHORD_PLAYBACK_SETTINGS }

    state = appReducer(state, {
      type: 'pinChord',
      chord,
      playbackSettings: DEFAULT_CHORD_PLAYBACK_SETTINGS,
    })
    state = appReducer(state, {
      type: 'pinChord',
      chord,
      playbackSettings: DEFAULT_CHORD_PLAYBACK_SETTINGS,
    })

    expect(getCurrentTimelineState(state).swatches).toEqual([pinnedChord, pinnedChord])
    expect(getCurrentTimelineState(state).activeSwatchIndex).toBeNull()
  })

  it('snapshots playback settings when pinning chords', () => {
    let state = createInitialAppState({})
    const chord = { root: 'C' as const, qualityId: 'maj', extensionIds: [] as string[] }
    const playbackSettings = {
      positionPreference: 'open' as const,
      inversionPreference: 'first' as const,
      playbackMode: 'strum' as const,
    }

    state = appReducer(state, { type: 'pinChord', chord, playbackSettings })

    expect(getCurrentTimelineState(state).swatches[0]).toEqual({
      ...chord,
      playbackSettings,
    })
  })

  it('removes pinned chords with undo support', () => {
    let state = createInitialAppState({})
    const chord = { root: 'D' as const, qualityId: 'min', extensionIds: [] as string[] }
    const pinnedChord = { ...chord, playbackSettings: DEFAULT_CHORD_PLAYBACK_SETTINGS }

    state = appReducer(state, {
      type: 'pinChord',
      chord,
      playbackSettings: DEFAULT_CHORD_PLAYBACK_SETTINGS,
    })
    state = appReducer(state, { type: 'removeSwatch', index: 0 })
    expect(getCurrentTimelineState(state).swatches).toHaveLength(0)

    state = appReducer(state, { type: 'undo' })
    expect(getCurrentTimelineState(state).swatches).toEqual([pinnedChord])
  })

  it('keeps user preferences out of undo timeline', () => {
    let state = createInitialAppState({})
    state = appReducer(state, { type: 'setQuality', qualityId: 'min' })
    state = appReducer(state, { type: 'toggleMuted' })
    state = appReducer(state, { type: 'undo' })

    expect(getCurrentTimelineState(state).qualityId).toBe('maj')
    expect(state.preferences.muted).toBe(true)
  })

  it('initializes and stores the selected scale', () => {
    let state = createInitialAppState({ scaleRoot: 'D', scaleId: 'dorian' })

    expect(state.preferences.scaleRoot).toBe('D')
    expect(state.preferences.scaleId).toBe('dorian')

    state = appReducer(state, { type: 'setScaleRoot', scaleRoot: 'F#' })
    state = appReducer(state, { type: 'setScaleId', scaleId: 'lydian' })

    expect(toStoredPreferences(state)).toMatchObject({
      scaleRoot: 'F#',
      scaleId: 'lydian',
    })
  })

  it('keeps scale selection changes out of undo timeline', () => {
    let state = createInitialAppState({})
    state = appReducer(state, { type: 'setQuality', qualityId: 'min' })
    state = appReducer(state, { type: 'setScaleRoot', scaleRoot: 'A' })
    state = appReducer(state, { type: 'setScaleId', scaleId: 'minor-pentatonic' })
    state = appReducer(state, { type: 'undo' })

    expect(getCurrentTimelineState(state).qualityId).toBe('maj')
    expect(state.preferences.scaleRoot).toBe('A')
    expect(state.preferences.scaleId).toBe('minor-pentatonic')
  })
})
