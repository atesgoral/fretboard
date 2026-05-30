import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Fretboard from './Fretboard'

const audioMocks = vi.hoisted(() => ({
  close: vi.fn(),
  reverb: vi.fn(),
  resolveReady: undefined as (() => void) | undefined,
  resume: vi.fn(),
  soundfont: vi.fn(),
  start: vi.fn(),
}))

vi.mock('smplr', () => ({
  Reverb: audioMocks.reverb,
  Soundfont: audioMocks.soundfont,
}))

const originalSetPointerCapture = HTMLElement.prototype.setPointerCapture
const originalHasPointerCapture = HTMLElement.prototype.hasPointerCapture
const originalReleasePointerCapture = HTMLElement.prototype.releasePointerCapture

type WindowWithWebKitAudioContext = Window & {
  webkitAudioContext?: new () => AudioContext
}

function createAudioNode() {
  return {
    connect: vi.fn(),
    frequency: { value: 0 },
    gain: { value: 0 },
    type: '',
  }
}

class MockAudioContext {
  destination = createAudioNode()
  state: AudioContextState = 'suspended'

  close() {
    audioMocks.close()
    return Promise.resolve()
  }

  createBiquadFilter() {
    return createAudioNode()
  }

  createGain() {
    return createAudioNode()
  }

  resume() {
    audioMocks.resume()
    this.state = 'running'
    return Promise.resolve()
  }
}

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

describe('Fretboard audio playback', () => {
  const originalAudioContext = window.AudioContext
  const originalWebKitAudioContext = (window as WindowWithWebKitAudioContext).webkitAudioContext

  beforeEach(() => {
    const ready = new Promise<void>((resolve) => {
      audioMocks.resolveReady = resolve
    })

    audioMocks.close.mockClear()
    audioMocks.reverb.mockReset()
    audioMocks.resume.mockClear()
    audioMocks.soundfont.mockReset()
    audioMocks.start.mockClear()

    audioMocks.reverb.mockReturnValue({ connect: vi.fn(), input: createAudioNode() })
    audioMocks.soundfont.mockReturnValue({ ready, start: audioMocks.start })

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: MockAudioContext,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: originalAudioContext,
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: originalWebKitAudioContext,
    })
  })

  it('unlocks prefixed Safari audio immediately on the first press', async () => {
    render(
      <Fretboard
        linear={false}
        lowEAtBottom={false}
        onToggleLinear={vi.fn()}
        onToggleLowEPosition={vi.fn()}
        reverbEnabled={false}
        muted={false}
        markedNotes={new Map()}
        playedPositions={[]}
        playSequence={0}
      />,
    )

    fireEvent.pointerDown(screen.getByTitle('Play string 1, open string'), { pointerId: 1 })

    expect(audioMocks.resume).toHaveBeenCalledTimes(1)
    expect(audioMocks.soundfont).toHaveBeenCalledTimes(1)
    expect(audioMocks.start).not.toHaveBeenCalled()

    audioMocks.resolveReady?.()

    await waitFor(() => {
      expect(audioMocks.start).toHaveBeenCalledWith({ duration: 1, note: 40, velocity: 110 })
    })
  })

  it('unlocks audio from the captured user gesture before sequenced playback', async () => {
    const { rerender } = render(
      <Fretboard
        linear={false}
        lowEAtBottom={false}
        onToggleLinear={vi.fn()}
        onToggleLowEPosition={vi.fn()}
        reverbEnabled={false}
        muted={false}
        markedNotes={new Map()}
        playedPositions={[]}
        playSequence={0}
      />,
    )

    fireEvent.pointerDown(document.body, { pointerId: 1 })

    expect(audioMocks.resume).toHaveBeenCalledTimes(1)
    expect(audioMocks.soundfont).not.toHaveBeenCalled()

    rerender(
      <Fretboard
        linear={false}
        lowEAtBottom={false}
        onToggleLinear={vi.fn()}
        onToggleLowEPosition={vi.fn()}
        reverbEnabled={false}
        muted={false}
        markedNotes={new Map()}
        playedPositions={[{ stringIndex: 0, fret: 0 }]}
        playSequence={1}
      />,
    )
    audioMocks.resolveReady?.()

    await waitFor(() => {
      expect(audioMocks.start).toHaveBeenCalledWith({ duration: 1, note: 40, velocity: 110 })
    })
  })
})

function renderMutedFretboardWithOutsideControl() {
  render(
    <div>
      <Fretboard
        linear
        lowEAtBottom={false}
        onToggleLinear={vi.fn()}
        onToggleLowEPosition={vi.fn()}
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

function fireTouchPointerEvent(
  target: Element,
  eventName: 'pointerDown' | 'pointerUp',
  pointerId: number,
) {
  const event = createPointerEvent(eventName, { pointerId, pointerType: 'touch' })
  fireEvent(target, event)
}

function createPointerEvent(
  eventName: 'pointerDown' | 'pointerUp',
  options: { pointerId: number; pointerType: string },
) {
  const event = new Event(eventName.toLowerCase(), { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    pointerId: { value: options.pointerId },
    pointerType: { value: options.pointerType },
  })
  return event
}

function playTouchOpenStrings() {
  fireTouchPointerEvent(screen.getByTitle('Play string 1, open string'), 'pointerDown', 1)
  fireTouchPointerEvent(screen.getByTitle('Play string 2, open string'), 'pointerDown', 2)
  fireTouchPointerEvent(screen.getByTitle('Play string 1, open string'), 'pointerUp', 1)
}

describe('Fretboard interaction state', () => {
  it('clears the last played note when pressing outside the fretboard', () => {
    renderMutedFretboardWithOutsideControl()

    playAndReleaseOpenLowE()

    expect(screen.getAllByText('E').length).toBeGreaterThan(0)

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside control' }), { pointerId: 2 })

    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })

  it('clears the last played note when pressing the legend outside the fretboard rectangle', () => {
    renderMutedFretboardWithOutsideControl()

    playAndReleaseOpenLowE()

    expect(screen.getAllByText('E').length).toBeGreaterThan(0)

    fireEvent.pointerDown(screen.getByText('Last played'), { pointerId: 2 })

    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })

  it('keeps the legend outside the horizontal fretboard scroller', () => {
    renderMutedFretboardWithOutsideControl()

    const legend = screen.getByText('Last played')
    const section = legend.closest('section')
    const horizontalScroller = section?.querySelector('.overflow-x-auto')

    expect(horizontalScroller).not.toBeNull()
    expect(horizontalScroller).not.toContainElement(legend)
  })

  it('keeps all simultaneous touch taps highlighted as last played', () => {
    renderMutedFretboardWithOutsideControl()

    playTouchOpenStrings()

    expect(screen.getByText('E · A')).toBeInTheDocument()
  })
})
