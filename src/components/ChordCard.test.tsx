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
})
