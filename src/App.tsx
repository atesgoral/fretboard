import { useMemo, useReducer, useState } from 'react'
import Fretboard from './components/Fretboard'
import ChordBrowser from './components/ChordBrowser'
import { buildScaleRoles, type ScaleId } from './components/scales'
import AppHeader from './components/AppHeader'
import { useThemePreference } from './hooks/useThemePreference'
import { usePersistAppPreferences } from './hooks/usePersistAppPreferences'
import {
  appReducer,
  createInitialAppState,
  getCurrentTimelineState,
  getInitialPreferences,
} from './state/appState'

const initialPreferences = getInitialPreferences()

export default function App() {
  const [appState, dispatch] = useReducer(appReducer, initialPreferences, createInitialAppState)
  const { preference, cyclePreference } = useThemePreference()
  const { linear, lowEAtBottom, naturalDecay, reverbEnabled, muted } = appState.preferences
  const { root } = getCurrentTimelineState(appState)
  const [scaleId, setScaleId] = useState<ScaleId>('major')

  usePersistAppPreferences(appState)

  const markedNotes = useMemo(() => buildScaleRoles(root, scaleId), [root, scaleId])

  const canUndo = appState.timeline.currentIndex > 0
  const canRedo = appState.timeline.currentIndex < appState.timeline.snapshots.length - 1

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900 transition-colors sm:px-8 dark:bg-zinc-900 dark:text-zinc-100">
      <section className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4">
        <AppHeader
          canUndo={canUndo}
          canRedo={canRedo}
          muted={muted}
          preference={preference}
          linear={linear}
          lowEAtBottom={lowEAtBottom}
          naturalDecay={naturalDecay}
          reverbEnabled={reverbEnabled}
          onUndo={() => dispatch({ type: 'undo' })}
          onRedo={() => dispatch({ type: 'redo' })}
          onToggleMuted={() => dispatch({ type: 'toggleMuted' })}
          onCycleTheme={cyclePreference}
          onToggleLinear={() => dispatch({ type: 'toggleLinear' })}
          onToggleLowEPosition={() => dispatch({ type: 'toggleLowEAtBottom' })}
          onToggleNaturalDecay={() => dispatch({ type: 'toggleNaturalDecay' })}
          onToggleReverb={() => dispatch({ type: 'toggleReverb' })}
        />

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
