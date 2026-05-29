import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHORD_PLAYBACK_SETTINGS } from './chordPlayback'
import DiatonicChordList from './DiatonicChordList'

function renderDiatonicChordList(showChordNotes = true) {
  const onToggleChordNotes = vi.fn()

  render(
    <DiatonicChordList
      scaleRoot="C"
      scaleId="major"
      onPlayChord={vi.fn()}
      onHoverChord={vi.fn()}
      onPreviewChordVoicing={vi.fn()}
      onPinChord={vi.fn()}
      auditionSettings={DEFAULT_CHORD_PLAYBACK_SETTINGS}
      onAuditionSettingsChange={vi.fn()}
      showChordNotes={showChordNotes}
      onToggleChordNotes={onToggleChordNotes}
    />,
  )

  return { onToggleChordNotes }
}

describe('DiatonicChordList', () => {
  it('calls the chord note toggle handler from the eye button', () => {
    const { onToggleChordNotes } = renderDiatonicChordList()

    fireEvent.click(screen.getByRole('button', { name: 'Hide chord notes' }))

    expect(onToggleChordNotes).toHaveBeenCalledTimes(1)
  })

  it('labels the eye button for showing hidden chord notes', () => {
    renderDiatonicChordList(false)

    expect(screen.getByRole('button', { name: 'Show chord notes' })).toBeInTheDocument()
  })

  it('hides the eye button when collapsed', () => {
    renderDiatonicChordList()

    fireEvent.click(screen.getByRole('button', { name: 'Collapse chords panel' }))

    expect(screen.queryByRole('button', { name: 'Hide chord notes' })).not.toBeInTheDocument()
  })
})
