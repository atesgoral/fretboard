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

vi.mock('./components/Fretboard', async () => {
  const React = await vi.importActual<typeof import('react')>('react')

  return {
    default: ({
      highlightedPitchClasses = [],
      highlightedPositions = [],
      highlightedChordRoles = new Map(),
      playedPositions = [],
    }: MockFretboardProps) => {
      const [settingsOpen, setSettingsOpen] = React.useState(false)

      return (
        <div
          data-testid="fretboard"
          data-highlighted-pitch-classes={highlightedPitchClasses.length}
          data-highlighted-positions={highlightedPositions.length}
          data-highlighted-chord-roles={highlightedChordRoles.size}
          data-played-positions={playedPositions.length}
        >
          Fretboard
          <button
            type="button"
            aria-label="Open fretboard settings menu"
            title="Open fretboard settings menu"
            onClick={() => setSettingsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                setSettingsOpen(true)
              }
            }}
          >
            Fretboard settings
          </button>
          {settingsOpen ? (
            <div>
              <span>Fret spacing</span>
              <span>Show low E on top</span>
              <span>Show last played notes</span>
            </div>
          ) : null}
        </div>
      )
    },
  }
})

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
  function openMenu(name: string) {
    const trigger = screen.getByRole('button', { name })
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'Enter', code: 'Enter' })
  }

  it('renders a fretboard and separate settings menu triggers', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Fretboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open settings menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open fretboard settings menu' })).toBeInTheDocument()
  })

  it('keeps fretboard settings out of the app settings menu', async () => {
    render(<App />)

    openMenu('Open settings menu')

    expect(await screen.findByText('Natural decay')).toBeInTheDocument()
    expect(screen.queryByText('Fret spacing')).not.toBeInTheDocument()
  })

  it('shows fretboard settings in the panel menu', async () => {
    render(<App />)

    openMenu('Open fretboard settings menu')

    expect(await screen.findByText('Fret spacing')).toBeInTheDocument()
    expect(screen.getByText('Show low E on top')).toBeInTheDocument()
    expect(screen.getByText('Show last played notes')).toBeInTheDocument()
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
