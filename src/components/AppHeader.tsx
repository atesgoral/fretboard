import type { ThemePreference } from '../hooks/useThemePreference'
import { Redo2, Undo2, Volume2, VolumeX } from 'lucide-react'
import SettingsMenu from './controls/SettingsMenu'

type AppHeaderProps = {
  canUndo: boolean
  canRedo: boolean
  muted: boolean
  preference: ThemePreference
  naturalDecay: boolean
  reverbEnabled: boolean
  onUndo: () => void
  onRedo: () => void
  onToggleMuted: () => void
  onCycleTheme: () => void
  onToggleNaturalDecay: () => void
  onToggleReverb: () => void
}

const headerIconClass = 'pointer-events-none h-5 w-5'

const headerIconButtonClass =
  'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition enabled:hover:border-zinc-400 disabled:cursor-default disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 enabled:dark:hover:border-zinc-500'

export default function AppHeader({
  canUndo,
  canRedo,
  muted,
  preference,
  naturalDecay,
  reverbEnabled,
  onUndo,
  onRedo,
  onToggleMuted,
  onCycleTheme,
  onToggleNaturalDecay,
  onToggleReverb,
}: AppHeaderProps) {
  const muteTitle = muted ? 'Unmute playback' : 'Mute playback'

  return (
    <div className="flex items-center justify-between">
      <h1 className="font-varela-round text-sm font-medium uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
        Fretboard
      </h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...(canUndo ? { title: 'Undo chord changes', 'aria-label': 'Undo chord changes' } : {})}
          onClick={onUndo}
          disabled={!canUndo}
          className={headerIconButtonClass}
        >
          <Undo2 className={headerIconClass} aria-hidden="true" />
        </button>
        <button
          type="button"
          {...(canRedo ? { title: 'Redo chord changes', 'aria-label': 'Redo chord changes' } : {})}
          onClick={onRedo}
          disabled={!canRedo}
          className={headerIconButtonClass}
        >
          <Redo2 className={headerIconClass} aria-hidden="true" />
        </button>
        <button
          type="button"
          title={muteTitle}
          aria-label={muteTitle}
          onClick={onToggleMuted}
          className={`${headerIconButtonClass} ${
            muted
              ? 'border-zinc-800 dark:border-zinc-100'
              : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500'
          }`}
        >
          {muted ? (
            <VolumeX className={headerIconClass} aria-hidden="true" />
          ) : (
            <Volume2 className={headerIconClass} aria-hidden="true" />
          )}
        </button>
        <SettingsMenu
          preference={preference}
          onCycleTheme={onCycleTheme}
          naturalDecay={naturalDecay}
          onToggleNaturalDecay={onToggleNaturalDecay}
          reverbEnabled={reverbEnabled}
          onToggleReverb={onToggleReverb}
        />
      </div>
    </div>
  )
}
