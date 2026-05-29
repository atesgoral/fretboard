import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { useState } from 'react'
import type { ChordSelection } from './chordSearch'
import ChordCard from './ChordCard'
import { getChordSelectionKey } from './chordSelection'
import type { ChordPlaybackSettings } from './chordPlayback'

export type PinnedChord = ChordSelection & { playbackSettings: ChordPlaybackSettings }

type PinnedChordListProps = {
  pinnedChords: PinnedChord[]
  onPlayChord: (chord: PinnedChord) => void
  onHoverChord: (chord: ChordSelection | null) => void
  onRemoveChord: (index: number) => void
  auditionSettings: ChordPlaybackSettings
  onAuditionSettingsChange: (settings: ChordPlaybackSettings) => void
}

const cornerButtonClass =
  'inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition enabled:hover:border-zinc-500 enabled:hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 enabled:dark:hover:border-zinc-400 enabled:dark:hover:text-zinc-100'
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
        title={`Select pinned chord ${label.toLowerCase()}`}
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

function PinnedChordSettingsMenu({
  settings,
  onSettingsChange,
}: {
  settings: ChordPlaybackSettings
  onSettingsChange: (settings: ChordPlaybackSettings) => void
}) {
  const updateSettings = (next: Partial<ChordPlaybackSettings>) => {
    onSettingsChange({ ...settings, ...next })
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title="Open chord audition settings"
          aria-label="Open chord audition settings"
          className={`absolute bottom-2 left-2 ${settingsButtonClass}`}
        >
          <Settings className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side="top"
        align="start"
        sideOffset={8}
        className="z-50 w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex flex-col gap-3">
          <SettingsSelect
            label="Position"
            value={settings.positionPreference}
            options={[
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

export default function PinnedChordList({
  pinnedChords,
  onPlayChord,
  onHoverChord,
  onRemoveChord,
  auditionSettings,
  onAuditionSettingsChange,
}: PinnedChordListProps) {
  const [collapsed, setCollapsed] = useState(false)
  const collapseTitle = collapsed ? 'Expand pinned chords panel' : 'Collapse pinned chords panel'

  if (pinnedChords.length === 0) {
    return null
  }

  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return
    }
    onHoverChord(null)
  }

  return (
    <section
      className="relative rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      onPointerLeave={handlePointerLeave}
    >
      <button
        type="button"
        title={collapseTitle}
        aria-label={collapseTitle}
        onClick={() => setCollapsed((current) => !current)}
        className={`absolute right-2 top-2 ${cornerButtonClass}`}
      >
        {collapsed ? (
          <ChevronDown className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronUp className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
      <h2
        className={`${collapsed ? '' : 'mb-3'} pr-8 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400`}
      >
        Pinned chords
      </h2>
      <PinnedChordSettingsMenu
        settings={auditionSettings}
        onSettingsChange={onAuditionSettingsChange}
      />
      {collapsed ? null : (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 pl-8">
          {pinnedChords.map((chord, index) => (
            <ChordCard
              key={getChordSelectionKey(chord, index)}
              chord={chord}
              onPlay={() => onPlayChord(chord)}
              onHoverStart={() => onHoverChord(chord)}
              onRemove={() => onRemoveChord(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
