import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
        naturalDecay={false}
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
        naturalDecay={false}
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
        naturalDecay={false}
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
