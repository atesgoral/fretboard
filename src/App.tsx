import { useState } from 'react'
import Fretboard from './components/Fretboard'
import ChordBrowser from './components/ChordBrowser'
import { buildChordRoles, type NoteName } from './components/chords'
import SettingsMenu from './components/controls/SettingsMenu'
import { useThemePreference } from './hooks/useThemePreference'

export default function App() {
  const [linear, setLinear] = useState(false)
  const [lowEAtBottom, setLowEAtBottom] = useState(true)
  const [naturalDecay, setNaturalDecay] = useState(true)
  const { preference, cyclePreference } = useThemePreference()
  const [root, setRoot] = useState<NoteName>('C')
  const [qualityId, setQualityId] = useState('maj')
  const [extensionIds, setExtensionIds] = useState<string[]>([])

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
          onRootChange={setRoot}
          onQualityChange={setQualityId}
          onToggleExtension={(id) =>
            setExtensionIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
          }
        />

        <Fretboard linear={linear} lowEAtBottom={lowEAtBottom} naturalDecay={naturalDecay} chordRoles={chordRoles} />
      </section>
    </main>
  )
}
