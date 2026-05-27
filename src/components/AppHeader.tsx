import type { ThemePreference } from '../hooks/useThemePreference'
import { Redo2, Undo2, Volume2, VolumeX } from 'lucide-react'
import SettingsMenu from './controls/SettingsMenu'

type AppHeaderProps = {
  canUndo: boolean
  canRedo: boolean
  muted: boolean
  preference: ThemePreference
  linear: boolean
  lowEAtBottom: boolean
  naturalDecay: boolean
  reverbEnabled: boolean
  onUndo: () => void
  onRedo: () => void
  onToggleMuted: () => void
  onCycleTheme: () => void
  onToggleLinear: () => void
  onToggleLowEPosition: () => void
  onToggleNaturalDecay: () => void
  onToggleReverb: () => void
}

export default function AppHeader({
  canUndo,
  canRedo,
  muted,
  preference,
  linear,
  lowEAtBottom,
  naturalDecay,
  reverbEnabled,
  onUndo,
  onRedo,
  onToggleMuted,
  onCycleTheme,
  onToggleLinear,
  onToggleLowEPosition,
  onToggleNaturalDecay,
  onToggleReverb,
}: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
        Fretboard
      </h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Undo chord changes"
          title="Undo chord changes"
          onClick={onUndo}
          disabled={!canUndo}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
        >
          <Undo2 className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Redo chord changes"
          title="Redo chord changes"
          onClick={onRedo}
          disabled={!canRedo}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
        >
          <Redo2 className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={muted ? 'Unmute playback' : 'Mute playback'}
          title={muted ? 'Unmute playback' : 'Mute playback'}
          onClick={onToggleMuted}
          className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-white text-zinc-700 transition dark:bg-zinc-800 dark:text-zinc-100 ${
            muted
              ? 'border-zinc-800 dark:border-zinc-100'
              : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500'
          }`}
        >
          {muted ? (
            <VolumeX className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Volume2 className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        <SettingsMenu
          preference={preference}
          onCycleTheme={onCycleTheme}
          linear={linear}
          onToggleLinear={onToggleLinear}
          lowEAtBottom={lowEAtBottom}
          onToggleLowEPosition={onToggleLowEPosition}
          naturalDecay={naturalDecay}
          onToggleNaturalDecay={onToggleNaturalDecay}
          reverbEnabled={reverbEnabled}
          onToggleReverb={onToggleReverb}
        />
      </div>
    </div>
  )
}
