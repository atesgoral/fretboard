import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PinnedChordList from './PinnedChordList'
import { DEFAULT_CHORD_PLAYBACK_SETTINGS } from './chordPlayback'

describe('PinnedChordList', () => {
  it('clears chord hover when the pointer leaves a pinned chord card', () => {
    const onHoverChord = vi.fn()

    render(
      <PinnedChordList
        pinnedChords={[
          {
            root: 'C',
            qualityId: 'maj',
            extensionIds: [],
            playbackSettings: DEFAULT_CHORD_PLAYBACK_SETTINGS,
          },
        ]}
        onPlayChord={vi.fn()}
        onHoverChord={onHoverChord}
        onPreviewChordVoicing={vi.fn()}
        onRemoveChord={vi.fn()}
        onPlaybackSettingsChange={vi.fn()}
        auditionSettings={DEFAULT_CHORD_PLAYBACK_SETTINGS}
        onAuditionSettingsChange={vi.fn()}
      />,
    )

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
