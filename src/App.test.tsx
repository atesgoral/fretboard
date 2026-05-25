import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders a fretboard and settings menu trigger', () => {
    render(<App />)

    expect(screen.getByText('Fretboard')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open settings menu' })).toBeInTheDocument()
  })
})
