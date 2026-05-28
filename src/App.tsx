import { useCallback, useMemo, useReducer, useState } from 'react'
import Fretboard from './components/Fretboard'
import ChordBrowser, { type ScaleRootSelection } from './components/ChordBrowser'
import DiatonicChordList from './components/DiatonicChordList'
import PinnedChordList from './components/PinnedChordList'
import type { ChordPlayback, PinnedChord } from './components/chordPlayback'
import { buildScaleRoles, type ScaleId } from './components/scales'
import AppHeader from './components/AppHeader'
import type { ChordSelection } from './components/chordSearch'
import { buildChordVoicing, getChordPitchClasses } from './components/voicing'
import type { PlayedPosition } from './components/voicing'
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
  const [scaleRoot, setScaleRoot] = useState<ScaleRootSelection>(null)
  const [scaleId, setScaleId] = useState<ScaleId>('major')
  const [playedPositions, setPlayedPositions] = useState<PlayedPosition[]>([])
  const [playStyle, setPlayStyle] = useState<PinnedChord['style']>('finger')
  const [playSequence, setPlaySequence] = useState(0)
  const [highlightedPitchClasses, setHighlightedPitchClasses] = useState<number[]>([])

  usePersistAppPreferences(appState)

  const markedNotes = useMemo(
    () => (scaleRoot ? buildScaleRoles(scaleRoot, scaleId) : new Map<number, string>()),
    [scaleRoot, scaleId],
  )

  const playChord = useCallback((chord: ChordSelection, playback?: ChordPlayback) => {
    setPlayedPositions(buildChordVoicing(chord, playback))
    setPlayStyle(playback?.style ?? 'finger')
    setPlaySequence((current) => current + 1)
  }, [])

  const handlePlayChord = useCallback(
    (chord: ChordSelection) => {
      playChord(chord)
    },
    [playChord],
  )

  const handlePlayPinnedChord = useCallback(
    (chord: PinnedChord) => {
      playChord(chord, chord)
    },
    [playChord],
  )

  const handleHoverChord = useCallback((chord: ChordSelection | null) => {
    setHighlightedPitchClasses(chord ? getChordPitchClasses(chord) : [])
  }, [])

  const { swatches: pinnedChords } = getCurrentTimelineState(appState)

  const handlePinChord = useCallback((chord: ChordSelection) => {
    dispatch({ type: 'pinChord', chord })
  }, [])

  const handleRemovePinnedChord = useCallback((index: number) => {
    dispatch({ type: 'removeSwatch', index })
  }, [])

  const handlePinnedPlaybackChange = useCallback(
    (index: number, playback: Partial<ChordPlayback>) => {
      dispatch({ type: 'updateSwatchPlayback', index, playback })
    },
    [],
  )

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
          scaleRoot={scaleRoot}
          scaleId={scaleId}
          onScaleRootChange={setScaleRoot}
          onScaleIdChange={setScaleId}
        />

        {scaleRoot ? (
          <DiatonicChordList
            scaleRoot={scaleRoot}
            scaleId={scaleId}
            onPlayChord={handlePlayChord}
            onHoverChord={handleHoverChord}
            onPinChord={handlePinChord}
          />
        ) : null}

        <PinnedChordList
          pinnedChords={pinnedChords}
          onPlayChord={handlePlayPinnedChord}
          onHoverChord={handleHoverChord}
          onRemoveChord={handleRemovePinnedChord}
          onPlaybackChange={handlePinnedPlaybackChange}
        />

        <Fretboard
          linear={linear}
          lowEAtBottom={lowEAtBottom}
          naturalDecay={naturalDecay}
          reverbEnabled={reverbEnabled}
          muted={muted}
          markedNotes={markedNotes}
          highlightedPitchClasses={highlightedPitchClasses}
          playedPositions={playedPositions}
          playSequence={playSequence}
          playStyle={playStyle}
        />
      </section>
    </main>
  )
}
