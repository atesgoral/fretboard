import { ArrowRight } from 'lucide-react'
import ChordCard from './ChordCard'
import type { ChordSelection } from './chordSearch'

type ChordPaletteProps = {
  selectedChord: ChordSelection
  swatches: ChordSelection[]
  activeSwatchIndex: number | null
  onAddSwatch: () => void
  onSelectCurrentChord: () => void
  onSelectSwatch: (index: number) => void
  onRemoveSwatch: (index: number) => void
  onPlayChord: (chord: ChordSelection) => void
}

function AddSwatchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Add chord to swatch"
      title="Add chord to swatch"
      onClick={onClick}
      className="flex h-24 w-14 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-zinc-400 bg-white text-zinc-700 transition hover:border-zinc-600 hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:text-zinc-100"
    >
      <ArrowRight className="h-6 w-6" aria-hidden="true" />
    </button>
  )
}

export default function ChordPalette({
  selectedChord,
  swatches,
  activeSwatchIndex,
  onAddSwatch,
  onSelectCurrentChord,
  onSelectSwatch,
  onRemoveSwatch,
  onPlayChord,
}: ChordPaletteProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <ChordCard
          chord={selectedChord}
          active={activeSwatchIndex === null}
          onSelect={onSelectCurrentChord}
          onPlay={() => onPlayChord(selectedChord)}
        />
        <AddSwatchButton onClick={onAddSwatch} />
        {swatches.map((swatch, index) => (
          <ChordCard
            key={`${swatch.root}-${swatch.qualityId}-${swatch.extensionIds.join('-')}-${index}`}
            chord={swatch}
            active={activeSwatchIndex === index}
            onSelect={() => onSelectSwatch(index)}
            onPlay={() => onPlayChord(swatch)}
            onRemove={() => onRemoveSwatch(index)}
          />
        ))}
      </div>
    </section>
  )
}
