import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Settings } from 'lucide-react'
import type { ChordPlaybackSettings, ChordPlaybackSettingsOverride } from './chordPlayback'

type ChordPlaybackMenuSettings = ChordPlaybackSettings | ChordPlaybackSettingsOverride

type ChordPlaybackSettingsMenuProps = {
  settings: ChordPlaybackMenuSettings
  onSettingsChange: (settings: ChordPlaybackMenuSettings) => void
  className?: string
  includeInheritOption?: boolean
  title?: string
}

const settingsButtonClass =
  'inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition enabled:hover:border-zinc-500 enabled:hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 enabled:dark:hover:border-zinc-400 enabled:dark:hover:text-zinc-100'
const selectClass =
  'mt-1 w-full cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm normal-case tracking-normal text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'

function SettingsSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <label className="block text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
      {label}
      <select
        value={value}
        title={`Select chord ${label.toLowerCase()}`}
        onChange={(event) => onChange(event.target.value as T)}
        className={selectClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function ChordPlaybackSettingsMenu({
  settings,
  onSettingsChange,
  className = '',
  includeInheritOption = false,
  title = 'Open chord audition settings',
}: ChordPlaybackSettingsMenuProps) {
  const updateSettings = (next: Partial<ChordPlaybackMenuSettings>) => {
    onSettingsChange({ ...settings, ...next })
  }
  const inheritedOption = includeInheritOption
    ? [{ value: 'inherit' as const, label: 'Inherit' }]
    : []

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title={title}
          aria-label={title}
          onClick={(event) => event.stopPropagation()}
          className={`${settingsButtonClass} ${className}`}
        >
          <Settings className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side="bottom"
        align="end"
        sideOffset={8}
        className="z-50 w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex flex-col gap-3">
          <SettingsSelect
            label="Position"
            value={settings.positionPreference}
            options={[
              ...inheritedOption,
              { value: 'default', label: 'Best available' },
              { value: 'open', label: 'Prefer open/cowboy' },
              { value: 'moveable', label: 'Prefer moveable/barre' },
            ]}
            onChange={(positionPreference) => updateSettings({ positionPreference })}
          />
          <SettingsSelect
            label="Inversion"
            value={settings.inversionPreference}
            options={[
              ...inheritedOption,
              { value: 'root', label: 'Root position' },
              { value: 'first', label: 'First inversion' },
              { value: 'second', label: 'Second inversion' },
            ]}
            onChange={(inversionPreference) => updateSettings({ inversionPreference })}
          />
          <SettingsSelect
            label="Playback"
            value={settings.playbackMode}
            options={[
              ...inheritedOption,
              { value: 'pluck', label: 'Pluck together' },
              { value: 'strum', label: 'Strum low to high' },
            ]}
            onChange={(playbackMode) => updateSettings({ playbackMode })}
          />
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
