import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

vi.mock('smplr', () => ({
  Soundfont: () => ({
    ready: Promise.resolve(),
    start: vi.fn(),
  }),
}))

describe('App', () => {
  function openMenu(name: string) {
    const trigger = screen.getByRole('button', { name })
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'Enter', code: 'Enter' })
  }

  it('renders a fretboard and separate settings menu triggers', () => {
    render(<App />)

    expect(screen.getByText('Fretboard')).toBeInTheDocument()
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
  })
})
