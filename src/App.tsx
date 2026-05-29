import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import Fretboard from './components/Fretboard'
import {
  DEFAULT_CHORD_PLAYBACK_SETTINGS,
  resolveChordPlaybackSettings,
  type ChordPlaybackMode,
  type ChordPlaybackSettings,
  type ChordPlaybackSettingsOverride,
} from './components/chordPlayback'
import ChordBrowser from './components/ChordBrowser'
import DiatonicChordList from './components/DiatonicChordList'
import PinnedChordList from './components/PinnedChordList'
import type { PinnedChord } from './components/PinnedChordList'
import { buildChordRoles } from './components/chords'
import { buildScaleRoles } from './components/scales'
import AppHeader from './components/AppHeader'
import type { ChordSelection } from './components/chordSearch'
import { buildCommonVoicing, getChordPitchClasses } from './components/voicing'
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
  const { linear, lowEAtBottom, naturalDecay, reverbEnabled, muted, scaleRoot, scaleId } =
    appState.preferences
  const [showScaleNotes, setShowScaleNotes] = useState(true)
  const [showChordNotes, setShowChordNotes] = useState(true)
  const [playedPositions, setPlayedPositions] = useState<PlayedPosition[]>([])
  const [playSequence, setPlaySequence] = useState(0)
  const [activeChordPlaybackMode, setActiveChordPlaybackMode] = useState<ChordPlaybackMode>('pluck')
  const [auditionSettings, setAuditionSettings] = useState<ChordPlaybackSettings>(
    DEFAULT_CHORD_PLAYBACK_SETTINGS,
  )
  const [highlightedPitchClasses, setHighlightedPitchClasses] = useState<number[]>([])
  const [highlightedPositions, setHighlightedPositions] = useState<PlayedPosition[]>([])
  const [highlightedChordRoles, setHighlightedChordRoles] = useState<Map<number, string>>(
    () => new Map(),
  )

  usePersistAppPreferences(appState)

  const clearChordHighlights = useCallback(() => {
    setHighlightedPitchClasses([])
    setHighlightedPositions([])
    setHighlightedChordRoles(new Map())
  }, [])

  useEffect(() => {
    if (!showChordNotes) {
      clearChordHighlights()
    }
  }, [clearChordHighlights, showChordNotes])

  const markedNotes = useMemo(
    () =>
      showScaleNotes && scaleRoot ? buildScaleRoles(scaleRoot, scaleId) : new Map<number, string>(),
    [scaleRoot, scaleId, showScaleNotes],
  )

  const handlePlayChord = useCallback(
    (chord: ChordSelection, playbackSettings: ChordPlaybackSettings = auditionSettings) => {
      setActiveChordPlaybackMode(playbackSettings.playbackMode)
      setPlayedPositions(getVoicingForPlaybackSettings(chord, playbackSettings))
      setPlaySequence((current) => current + 1)
    },
    [auditionSettings],
  )

  const getVoicingForPlaybackSettings = (
    chord: ChordSelection,
    playbackSettings: ChordPlaybackSettings,
  ) =>
    buildCommonVoicing(chord, {
      positionPreference: playbackSettings.positionPreference,
      inversionPreference: playbackSettings.inversionPreference,
    })

  const handlePreviewChordVoicing = useCallback(
    (chord: ChordSelection, playbackSettings: ChordPlaybackSettings = auditionSettings) => {
      if (!showChordNotes) {
        clearChordHighlights()
        return
      }
      setHighlightedPitchClasses([])
      setHighlightedPositions(getVoicingForPlaybackSettings(chord, playbackSettings))
      setHighlightedChordRoles(buildChordRoles(chord.root, chord.qualityId, chord.extensionIds))
    },
    [auditionSettings, clearChordHighlights, showChordNotes],
  )

  const handlePlayPinnedChord = useCallback(
    (chord: PinnedChord) => {
      const playbackSettings = resolveChordPlaybackSettings(
        chord.playbackSettings,
        auditionSettings,
      )
      setActiveChordPlaybackMode(playbackSettings.playbackMode)
      setPlayedPositions(getVoicingForPlaybackSettings(chord, playbackSettings))
      setPlaySequence((current) => current + 1)
    },
    [auditionSettings],
  )

  const handlePreviewPinnedChordVoicing = useCallback(
    (chord: PinnedChord) => {
      const playbackSettings = resolveChordPlaybackSettings(
        chord.playbackSettings,
        auditionSettings,
      )
      handlePreviewChordVoicing(chord, playbackSettings)
    },
    [auditionSettings, handlePreviewChordVoicing],
  )

  const handleHoverChord = useCallback(
    (chord: ChordSelection | null) => {
      if (!showChordNotes) {
        clearChordHighlights()
        return
      }
      setHighlightedPositions([])
      setHighlightedPitchClasses(chord ? getChordPitchClasses(chord) : [])
      setHighlightedChordRoles(
        chord ? buildChordRoles(chord.root, chord.qualityId, chord.extensionIds) : new Map(),
      )
    },
    [clearChordHighlights, showChordNotes],
  )

  const { swatches: pinnedChords } = getCurrentTimelineState(appState)

  const handlePinChord = useCallback(
    (chord: ChordSelection, playbackSettings: ChordPlaybackSettings = auditionSettings) => {
      dispatch({ type: 'pinChord', chord, playbackSettings })
    },
    [auditionSettings],
  )

  const handleRemovePinnedChord = useCallback((index: number) => {
    dispatch({ type: 'removeSwatch', index })
  }, [])

  const handlePinnedChordPlaybackSettingsChange = useCallback(
    (index: number, playbackSettings: ChordPlaybackSettings | ChordPlaybackSettingsOverride) => {
      dispatch({ type: 'setPinnedChordPlaybackSettings', index, playbackSettings })
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
          naturalDecay={naturalDecay}
          reverbEnabled={reverbEnabled}
          onUndo={() => dispatch({ type: 'undo' })}
          onRedo={() => dispatch({ type: 'redo' })}
          onToggleMuted={() => dispatch({ type: 'toggleMuted' })}
          onCycleTheme={cyclePreference}
          onToggleNaturalDecay={() => dispatch({ type: 'toggleNaturalDecay' })}
          onToggleReverb={() => dispatch({ type: 'toggleReverb' })}
        />

        <ChordBrowser
          scaleRoot={scaleRoot}
          scaleId={scaleId}
          showScaleNotes={showScaleNotes}
          onScaleRootChange={(next) => dispatch({ type: 'setScaleRoot', scaleRoot: next })}
          onScaleIdChange={(next) => dispatch({ type: 'setScaleId', scaleId: next })}
          onToggleScaleNotes={() => setShowScaleNotes((current) => !current)}
        />

        {scaleRoot ? (
          <DiatonicChordList
            scaleRoot={scaleRoot}
            scaleId={scaleId}
            onPlayChord={handlePlayChord}
            onHoverChord={handleHoverChord}
            onPreviewChordVoicing={handlePreviewChordVoicing}
            onPinChord={handlePinChord}
            auditionSettings={auditionSettings}
            onAuditionSettingsChange={setAuditionSettings}
            showChordNotes={showChordNotes}
            onToggleChordNotes={() => setShowChordNotes((current) => !current)}
          />
        ) : null}

        <PinnedChordList
          pinnedChords={pinnedChords}
          onPlayChord={handlePlayPinnedChord}
          onHoverChord={handleHoverChord}
          onPreviewChordVoicing={handlePreviewPinnedChordVoicing}
          onRemoveChord={handleRemovePinnedChord}
          onPlaybackSettingsChange={handlePinnedChordPlaybackSettingsChange}
          auditionSettings={auditionSettings}
          onAuditionSettingsChange={setAuditionSettings}
          showChordNotes={showChordNotes}
          onToggleChordNotes={() => setShowChordNotes((current) => !current)}
        />

        <Fretboard
          linear={linear}
          lowEAtBottom={lowEAtBottom}
          onToggleLinear={() => dispatch({ type: 'toggleLinear' })}
          onToggleLowEPosition={() => dispatch({ type: 'toggleLowEAtBottom' })}
          naturalDecay={naturalDecay}
          reverbEnabled={reverbEnabled}
          muted={muted}
          markedNotes={markedNotes}
          highlightedPitchClasses={highlightedPitchClasses}
          highlightedPositions={highlightedPositions}
          highlightedChordRoles={highlightedChordRoles}
          playedPositions={playedPositions}
          playSequence={playSequence}
          playbackMode={activeChordPlaybackMode}
        />
      </section>
    </main>
  )
}
