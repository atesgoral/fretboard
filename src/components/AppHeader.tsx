import type { ThemePreference } from '../hooks/useThemePreference'
import { Redo2, Undo2, Volume2, VolumeX } from 'lucide-react'
import IconButton from './controls/IconButton'
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

const headerIconButtonClass =
  'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition enabled:hover:border-zinc-400 disabled:cursor-default disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 enabled:dark:hover:border-zinc-500'

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
  const muteTitle = muted ? 'Unmute playback' : 'Mute playback'

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
        Fretboard
      </h1>
      <div className="flex items-center gap-2">
        <IconButton
          title="Undo chord changes"
          onClick={onUndo}
          disabled={!canUndo}
          className={headerIconButtonClass}
        >
          <Undo2 className="h-5 w-5" aria-hidden="true" />
        </IconButton>
        <IconButton
          title="Redo chord changes"
          onClick={onRedo}
          disabled={!canRedo}
          className={headerIconButtonClass}
        >
          <Redo2 className="h-5 w-5" aria-hidden="true" />
        </IconButton>
        <IconButton
          title={muteTitle}
          onClick={onToggleMuted}
          className={`${headerIconButtonClass} ${
            muted
              ? 'border-zinc-800 dark:border-zinc-100'
              : 'border-zinc-300 enabled:hover:border-zinc-400 dark:border-zinc-700 enabled:dark:hover:border-zinc-500'
          }`}
        >
          {muted ? (
            <VolumeX className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Volume2 className="h-5 w-5" aria-hidden="true" />
          )}
        </IconButton>
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
