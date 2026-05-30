import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('renders None as the empty key selection', () => {
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

    expect(screen.getByTitle('Select key')).toHaveTextContent('None')

    fireEvent.click(screen.getByTitle('Select key'))
    expect(screen.getByRole('button', { name: 'None' })).toBeInTheDocument()
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

    expect(screen.getByText('Key').parentElement).toHaveClass('w-16')
  })

  it('rotates the focused key selector with arrow keys and wraps around', () => {
    const onScaleRootChange = vi.fn()
    const { rerender } = render(
      <ChordBrowser
        scaleRoot="B"
        scaleId="major"
        showScaleNotes
        onScaleRootChange={onScaleRootChange}
        onScaleIdChange={vi.fn()}
        onToggleScaleNotes={vi.fn()}
      />,
    )

    const keySelector = screen.getByTitle('Select key')
    keySelector.focus()
    fireEvent.keyDown(keySelector, { key: 'ArrowRight', code: 'ArrowRight' })
    expect(onScaleRootChange).toHaveBeenLastCalledWith('C')

    rerender(
      <ChordBrowser
        scaleRoot="C"
        scaleId="major"
        showScaleNotes
        onScaleRootChange={onScaleRootChange}
        onScaleIdChange={vi.fn()}
        onToggleScaleNotes={vi.fn()}
      />,
    )

    fireEvent.keyDown(screen.getByTitle('Select key'), { key: 'ArrowLeft', code: 'ArrowLeft' })
    expect(onScaleRootChange).toHaveBeenLastCalledWith('B')
  })

  it('opens a piano-style popover and selects sharp keys', () => {
    const onScaleRootChange = vi.fn()
    render(
      <ChordBrowser
        scaleRoot="C"
        scaleId="major"
        showScaleNotes
        onScaleRootChange={onScaleRootChange}
        onScaleIdChange={vi.fn()}
        onToggleScaleNotes={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByTitle('Select key'))

    const popover = screen.getByRole('dialog', { name: 'Select key' })
    for (const note of ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'D#', 'F#', 'G#', 'A#']) {
      expect(within(popover).getByRole('button', { name: note })).toBeInTheDocument()
    }

    fireEvent.click(within(popover).getByRole('button', { name: 'F#' }))
    expect(onScaleRootChange).toHaveBeenCalledWith('F#')
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
