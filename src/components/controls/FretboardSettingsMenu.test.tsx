import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FretboardSettingsMenu from './FretboardSettingsMenu'

describe('FretboardSettingsMenu', () => {
  it('shows and toggles the last played notes menu item', async () => {
    const onToggleShowLastPlayedNotes = vi.fn()

    render(
      <FretboardSettingsMenu
        linear
        lowEAtBottom
        showLastPlayedNotes
        onToggleLinear={vi.fn()}
        onToggleLowEPosition={vi.fn()}
        onToggleShowLastPlayedNotes={onToggleShowLastPlayedNotes}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open fretboard settings menu' }))

    const item = await screen.findByRole('menuitemcheckbox', {
      name: 'Show last played notes',
    })
    expect(item).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(item)

    expect(onToggleShowLastPlayedNotes).toHaveBeenCalledTimes(1)
  })
})
