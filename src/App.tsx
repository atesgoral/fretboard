import { useEffect, useMemo, useReducer, useState } from 'react'
import Fretboard from './components/Fretboard'
import ChordBrowser from './components/ChordBrowser'
import { buildChordRoles, CHORD_EXTENSIONS, CHORD_QUALITIES, NOTE_NAMES, type NoteName } from './components/chords'
import SettingsMenu from './components/controls/SettingsMenu'
import ChordPalette from './components/ChordPalette'
import { useThemePreference } from './hooks/useThemePreference'
import {
  APP_PREFERENCES_STORAGE_KEY,
  appReducer,
  createInitialAppState,
  getCurrentTimelineState,
  getInitialPreferences,
  toStoredPreferences,
} from './state/appState'
type ChordSelection = { root: NoteName; qualityId: string; extensionIds: string[] }
type PlayedPosition = { stringIndex: number; fret: number }

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]

function getChordPitchClasses(chord: ChordSelection) {
  const rootIndex = NOTE_NAMES.indexOf(chord.root)
  const quality = CHORD_QUALITIES.find((item) => item.id === chord.qualityId) ?? CHORD_QUALITIES[0]
  const intervals = [...quality.intervals]
  chord.extensionIds.forEach((id) => {
    const extension = CHORD_EXTENSIONS.find((item) => item.id === id)
    if (extension) {
      intervals.push(extension.interval)
    }
  })

  return Array.from(new Set(intervals.map((interval) => (rootIndex + interval) % 12)))
}

function buildCommonVoicing(chord: ChordSelection): PlayedPosition[] {
  const pitchClasses = getChordPitchClasses(chord)
  const positions = OPEN_STRING_MIDI.map((openMidi, stringIndex) => {
    const fret = Array.from({ length: 6 }, (_, index) => index).find((candidateFret) => pitchClasses.includes((openMidi + candidateFret) % 12))
    return fret === undefined ? null : { stringIndex, fret }
  }).filter((position): position is PlayedPosition => position !== null)

  return positions.length >= 4 ? positions : positions.slice(0, 3)
}

const initialPreferences = getInitialPreferences()

export default function App() {
  const [appState, dispatch] = useReducer(appReducer, initialPreferences, createInitialAppState)
  const { preference, cyclePreference } = useThemePreference()
  const { linear, lowEAtBottom, naturalDecay, reverbEnabled, muted } = appState.preferences
  const { root, qualityId, extensionIds, swatches, activeSwatchIndex } = getCurrentTimelineState(appState)
  const [playedPositions, setPlayedPositions] = useState<PlayedPosition[]>([])
  const [playSequence, setPlaySequence] = useState(0)

  useEffect(() => {
    window.localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(toStoredPreferences(appState)))
  }, [appState])

  const selectedChord = useMemo(() => ({ root, qualityId, extensionIds }), [root, qualityId, extensionIds])
  const chordRoles = buildChordRoles(root, qualityId, extensionIds)

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
          root={root}
          qualityId={qualityId}
          extensionIds={extensionIds}
          onRootChange={(next) => dispatch({ type: 'setRoot', root: next })}
          onQualityChange={(next) => dispatch({ type: 'setQuality', qualityId: next })}
          onExtensionsChange={(ids) => dispatch({ type: 'setExtensions', extensionIds: ids })}
          onToggleExtension={(id) => dispatch({ type: 'toggleExtension', extensionId: id })}
        />

        <ChordPalette
          selectedChord={selectedChord}
          swatches={swatches}
          activeSwatchIndex={activeSwatchIndex}
          onAddSwatch={() => dispatch({ type: 'addSwatch' })}
          onSelectCurrentChord={() => dispatch({ type: 'selectCurrentChord' })}
          onSelectSwatch={(index) => dispatch({ type: 'selectSwatch', index })}
          onRemoveSwatch={(index) => dispatch({ type: 'removeSwatch', index })}
          onPlayChord={(chord) => {
            setPlayedPositions(buildCommonVoicing(chord))
            setPlaySequence((current) => current + 1)
          }}
        />

        <Fretboard
          linear={linear}
          lowEAtBottom={lowEAtBottom}
          naturalDecay={naturalDecay}
          reverbEnabled={reverbEnabled}
          muted={muted}
          chordRoles={chordRoles}
          playedPositions={playedPositions}
          playSequence={playSequence}
        />
      </section>
    </main>
  )
}
