import { useEffect, useMemo, useReducer, useState } from 'react'
import Fretboard from './components/Fretboard'
import ChordBrowser from './components/ChordBrowser'
import SettingsMenu from './components/controls/SettingsMenu'
import { buildScaleRoles, type ScaleId } from './components/scales'
import { useThemePreference } from './hooks/useThemePreference'
import {
  APP_PREFERENCES_STORAGE_KEY,
  appReducer,
  createInitialAppState,
  getCurrentTimelineState,
  getInitialPreferences,
  toStoredPreferences,
} from './state/appState'

const initialPreferences = getInitialPreferences()

export default function App() {
  const [appState, dispatch] = useReducer(appReducer, initialPreferences, createInitialAppState)
  const { preference, cyclePreference } = useThemePreference()
  const { linear, lowEAtBottom, naturalDecay, reverbEnabled, muted } = appState.preferences
  const { root } = getCurrentTimelineState(appState)
  const [scaleId, setScaleId] = useState<ScaleId>('major')

  useEffect(() => {
    window.localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(toStoredPreferences(appState)))
  }, [appState])

  const markedNotes = useMemo(() => buildScaleRoles(root, scaleId), [root, scaleId])

  const canUndo = appState.timeline.currentIndex > 0
  const canRedo = appState.timeline.currentIndex < appState.timeline.snapshots.length - 1

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900 transition-colors sm:px-8 dark:bg-zinc-900 dark:text-zinc-100">
      <section className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">Fretboard</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Undo chord changes"
              title="Undo chord changes"
              onClick={() => dispatch({ type: 'undo' })}
              disabled={!canUndo}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
                <path d="M9 7 4 12l5 5" />
                <path d="M4 12h8a6 6 0 0 1 6 6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Redo chord changes"
              title="Redo chord changes"
              onClick={() => dispatch({ type: 'redo' })}
              disabled={!canRedo}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
                <path d="m15 7 5 5-5 5" />
                <path d="M20 12h-8a6 6 0 0 0-6 6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={muted ? 'Unmute playback' : 'Mute playback'}
              title={muted ? 'Unmute playback' : 'Mute playback'}
              onClick={() => dispatch({ type: 'toggleMuted' })}
              className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-white text-zinc-700 transition dark:bg-zinc-800 dark:text-zinc-100 ${
                muted
                  ? 'border-zinc-800 dark:border-zinc-100'
                  : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
                <path d="M5 14v-4h4l5-4v12l-5-4H5Z" />
                {muted ? <path d="m4 4 16 16" /> : null}
              </svg>
            </button>
            <SettingsMenu
              preference={preference}
              onCycleTheme={cyclePreference}
              linear={linear}
              onToggleLinear={() => dispatch({ type: 'toggleLinear' })}
              lowEAtBottom={lowEAtBottom}
              onToggleLowEPosition={() => dispatch({ type: 'toggleLowEAtBottom' })}
              naturalDecay={naturalDecay}
              onToggleNaturalDecay={() => dispatch({ type: 'toggleNaturalDecay' })}
              reverbEnabled={reverbEnabled}
              onToggleReverb={() => dispatch({ type: 'toggleReverb' })}
            />
          </div>
        </div>


        <ChordBrowser
          scaleRoot={root}
          scaleId={scaleId}
          onScaleRootChange={(next) => dispatch({ type: 'setRoot', root: next })}
          onScaleIdChange={setScaleId}
        />

        <Fretboard
          linear={linear}
          lowEAtBottom={lowEAtBottom}
          naturalDecay={naturalDecay}
          reverbEnabled={reverbEnabled}
          muted={muted}
          markedNotes={markedNotes}
          playedPositions={[]}
          playSequence={0}
        />
      </section>
    </main>
  )
}
