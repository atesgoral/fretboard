import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHORD_PLAYBACK_SETTINGS } from './chordPlayback'
import PinnedChordList, { type PinnedChord } from './PinnedChordList'

const pinnedChords: PinnedChord[] = [
  {
    root: 'C',
    qualityId: 'maj',
    extensionIds: [],
    playbackSettings: DEFAULT_CHORD_PLAYBACK_SETTINGS,
  },
]

function renderPinnedChordList(showChordNotes = true) {
  const onToggleChordNotes = vi.fn()

  render(
    <PinnedChordList
      pinnedChords={pinnedChords}
      onPlayChord={vi.fn()}
      onHoverChord={vi.fn()}
      onPreviewChordVoicing={vi.fn()}
      onRemoveChord={vi.fn()}
      onPlaybackSettingsChange={vi.fn()}
      auditionSettings={DEFAULT_CHORD_PLAYBACK_SETTINGS}
      onAuditionSettingsChange={vi.fn()}
      showChordNotes={showChordNotes}
      onToggleChordNotes={onToggleChordNotes}
    />,
  )

  return { onToggleChordNotes }
}

describe('PinnedChordList', () => {
  it('calls the chord note toggle handler from the eye button', () => {
    const { onToggleChordNotes } = renderPinnedChordList()

    fireEvent.click(screen.getByRole('button', { name: 'Hide chord notes' }))

    expect(onToggleChordNotes).toHaveBeenCalledTimes(1)
  })

  it('labels the eye button for showing hidden chord notes', () => {
    renderPinnedChordList(false)

    expect(screen.getByRole('button', { name: 'Show chord notes' })).toBeInTheDocument()
  })

  it('hides the eye button when collapsed', () => {
    renderPinnedChordList()

    fireEvent.click(screen.getByRole('button', { name: 'Collapse pinned chords panel' }))

    expect(screen.queryByRole('button', { name: 'Hide chord notes' })).not.toBeInTheDocument()
  })
})
