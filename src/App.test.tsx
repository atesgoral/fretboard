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
  it('renders a fretboard and separate settings menu triggers', () => {
    render(<App />)

    expect(screen.getByText('Fretboard')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open settings menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open fretboard settings menu' })).toBeInTheDocument()
  })

  it('keeps fretboard settings in the fretboard menu', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Open settings menu' }))

    expect(screen.getByText('Natural decay')).toBeInTheDocument()
    expect(screen.queryByText('Fret spacing')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open fretboard settings menu' }))

    expect(screen.getByText('Fret spacing')).toBeInTheDocument()
    expect(screen.getByText('Show low E on top')).toBeInTheDocument()
  })
})
