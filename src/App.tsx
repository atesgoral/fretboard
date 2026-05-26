import { useEffect, useMemo, useState } from 'react'
import Fretboard from './components/Fretboard'
import ChordBrowser from './components/ChordBrowser'
import { buildChordRoles, CHORD_EXTENSIONS, CHORD_QUALITIES, NOTE_NAMES, type NoteName } from './components/chords'
import SettingsMenu from './components/controls/SettingsMenu'
import ChordPalette from './components/ChordPalette'
import { useThemePreference } from './hooks/useThemePreference'

const APP_PREFERENCES_STORAGE_KEY = 'fretboard-app-preferences'

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

type StoredPreferences = {
  linear?: boolean
  lowEAtBottom?: boolean
  naturalDecay?: boolean
  reverbEnabled?: boolean
  muted?: boolean
  root?: NoteName
  qualityId?: string
  extensionIds?: string[]
  swatches?: ChordSelection[]
  activeSwatchIndex?: number | null
}

const getInitialPreferences = (): StoredPreferences => {
  if (typeof window === 'undefined') return {}

  const raw = window.localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as StoredPreferences
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const initialPreferences = getInitialPreferences()

export default function App() {
  const [linear, setLinear] = useState(initialPreferences.linear ?? true)
  const [lowEAtBottom, setLowEAtBottom] = useState(initialPreferences.lowEAtBottom ?? true)
  const [naturalDecay, setNaturalDecay] = useState(initialPreferences.naturalDecay ?? true)
  const [reverbEnabled, setReverbEnabled] = useState(initialPreferences.reverbEnabled ?? true)
  const [muted, setMuted] = useState(initialPreferences.muted ?? false)
  const { preference, cyclePreference } = useThemePreference()
  const [root, setRoot] = useState<NoteName>(initialPreferences.root ?? 'C')
  const [qualityId, setQualityId] = useState(initialPreferences.qualityId ?? 'maj')
  const [extensionIds, setExtensionIds] = useState<string[]>(initialPreferences.extensionIds ?? [])
  const [swatches, setSwatches] = useState<Array<{ root: NoteName; qualityId: string; extensionIds: string[] }>>(initialPreferences.swatches ?? [])
  const [activeSwatchIndex, setActiveSwatchIndex] = useState<number | null>(initialPreferences.activeSwatchIndex ?? null)
  const [playedPositions, setPlayedPositions] = useState<PlayedPosition[]>([])
  const [playSequence, setPlaySequence] = useState(0)

  useEffect(() => {
    window.localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        linear,
        lowEAtBottom,
        naturalDecay,
        reverbEnabled,
        muted,
        root,
        qualityId,
        extensionIds,
        swatches,
        activeSwatchIndex,
      } satisfies StoredPreferences),
    )
  }, [linear, lowEAtBottom, naturalDecay, reverbEnabled, muted, root, qualityId, extensionIds, swatches, activeSwatchIndex])

  const selectedChord = useMemo(() => ({ root, qualityId, extensionIds }), [root, qualityId, extensionIds])
  const chordRoles = buildChordRoles(root, qualityId, extensionIds)

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900 transition-colors sm:px-8 dark:bg-zinc-900 dark:text-zinc-100">
      <section className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">Fretboard</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={muted ? 'Unmute playback' : 'Mute playback'}
              onClick={() => setMuted((current) => !current)}
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
              onToggleLinear={() => setLinear((current) => !current)}
              lowEAtBottom={lowEAtBottom}
              onToggleLowEPosition={() => setLowEAtBottom((current) => !current)}
              naturalDecay={naturalDecay}
              onToggleNaturalDecay={() => setNaturalDecay((current) => !current)}
              reverbEnabled={reverbEnabled}
              onToggleReverb={() => setReverbEnabled((current) => !current)}
            />
          </div>
        </div>

        <ChordBrowser
          root={root}
          qualityId={qualityId}
          extensionIds={extensionIds}
          onRootChange={(next) => {
            setRoot(next)
            if (activeSwatchIndex !== null) {
              setSwatches((current) => current.map((swatch, index) => (index === activeSwatchIndex ? { ...swatch, root: next } : swatch)))
            }
          }}
          onQualityChange={(next) => {
            setQualityId(next)
            if (activeSwatchIndex !== null) {
              setSwatches((current) => current.map((swatch, index) => (index === activeSwatchIndex ? { ...swatch, qualityId: next } : swatch)))
            }
          }}
          onExtensionsChange={(ids) => {
            setExtensionIds(ids)
            if (activeSwatchIndex !== null) {
              setSwatches((current) => current.map((swatch, index) => (index === activeSwatchIndex ? { ...swatch, extensionIds: ids } : swatch)))
            }
          }}
          onToggleExtension={(id) => {
            setExtensionIds((current) => {
              const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
              if (activeSwatchIndex !== null) {
                setSwatches((swatchesCurrent) =>
                  swatchesCurrent.map((swatch, index) => (index === activeSwatchIndex ? { ...swatch, extensionIds: next } : swatch)),
                )
              }
              return next
            })
          }}
        />

        <ChordPalette
          selectedChord={selectedChord}
          swatches={swatches}
          activeSwatchIndex={activeSwatchIndex}
          onAddSwatch={() => {
            setSwatches((current) => [...current, { ...selectedChord, extensionIds: [...selectedChord.extensionIds] }])
            setActiveSwatchIndex(swatches.length)
          }}
          onSelectCurrentChord={() => {
            setActiveSwatchIndex(null)
          }}
          onSelectSwatch={(index) => {
            const swatch = swatches[index]
            if (!swatch) return
            setRoot(swatch.root)
            setQualityId(swatch.qualityId)
            setExtensionIds(swatch.extensionIds)
            setActiveSwatchIndex(index)
          }}
          onRemoveSwatch={(index) => {
            setSwatches((current) => current.filter((_, currentIndex) => currentIndex !== index))
            setActiveSwatchIndex((currentIndex) => {
              if (currentIndex === null) return currentIndex
              if (currentIndex === index) return null
              if (currentIndex > index) return currentIndex - 1
              return currentIndex
            })
          }}
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
