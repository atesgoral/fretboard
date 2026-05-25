import { useState } from 'react'
import { Ruler, Waves } from 'lucide-react'
import Fretboard from './components/Fretboard'

export default function App() {
  const [linear, setLinear] = useState(false)

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900 sm:px-8">
      <section className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500">Fretboard</h1>
          <button
            type="button"
            onClick={() => setLinear((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400"
            aria-label="Toggle fret spacing"
          >
            {linear ? <Ruler className="h-4 w-4" aria-hidden="true" /> : <Waves className="h-4 w-4" aria-hidden="true" />}
            {linear ? 'Linear spacing' : 'Realistic spacing'}
          </button>
        </div>

        <Fretboard linear={linear} />
      </section>
    </main>
  )
}
