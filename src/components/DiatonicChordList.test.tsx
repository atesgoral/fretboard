import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DiatonicChordList from './DiatonicChordList'
import { DEFAULT_CHORD_PLAYBACK_SETTINGS } from './chordPlayback'

describe('DiatonicChordList', () => {
  it('clears chord hover when the pointer leaves a chord card', () => {
    const onHoverChord = vi.fn()

    render(
      <DiatonicChordList
        scaleRoot="C"
        scaleId="major"
        onPlayChord={vi.fn()}
        onHoverChord={onHoverChord}
        onPreviewChordVoicing={vi.fn()}
        onPinChord={vi.fn()}
        auditionSettings={DEFAULT_CHORD_PLAYBACK_SETTINGS}
        onAuditionSettingsChange={vi.fn()}
      />,
    )

    const card = screen.getByTitle('I: Cmaj').parentElement
    expect(card).not.toBeNull()

    fireEvent.pointerEnter(card!)
    fireEvent.pointerLeave(card!)

    expect(onHoverChord).toHaveBeenNthCalledWith(1, {
      root: 'C',
      qualityId: 'maj',
      extensionIds: [],
    })
    expect(onHoverChord).toHaveBeenLastCalledWith(null)
  })
})
