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
})
