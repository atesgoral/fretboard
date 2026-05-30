import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHORD_PLAYBACK_SETTINGS } from './chordPlayback'
import type { ChordSelection } from './chordSearch'
import PinnedChordList, { type PinnedChord } from './PinnedChordList'

const pinnedChords: PinnedChord[] = [
  {
    root: 'C',
    qualityId: 'maj',
    extensionIds: [],
    playbackSettings: DEFAULT_CHORD_PLAYBACK_SETTINGS,
  },
]

function renderPinnedChordList({
  onHoverChord = vi.fn(),
  showChordNotes = true,
}: {
  onHoverChord?: (chord: ChordSelection | null) => void
  showChordNotes?: boolean
} = {}) {
  const onToggleChordNotes = vi.fn()

  render(
    <PinnedChordList
      pinnedChords={pinnedChords}
      onPlayChord={vi.fn()}
      onHoverChord={onHoverChord}
      onPreviewChordVoicing={vi.fn()}
      onRemoveChord={vi.fn()}
      onPlaybackSettingsChange={vi.fn()}
      auditionSettings={DEFAULT_CHORD_PLAYBACK_SETTINGS}
      onAuditionSettingsChange={vi.fn()}
      showChordNotes={showChordNotes}
      onToggleChordNotes={onToggleChordNotes}
    />,
  )

  return { onHoverChord, onToggleChordNotes }
}

describe('PinnedChordList', () => {
  it('calls the chord note toggle handler from the eye button', () => {
    const { onToggleChordNotes } = renderPinnedChordList()

    fireEvent.click(screen.getByRole('button', { name: 'Hide chord notes' }))

    expect(onToggleChordNotes).toHaveBeenCalledTimes(1)
  })

  it('labels the eye button for showing hidden chord notes', () => {
    renderPinnedChordList({ showChordNotes: false })

    expect(screen.getByRole('button', { name: 'Show chord notes' })).toBeInTheDocument()
  })

  it('positions the eye button left of the gear and collapse controls', () => {
    renderPinnedChordList()

    expect(screen.getByRole('button', { name: 'Hide chord notes' })).toHaveClass(
      'right-[4.5rem]',
      'top-2',
    )
  })

  it('hides chord controls when collapsed', () => {
    renderPinnedChordList()

    fireEvent.click(screen.getByRole('button', { name: 'Collapse pinned chords panel' }))
    expect(screen.queryByTitle('Cmaj')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hide chord notes' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Open chord audition settings' }),
    ).not.toBeInTheDocument()
  })

  it('clears chord hover when the pointer leaves a pinned chord card', () => {
    const onHoverChord = vi.fn()

    renderPinnedChordList({ onHoverChord })

    const card = screen.getByTitle('Cmaj').parentElement
    expect(card).not.toBeNull()

    fireEvent.pointerEnter(card!)
    fireEvent.pointerLeave(card!)

    expect(onHoverChord).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        root: 'C',
        qualityId: 'maj',
        extensionIds: [],
      }),
    )
    expect(onHoverChord).toHaveBeenLastCalledWith(null)
  })
})
