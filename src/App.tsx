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
type VoicingMode = 'strum' | 'finger' | 'shell'
type DisplayMode = 'fretboard' | 'shape'
type BrowserMode = 'now' | 'build' | 'explore'

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

function buildCommonVoicing(chord: ChordSelection, voicingMode: VoicingMode, inversion: 0 | 1 | 2): PlayedPosition[] {
  const pitchClasses = getChordPitchClasses(chord)
  const playableFrets = voicingMode === 'strum' ? 6 : 9
  const positions = OPEN_STRING_MIDI.map((openMidi, stringIndex) => {
    const fret = Array.from({ length: 6 }, (_, index) => index).find((candidateFret) => pitchClasses.includes((openMidi + candidateFret) % 12))
    const boundedFret = Array.from({ length: playableFrets + 1 }, (_, index) => index).find((candidateFret) => pitchClasses.includes((openMidi + candidateFret) % 12))
    const selectedFret = voicingMode === 'strum' ? fret : boundedFret
    return selectedFret === undefined ? null : { stringIndex, fret: selectedFret }
  }).filter((position): position is PlayedPosition => position !== null)

  const filteredByMode = voicingMode === 'shell' ? positions.filter((position) => position.stringIndex >= 1 && position.stringIndex <= 4).slice(0, 3) : positions
  const inversionOffset = inversion % Math.max(filteredByMode.length, 1)
  const rotated = filteredByMode.slice(inversionOffset).concat(filteredByMode.slice(0, inversionOffset))

  if (voicingMode === 'finger') return rotated.slice(0, 4)
  if (voicingMode === 'shell') return rotated
  return rotated.length >= 4 ? rotated : rotated.slice(0, 3)
}

const initialPreferences = getInitialPreferences()

export default function App() {
  const [appState, dispatch] = useReducer(appReducer, initialPreferences, createInitialAppState)
  const { preference, cyclePreference } = useThemePreference()
  const { linear, lowEAtBottom, naturalDecay, reverbEnabled, muted } = appState.preferences
  const { root, qualityId, extensionIds, swatches, activeSwatchIndex } = getCurrentTimelineState(appState)
  const [playedPositions, setPlayedPositions] = useState<PlayedPosition[]>([])
  const [playSequence, setPlaySequence] = useState(0)
  const [voicingMode, setVoicingMode] = useState<VoicingMode>('strum')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('fretboard')
  const [inversion, setInversion] = useState<0 | 1 | 2>(0)
  const [browserMode, setBrowserMode] = useState<BrowserMode>('now')

  useEffect(() => {
    window.localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(toStoredPreferences(appState)))
  }, [appState])

  const selectedChord = useMemo(() => ({ root, qualityId, extensionIds }), [root, qualityId, extensionIds])
  const chordRoles = buildChordRoles(root, qualityId, extensionIds)
  const focusedVoicing = useMemo(() => buildCommonVoicing(selectedChord, voicingMode, inversion), [selectedChord, voicingMode, inversion])

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


        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <span className="px-2 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">Workspace</span>
          {[
            { id: 'now', label: 'Now', title: 'Focus on fretboard with minimal controls' },
            { id: 'build', label: 'Build', title: 'Build a specific chord' },
            { id: 'explore', label: 'Explore', title: 'Browse in-key chord options' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              title={mode.title}
              onClick={() => setBrowserMode(mode.id as BrowserMode)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm transition ${
                browserMode === mode.id
                  ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <ChordBrowser
          root={root}
          qualityId={qualityId}
          extensionIds={extensionIds}
          onRootChange={(next) => dispatch({ type: 'setRoot', root: next })}
          onQualityChange={(next) => dispatch({ type: 'setQuality', qualityId: next })}
          onExtensionsChange={(ids) => dispatch({ type: 'setExtensions', extensionIds: ids })}
          onToggleExtension={(id) => dispatch({ type: 'toggleExtension', extensionId: id })}
          onAddChordToPalette={(chord) => dispatch({ type: 'addSwatchChord', chord })}
          onPlayChord={(chord) => {
            setPlayedPositions(buildCommonVoicing(chord, voicingMode, inversion))
            setPlaySequence((current) => current + 1)
          }}
          voicingMode={voicingMode}
          onVoicingModeChange={setVoicingMode}
          inversion={inversion}
          onInversionChange={setInversion}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          mode={browserMode}
        />

        {browserMode !== 'now' ? <ChordPalette
          selectedChord={selectedChord}
          swatches={swatches}
          activeSwatchIndex={activeSwatchIndex}
          onAddSwatch={() => dispatch({ type: 'addSwatch' })}
          onSelectCurrentChord={() => dispatch({ type: 'selectCurrentChord' })}
          onSelectSwatch={(index) => dispatch({ type: 'selectSwatch', index })}
          onRemoveSwatch={(index) => dispatch({ type: 'removeSwatch', index })}
          onPlayChord={(chord) => {
            setPlayedPositions(buildCommonVoicing(chord, voicingMode, inversion))
            setPlaySequence((current) => current + 1)
          }}
        /> : null}

        <Fretboard
          linear={linear}
          lowEAtBottom={lowEAtBottom}
          naturalDecay={naturalDecay}
          reverbEnabled={reverbEnabled}
          muted={muted}
          chordRoles={displayMode === 'shape' ? new Map() : chordRoles}
          playedPositions={displayMode === 'shape' ? focusedVoicing : playedPositions}
          playSequence={playSequence}
        />
      </section>
    </main>
  )
}
