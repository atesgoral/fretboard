import type { ChordPlayback, PinnedChord } from './chordPlayback'
import { getChordSelectionKey } from './chordSelection'
import PinnedChordCard from './PinnedChordCard'

type PinnedChordListProps = {
  pinnedChords: PinnedChord[]
  onPlayChord: (chord: PinnedChord) => void
  onHoverChord: (chord: PinnedChord | null) => void
  onRemoveChord: (index: number) => void
  onPlaybackChange: (index: number, playback: Partial<ChordPlayback>) => void
}

export default function PinnedChordList({
  pinnedChords,
  onPlayChord,
  onHoverChord,
  onRemoveChord,
  onPlaybackChange,
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
          <PinnedChordCard
            key={getChordSelectionKey(chord, index)}
            chord={chord}
            onPlay={() => onPlayChord(chord)}
            onHoverStart={() => onHoverChord(chord)}
            onRemove={() => onRemoveChord(index)}
            onPlaybackChange={(playback) => onPlaybackChange(index, playback)}
          />
        ))}
      </div>
    </section>
  )
}
