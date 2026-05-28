import type { ChordSelection } from './chordSearch'
import ChordCard from './ChordCard'
import { getChordSelectionKey } from './chordSelection'

type PinnedChordListProps = {
  pinnedChords: ChordSelection[]
  onPlayChord: (chord: ChordSelection) => void
  onHoverChord: (chord: ChordSelection | null) => void
  onRemoveChord: (index: number) => void
}

export default function PinnedChordList({
  pinnedChords,
  onPlayChord,
  onHoverChord,
  onRemoveChord,
}: PinnedChordListProps) {
  if (pinnedChords.length === 0) {
    return null
  }

  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return
    }
    onHoverChord(null)
  }

  return (
    <section
      className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      onPointerLeave={handlePointerLeave}
    >
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
        Pinned chords
      </h2>
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {pinnedChords.map((chord, index) => (
          <ChordCard
            key={getChordSelectionKey(chord, index)}
            chord={chord}
            onPlay={() => onPlayChord(chord)}
            onHoverStart={() => onHoverChord(chord)}
            onRemove={() => onRemoveChord(index)}
          />
        ))}
      </div>
    </section>
  )
}
