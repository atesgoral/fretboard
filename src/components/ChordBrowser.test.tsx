import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChordBrowser from './ChordBrowser'
import { SCALE_OPTIONS } from './scales'

describe('ChordBrowser scale selector', () => {
  it('renders all scale options from SCALE_OPTIONS', () => {
    render(
      <ChordBrowser
        scaleRoot="C"
        scaleId="major"
        onScaleRootChange={vi.fn()}
        onScaleIdChange={vi.fn()}
      />,
    )

    const scaleSelect = screen.getByTitle('Select scale')
    const renderedOptions = Array.from(scaleSelect.querySelectorAll('option'))
    const expectedLabels = SCALE_OPTIONS.map((scale) => scale.label)

    expect(renderedOptions).toHaveLength(SCALE_OPTIONS.length)
    expect(renderedOptions.map((option) => option.textContent)).toEqual(expectedLabels)
  })

  it('renders a None key option', () => {
    render(
      <ChordBrowser
        scaleRoot={null}
        scaleId="major"
        onScaleRootChange={vi.fn()}
        onScaleIdChange={vi.fn()}
      />,
    )

    const keySelect = screen.getByTitle('Select key') as HTMLSelectElement
    expect(keySelect.value).toBe('')
    expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument()
  })

  it('disables the scale selector when no key is selected', () => {
    render(
      <ChordBrowser
        scaleRoot={null}
        scaleId="major"
        onScaleRootChange={vi.fn()}
        onScaleIdChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Scale')).toBeDisabled()
  })
})
