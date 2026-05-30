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
        autoHideLastPlayedNotes={false}
        onToggleLinear={vi.fn()}
        onToggleLowEPosition={vi.fn()}
        onToggleShowLastPlayedNotes={onToggleShowLastPlayedNotes}
        onToggleAutoHideLastPlayedNotes={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Open fretboard settings menu' })
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'Enter', code: 'Enter' })

    const item = await screen.findByRole('menuitemcheckbox', {
      name: 'Show last played notes',
    })
    expect(item).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(item)

    expect(onToggleShowLastPlayedNotes).toHaveBeenCalledTimes(1)
  })

  it('shows and toggles the auto-hide last played notes menu item', async () => {
    const onToggleAutoHideLastPlayedNotes = vi.fn()

    render(
      <FretboardSettingsMenu
        linear
        lowEAtBottom
        showLastPlayedNotes
        autoHideLastPlayedNotes={false}
        onToggleLinear={vi.fn()}
        onToggleLowEPosition={vi.fn()}
        onToggleShowLastPlayedNotes={vi.fn()}
        onToggleAutoHideLastPlayedNotes={onToggleAutoHideLastPlayedNotes}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Open fretboard settings menu' })
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'Enter', code: 'Enter' })

    const item = await screen.findByRole('menuitemcheckbox', {
      name: 'Auto-hide last played notes',
    })
    expect(item).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(item)

    expect(onToggleAutoHideLastPlayedNotes).toHaveBeenCalledTimes(1)
  })
})
