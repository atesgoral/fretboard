import { useEffect, useMemo, useState } from 'react'
import Fretboard from './components/Fretboard'
import ChordBrowser from './components/ChordBrowser'
import { buildChordRoles, type NoteName } from './components/chords'
import SettingsMenu from './components/controls/SettingsMenu'
import ChordPalette from './components/ChordPalette'
import { useThemePreference } from './hooks/useThemePreference'

const APP_PREFERENCES_STORAGE_KEY = 'fretboard-app-preferences'

type ChordSelection = { root: NoteName; qualityId: string; extensionIds: string[] }

type StoredPreferences = {
  linear?: boolean
  lowEAtBottom?: boolean
  naturalDecay?: boolean
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
  const { preference, cyclePreference } = useThemePreference()
  const [root, setRoot] = useState<NoteName>(initialPreferences.root ?? 'C')
  const [qualityId, setQualityId] = useState(initialPreferences.qualityId ?? 'maj')
  const [extensionIds, setExtensionIds] = useState<string[]>(initialPreferences.extensionIds ?? [])
  const [swatches, setSwatches] = useState<Array<{ root: NoteName; qualityId: string; extensionIds: string[] }>>(initialPreferences.swatches ?? [])
  const [activeSwatchIndex, setActiveSwatchIndex] = useState<number | null>(initialPreferences.activeSwatchIndex ?? null)

  useEffect(() => {
    window.localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        linear,
        lowEAtBottom,
        naturalDecay,
        root,
        qualityId,
        extensionIds,
        swatches,
        activeSwatchIndex,
      } satisfies StoredPreferences),
    )
  }, [linear, lowEAtBottom, naturalDecay, root, qualityId, extensionIds, swatches, activeSwatchIndex])

  const selectedChord = useMemo(() => ({ root, qualityId, extensionIds }), [root, qualityId, extensionIds])
  const chordRoles = buildChordRoles(root, qualityId, extensionIds)

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900 transition-colors sm:px-8 dark:bg-zinc-900 dark:text-zinc-100">
      <section className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">Fretboard</h1>
          <SettingsMenu
            preference={preference}
            onCycleTheme={cyclePreference}
            linear={linear}
            onToggleLinear={() => setLinear((current) => !current)}
            lowEAtBottom={lowEAtBottom}
            onToggleLowEPosition={() => setLowEAtBottom((current) => !current)}
            naturalDecay={naturalDecay}
            onToggleNaturalDecay={() => setNaturalDecay((current) => !current)}
          />
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
        />

        <Fretboard linear={linear} lowEAtBottom={lowEAtBottom} naturalDecay={naturalDecay} chordRoles={chordRoles} />
      </section>
    </main>
  )
}
