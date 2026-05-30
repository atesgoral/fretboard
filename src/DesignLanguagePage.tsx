import { useEffect } from 'react'
import Fretboard from './components/Fretboard'

const accentMarkedNotes = new Map<number, string>([
  [0, '1'],
  [2, '2'],
  [4, '3'],
  [5, '4'],
  [7, '5'],
  [9, '6'],
  [11, '7'],
])

const accentHighlightedPitchClasses = [1, 3, 6, 8, 10]

const accentHighlightedChordRoles = new Map<number, string>([
  [1, 'R'],
  [3, 'm3'],
  [6, '5'],
  [8, 'b7'],
  [10, '9'],
])

const accentPlayedPositions = [
  { stringIndex: 0, fret: 3 },
  { stringIndex: 1, fret: 2 },
  { stringIndex: 2, fret: 0 },
  { stringIndex: 3, fret: 0 },
]

function ThemePane({ dark }: { dark: boolean }) {
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {dark ? 'Dark mode' : 'Light mode'}
          </h1>
          <span className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
            /design-language
          </span>
        </div>

        <Fretboard
          linear
          lowEAtBottom
          showLastPlayedNotes
          onToggleLinear={() => undefined}
          onToggleLowEPosition={() => undefined}
          onToggleShowLastPlayedNotes={() => undefined}
          naturalDecay
          reverbEnabled
          muted
          frets={8}
          markedNotes={accentMarkedNotes}
          highlightedPitchClasses={accentHighlightedPitchClasses}
          highlightedChordRoles={accentHighlightedChordRoles}
          playedPositions={accentPlayedPositions}
          playSequence={1}
        />
      </div>
    </div>
  )
}

export default function DesignLanguagePage() {
  useEffect(() => {
    const root = document.documentElement
    const hadDarkClass = root.classList.contains('dark')
    root.classList.remove('dark')

    return () => {
      if (hadDarkClass) {
        root.classList.add('dark')
      }
    }
  }, [])

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <ThemePane dark={false} />
      <ThemePane dark />
    </main>
  )
}
