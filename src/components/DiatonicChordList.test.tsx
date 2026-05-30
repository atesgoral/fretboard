import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHORD_PLAYBACK_SETTINGS } from './chordPlayback'
import type { ChordSelection } from './chordSearch'
import DiatonicChordList from './DiatonicChordList'

function renderDiatonicChordList({
  onHoverChord = vi.fn(),
  showChordNotes = true,
}: {
  onHoverChord?: (chord: ChordSelection | null) => void
  showChordNotes?: boolean
} = {}) {
  const onToggleChordNotes = vi.fn()

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
      showChordNotes={showChordNotes}
      onToggleChordNotes={onToggleChordNotes}
    />,
  )

  return { onHoverChord, onToggleChordNotes }
}

describe('DiatonicChordList', () => {
  it('calls the chord note toggle handler from the eye button', () => {
    const { onToggleChordNotes } = renderDiatonicChordList()

    fireEvent.click(screen.getByRole('button', { name: 'Hide chord notes' }))

    expect(onToggleChordNotes).toHaveBeenCalledTimes(1)
  })

  it('labels the eye button for showing hidden chord notes', () => {
    renderDiatonicChordList({ showChordNotes: false })

    expect(screen.getByRole('button', { name: 'Show chord notes' })).toBeInTheDocument()
  })

  it('positions the eye button left of the gear and collapse controls', () => {
    renderDiatonicChordList()

    expect(screen.getByRole('button', { name: 'Hide chord notes' })).toHaveClass(
      'right-[4.5rem]',
      'top-2',
    )
  })

  it('keeps the chord note toggle available when collapsed', () => {
    const { onToggleChordNotes } = renderDiatonicChordList()

    fireEvent.click(screen.getByRole('button', { name: 'Collapse chords panel' }))
    expect(screen.queryByTitle('I: Cmaj')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hide chord notes' }))
    expect(onToggleChordNotes).toHaveBeenCalledTimes(1)
  })

  it('clears chord hover when the pointer leaves a chord card', () => {
    const onHoverChord = vi.fn()

    renderDiatonicChordList({ onHoverChord })

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
