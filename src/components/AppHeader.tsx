import type { ThemePreference } from '../hooks/useThemePreference'
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
      <h1 className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">Fretboard</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Undo chord changes"
          title="Undo chord changes"
          onClick={onUndo}
          disabled={!canUndo}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          >
            <path d="M9 7 4 12l5 5" />
            <path d="M4 12h8a6 6 0 0 1 6 6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Redo chord changes"
          title="Redo chord changes"
          onClick={onRedo}
          disabled={!canRedo}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          >
            <path d="m15 7 5 5-5 5" />
            <path d="M20 12h-8a6 6 0 0 0-6 6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={muted ? 'Unmute playback' : 'Mute playback'}
          title={muted ? 'Unmute playback' : 'Mute playback'}
          onClick={onToggleMuted}
          className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-white text-zinc-700 transition dark:bg-zinc-800 dark:text-zinc-100 ${
            muted ? 'border-zinc-800 dark:border-zinc-100' : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          >
            <path d="M5 14v-4h4l5-4v12l-5-4H5Z" />
            {muted ? <path d="m4 4 16 16" /> : null}
          </svg>
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

