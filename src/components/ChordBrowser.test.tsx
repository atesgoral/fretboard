import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChordBrowser from './ChordBrowser'
import { SCALE_OPTIONS } from './scales'

describe('ChordBrowser scale selector', () => {
  it('renders all scale options from SCALE_OPTIONS', () => {
    render(
      <ChordBrowser
        scaleRoot="C"
        scaleId="major"
        showScaleNotes
        onScaleRootChange={vi.fn()}
        onScaleIdChange={vi.fn()}
        onToggleScaleNotes={vi.fn()}
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
        showScaleNotes
        onScaleRootChange={vi.fn()}
        onScaleIdChange={vi.fn()}
        onToggleScaleNotes={vi.fn()}
      />,
    )

    const keySelect = screen.getByTitle('Select key') as HTMLSelectElement
    expect(keySelect.value).toBe('')
    expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument()
  })

  it('renders the key selector at a compact width', () => {
    render(
      <ChordBrowser
        scaleRoot="C#"
        scaleId="major"
        showScaleNotes
        onScaleRootChange={vi.fn()}
        onScaleIdChange={vi.fn()}
        onToggleScaleNotes={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Key').closest('label')).toHaveClass('w-16')
  })

  it('disables the scale selector when no key is selected', () => {
    render(
      <ChordBrowser
        scaleRoot={null}
        scaleId="major"
        showScaleNotes
        onScaleRootChange={vi.fn()}
        onScaleIdChange={vi.fn()}
        onToggleScaleNotes={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Scale')).toBeDisabled()
  })

  it('calls toggle handler from the eye button', () => {
    const onToggleScaleNotes = vi.fn()

    render(
      <ChordBrowser
        scaleRoot="C"
        scaleId="major"
        showScaleNotes
        onScaleRootChange={vi.fn()}
        onScaleIdChange={vi.fn()}
        onToggleScaleNotes={onToggleScaleNotes}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hide scale notes' }))
    expect(onToggleScaleNotes).toHaveBeenCalledTimes(1)
  })

  it('keeps the scale note toggle available when collapsed', () => {
    const onToggleScaleNotes = vi.fn()

    render(
      <ChordBrowser
        scaleRoot="C"
        scaleId="major"
        showScaleNotes
        onScaleRootChange={vi.fn()}
        onScaleIdChange={vi.fn()}
        onToggleScaleNotes={onToggleScaleNotes}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Collapse scale panel' }))
    expect(screen.queryByLabelText('Key')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hide scale notes' }))
    expect(onToggleScaleNotes).toHaveBeenCalledTimes(1)
  })
})
