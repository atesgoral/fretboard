import { useMemo } from 'react'
import type { NoteName } from './chords'
import ChordCard from './ChordCard'
import type { ChordSelection } from './chordSearch'
import { buildDiatonicTriads } from './diatonicChords'
import { SCALE_OPTIONS, type ScaleId } from './scales'

type DiatonicChordListProps = {
  scaleRoot: NoteName
  scaleId: ScaleId
  onPlayChord: (chord: ChordSelection) => void
  onHoverChord: (chord: ChordSelection | null) => void
}

export default function DiatonicChordList({
  scaleRoot,
  scaleId,
  onPlayChord,
  onHoverChord,
}: DiatonicChordListProps) {
  const diatonicChords = useMemo(
    () => buildDiatonicTriads(scaleRoot, scaleId),
    [scaleRoot, scaleId],
  )
  const scaleLabel = SCALE_OPTIONS.find((option) => option.value === scaleId)?.label ?? scaleId

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
        Diatonic triads in {scaleRoot} {scaleLabel}
      </h2>
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {diatonicChords.map(({ degreeLabel, chord }) => (
          <ChordCard
            key={`${degreeLabel}-${chord.root}-${chord.qualityId}`}
            chord={chord}
            degreeLabel={degreeLabel}
            onPlay={() => onPlayChord(chord)}
            onHoverStart={() => onHoverChord(chord)}
          />
        ))}
      </div>
    </section>
  )
}
