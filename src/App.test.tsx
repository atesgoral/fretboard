import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders a fretboard and toggles spacing mode', () => {
    render(<App />)

    expect(screen.getByText('Fretboard')).toBeInTheDocument()
    expect(screen.getByText('Realistic spacing')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle fret spacing' }))

    expect(screen.getByText('Linear spacing')).toBeInTheDocument()
  })
})
