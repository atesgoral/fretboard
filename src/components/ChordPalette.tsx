import { type NoteName } from './chords'
import { getChordQueryForSelection } from './chordSearch'

type ChordSelection = {
  root: NoteName
  qualityId: string
  extensionIds: string[]
}

type ChordPaletteProps = {
  selectedChord: ChordSelection
  swatches: ChordSelection[]
  activeSwatchIndex: number | null
  onAddSwatch: () => void
  onSelectCurrentChord: () => void
  onSelectSwatch: (index: number) => void
}

function getChordLabel(chord: ChordSelection) {
  return getChordQueryForSelection(chord.root, chord.qualityId, chord.extensionIds)
}

function ChordCard({ chord, active, onClick }: { chord: ChordSelection; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-24 w-24 cursor-pointer flex-col justify-between rounded-md border p-2 text-left transition ${
        active
          ? 'border-zinc-800 bg-zinc-800 text-zinc-100 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
          : 'border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-400'
      }`}
    >
      <span className="text-xs uppercase tracking-[0.12em]">{chord.root}</span>
      <span className="text-sm font-semibold leading-tight">{getChordLabel(chord)}</span>
    </button>
  )
}

function AddSwatchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Add chord to swatch"
      onClick={onClick}
      className="flex h-24 w-14 cursor-pointer items-center justify-center rounded-md border border-dashed border-zinc-400 bg-white text-zinc-700 transition hover:border-zinc-600 hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:text-zinc-100"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </button>
  )
}

export default function ChordPalette({ selectedChord, swatches, activeSwatchIndex, onAddSwatch, onSelectCurrentChord, onSelectSwatch }: ChordPaletteProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <ChordCard chord={selectedChord} active={activeSwatchIndex === null} onClick={onSelectCurrentChord} />
        <AddSwatchButton onClick={onAddSwatch} />
        {swatches.map((swatch, index) => (
          <ChordCard key={`${swatch.root}-${swatch.qualityId}-${swatch.extensionIds.join('-')}-${index}`} chord={swatch} active={activeSwatchIndex === index} onClick={() => onSelectSwatch(index)} />
        ))}
      </div>
    </section>
  )
}
