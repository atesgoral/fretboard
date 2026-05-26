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
  onRemoveSwatch: (index: number) => void
  onPlayChord: (chord: ChordSelection) => void
}

function getChordLabel(chord: ChordSelection) {
  return getChordQueryForSelection(chord.root, chord.qualityId, chord.extensionIds)
}

function RemoveSwatchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Remove chord swatch"
      title="Remove chord swatch"
      onClick={onClick}
      className="absolute right-1 top-1 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 group-hover:flex dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:text-zinc-100"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </svg>
    </button>
  )
}

function PlaySwatchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Play chord swatch"
      title="Play chord swatch"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="absolute bottom-1 right-1 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 group-hover:flex dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:text-zinc-100"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 6v12l10-6-10-6Z" />
      </svg>
    </button>
  )
}

function ChordCard({ chord, active, onClick, onPlay, onRemove }: { chord: ChordSelection; active: boolean; onClick: () => void; onPlay: () => void; onRemove?: () => void }) {
  return (
    <div className="group relative h-24 w-24">
      <button
        type="button"
        title={`${active ? 'Selected' : 'Select'} chord ${getChordLabel(chord)}`}
        onClick={onClick}
        className={`flex h-full w-full cursor-pointer flex-col justify-between rounded-md border p-2 text-left transition ${
          active
            ? 'border-zinc-800 bg-zinc-800 text-zinc-100 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
            : 'border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-400'
        }`}
      >
        <span className="text-xs uppercase tracking-[0.12em]">{chord.root}</span>
        <span className="text-sm font-semibold leading-tight">{getChordLabel(chord)}</span>
      </button>
      <PlaySwatchButton onClick={onPlay} />
      {onRemove ? <RemoveSwatchButton onClick={onRemove} /> : null}
    </div>
  )
}

function AddSwatchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Add chord to swatch"
      title="Add chord to swatch"
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

export default function ChordPalette({ selectedChord, swatches, activeSwatchIndex, onAddSwatch, onSelectCurrentChord, onSelectSwatch, onRemoveSwatch, onPlayChord }: ChordPaletteProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <ChordCard chord={selectedChord} active={activeSwatchIndex === null} onClick={onSelectCurrentChord} onPlay={() => onPlayChord(selectedChord)} />
        <AddSwatchButton onClick={onAddSwatch} />
        {swatches.map((swatch, index) => (
          <ChordCard
            key={`${swatch.root}-${swatch.qualityId}-${swatch.extensionIds.join('-')}-${index}`}
            chord={swatch}
            active={activeSwatchIndex === index}
            onClick={() => { onSelectSwatch(index) }}
            onPlay={() => onPlayChord(swatch)}
            onRemove={() => onRemoveSwatch(index)}
          />
        ))}
      </div>
    </section>
  )
}
