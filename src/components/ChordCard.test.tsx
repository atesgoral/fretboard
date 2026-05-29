import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChordCard from './ChordCard'

function createTouchPointerEvent(
  eventName: 'pointerdown' | 'click',
  options: { clientX?: number; clientY?: number } = {},
) {
  const event = new Event(eventName, { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    clientX: { value: options.clientX ?? 0 },
    clientY: { value: options.clientY ?? 0 },
    pointerType: { value: 'touch' },
  })
  return event
}

function mockCardRect(element: Element) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    bottom: 96,
    height: 96,
    left: 0,
    right: 96,
    top: 0,
    width: 96,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
}

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

  it('plays immediately from the hidden play-button area on touch', () => {
    const onPlay = vi.fn()

    render(<ChordCard chord={{ root: 'C', qualityId: 'maj', extensionIds: [] }} onPlay={onPlay} />)

    const cardSurface = screen.getByTitle('Cmaj')
    const card = cardSurface.parentElement
    expect(card).not.toBeNull()
    mockCardRect(card!)

    fireEvent(cardSurface, createTouchPointerEvent('pointerdown', { clientX: 88, clientY: 88 }))

    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('suppresses card selection after touch-playing from the play-button area', () => {
    const onPlay = vi.fn()
    const onSelect = vi.fn()

    render(
      <ChordCard
        chord={{ root: 'C', qualityId: 'maj', extensionIds: [] }}
        onPlay={onPlay}
        onSelect={onSelect}
      />,
    )

    const cardSurface = screen.getByRole('button', { name: 'Select chord Cmaj' })
    const card = cardSurface.parentElement
    expect(card).not.toBeNull()
    mockCardRect(card!)

    fireEvent(cardSurface, createTouchPointerEvent('pointerdown', { clientX: 88, clientY: 88 }))
    fireEvent(cardSurface, createTouchPointerEvent('click'))

    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
