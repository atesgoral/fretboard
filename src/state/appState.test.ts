import { describe, expect, it } from 'vitest'
import { appReducer, createInitialAppState, getCurrentTimelineState } from './appState'

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

  it('keeps user preferences out of undo timeline', () => {
    let state = createInitialAppState({})
    state = appReducer(state, { type: 'setQuality', qualityId: 'min' })
    state = appReducer(state, { type: 'toggleMuted' })
    state = appReducer(state, { type: 'undo' })

    expect(getCurrentTimelineState(state).qualityId).toBe('maj')
    expect(state.preferences.muted).toBe(true)
  })
})
