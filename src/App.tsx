import { useState } from 'react'
import Fretboard from './components/Fretboard'
import SpacingToggleButton from './components/controls/SpacingToggleButton'
import ThemeToggleButton from './components/controls/ThemeToggleButton'
import { useThemePreference } from './hooks/useThemePreference'

export default function App() {
  const [linear, setLinear] = useState(false)
  const { preference, cyclePreference } = useThemePreference()

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900 transition-colors sm:px-8 dark:bg-zinc-900 dark:text-zinc-100">
      <section className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">Fretboard</h1>
          <div className="flex items-center gap-2">
            <ThemeToggleButton preference={preference} onToggle={cyclePreference} />
            <SpacingToggleButton linear={linear} onToggle={() => setLinear((current) => !current)} />
          </div>
        </div>

        <Fretboard linear={linear} />
      </section>
    </main>
  )
}
