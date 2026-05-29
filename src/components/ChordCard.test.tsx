import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChordCard from './ChordCard'

describe('ChordCard', () => {
  it('plays chords on pointer down', () => {
    const onPlay = vi.fn()

    render(<ChordCard chord={{ root: 'C', qualityId: 'maj', extensionIds: [] }} onPlay={onPlay} />)

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Play chord Cmaj' }))

    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('reports play-button hover separately from card hover', () => {
    const onPlay = vi.fn()
    const onPlayHoverStart = vi.fn()
    const onPlayHoverEnd = vi.fn()

    render(
      <ChordCard
        chord={{ root: 'C', qualityId: 'maj', extensionIds: [] }}
        onPlay={onPlay}
        onPlayHoverStart={onPlayHoverStart}
        onPlayHoverEnd={onPlayHoverEnd}
      />,
    )

    const playButton = screen.getByRole('button', { name: 'Play chord Cmaj' })
    fireEvent.pointerEnter(playButton)
    fireEvent.pointerLeave(playButton)

    expect(onPlayHoverStart).toHaveBeenCalledTimes(1)
    expect(onPlayHoverEnd).toHaveBeenCalledTimes(1)
  })
})
