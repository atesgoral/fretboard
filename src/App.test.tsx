import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

vi.mock('smplr', () => ({
  Soundfont: () => ({
    ready: Promise.resolve(),
    start: vi.fn(),
  }),
}))

describe('App', () => {
  it('renders a fretboard and settings menu trigger', () => {
    render(<App />)

    expect(screen.getByText('Fretboard')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open settings menu' })).toBeInTheDocument()
  })
})
