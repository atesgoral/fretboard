import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, vi } from 'vitest'
import Fretboard from './Fretboard'

vi.mock('smplr', () => ({
  Reverb: () => ({
    connect: vi.fn(),
    input: {},
  }),
  Soundfont: () => ({
    ready: Promise.resolve(),
    start: vi.fn(),
  }),
}))

const originalSetPointerCapture = HTMLElement.prototype.setPointerCapture
const originalHasPointerCapture = HTMLElement.prototype.hasPointerCapture
const originalReleasePointerCapture = HTMLElement.prototype.releasePointerCapture

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: vi.fn(() => false),
  })
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: vi.fn(),
  })
})

afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: originalSetPointerCapture,
  })
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: originalHasPointerCapture,
  })
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: originalReleasePointerCapture,
  })
})

function renderFretboard() {
  render(
    <div>
      <Fretboard
        linear
        lowEAtBottom={false}
        naturalDecay={false}
        reverbEnabled={false}
        muted
        markedNotes={new Map()}
        playedPositions={[]}
        playSequence={0}
      />
      <button type="button">Outside control</button>
    </div>,
  )
}

function playAndReleaseOpenLowE() {
  fireEvent.pointerDown(screen.getByTitle('Play string 1, open string'), { pointerId: 1 })
  fireEvent.pointerUp(window, { pointerId: 1 })
}

describe('Fretboard', () => {
  it('clears the last played note when pressing outside the fretboard', () => {
    renderFretboard()

    playAndReleaseOpenLowE()

    expect(screen.getAllByText('E').length).toBeGreaterThan(0)

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside control' }), { pointerId: 2 })

    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })

  it('clears the last played note when pressing the legend outside the fretboard rectangle', () => {
    renderFretboard()

    playAndReleaseOpenLowE()

    expect(screen.getAllByText('E').length).toBeGreaterThan(0)

    fireEvent.pointerDown(screen.getByText('Last played'), { pointerId: 2 })

    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })
})
