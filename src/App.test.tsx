import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders starter content', () => {
    render(<App />)

    expect(screen.getByText('Ready for GitHub Pages')).toBeInTheDocument()
    expect(screen.getByText('Vite + React + Tailwind')).toBeInTheDocument()
  })
})
