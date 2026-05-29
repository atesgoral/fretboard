import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

type MockFretboardProps = {
  highlightedPitchClasses?: number[]
  highlightedPositions?: unknown[]
  highlightedChordRoles?: Map<number, string>
  playedPositions?: unknown[]
}

vi.mock('smplr', () => ({
  Soundfont: () => ({
    ready: Promise.resolve(),
    start: vi.fn(),
  }),
}))

vi.mock('./components/Fretboard', () => ({
  default: ({
    highlightedPitchClasses = [],
    highlightedPositions = [],
    highlightedChordRoles = new Map(),
    playedPositions = [],
  }: MockFretboardProps) => (
    <div
      data-testid="fretboard"
      data-highlighted-pitch-classes={highlightedPitchClasses.length}
      data-highlighted-positions={highlightedPositions.length}
      data-highlighted-chord-roles={highlightedChordRoles.size}
      data-played-positions={playedPositions.length}
    >
      Fretboard
    </div>
  ),
}))

function getFretboardCounts() {
  const fretboard = screen.getByTestId('fretboard')

  return {
    pitchClasses: Number(fretboard.dataset.highlightedPitchClasses),
    positions: Number(fretboard.dataset.highlightedPositions),
    chordRoles: Number(fretboard.dataset.highlightedChordRoles),
    playedPositions: Number(fretboard.dataset.playedPositions),
  }
}

describe('App', () => {
  it('renders a fretboard and settings menu trigger', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Fretboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open settings menu' })).toBeInTheDocument()
  })

  it('toggles chord note previews without blocking chord playback', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Key'), { target: { value: 'C' } })
    const cMajorCard = screen.getByTitle('I: Cmaj').parentElement
    expect(cMajorCard).not.toBeNull()

    fireEvent.pointerEnter(cMajorCard!)
    expect(getFretboardCounts().pitchClasses).toBeGreaterThan(0)
    expect(getFretboardCounts().chordRoles).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Hide chord notes' }))
    expect(getFretboardCounts()).toMatchObject({
      pitchClasses: 0,
      positions: 0,
      chordRoles: 0,
    })

    fireEvent.pointerEnter(cMajorCard!)
    expect(getFretboardCounts()).toMatchObject({
      pitchClasses: 0,
      positions: 0,
      chordRoles: 0,
    })

    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Play chord Cmaj' }))
    expect(getFretboardCounts()).toMatchObject({
      pitchClasses: 0,
      positions: 0,
      chordRoles: 0,
    })

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Play chord Cmaj' }))
    expect(getFretboardCounts().playedPositions).toBeGreaterThan(0)
  })
})
