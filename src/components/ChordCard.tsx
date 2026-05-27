import { Play, X } from 'lucide-react'
import type { ChordSelection } from './chordSearch'
import { getChordQueryForSelection } from './chordSearch'

export type ChordCardProps = {
  chord: ChordSelection
  degreeLabel?: string
  active?: boolean
  onSelect?: () => void
  onPlay: () => void
  onHoverStart?: () => void
  onHoverEnd?: () => void
  onRemove?: () => void
}

function getChordLabel(chord: ChordSelection) {
  return getChordQueryForSelection(chord.root, chord.qualityId, chord.extensionIds)
}

function getChordCardTitle(degreeLabel: string | undefined, label: string) {
  if (degreeLabel) {
    return `${degreeLabel}: ${label}`
  }
  return label
}

const cardSurfaceClass = (active: boolean) =>
  active
    ? 'border-zinc-800 bg-zinc-800 text-zinc-100 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
    : 'border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-400'

function PlayChordButton({ title, onPlayDown }: { title: string; onPlayDown: () => void }) {
  return (
    <span title={title} className="absolute bottom-1 right-1 hidden group-hover:inline-flex">
      <button
        type="button"
        title={title}
        aria-label={title}
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onPlayDown()
        }}
        className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:text-zinc-100"
      >
        <Play className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </span>
  )
}

function RemoveChordButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <span title={title} className="absolute right-1 top-1 hidden group-hover:inline-flex">
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={(event) => {
          event.stopPropagation()
          onClick()
        }}
        className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:text-zinc-100"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </span>
  )
}

function ChordCardContent({
  chord,
  degreeLabel,
  label,
}: {
  chord: ChordSelection
  degreeLabel?: string
  label: string
}) {
  return (
    <>
      <span className="text-xs tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
        {degreeLabel ?? chord.root}
      </span>
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </>
  )
}

export default function ChordCard({
  chord,
  degreeLabel,
  active = false,
  onSelect,
  onPlay,
  onHoverStart,
  onHoverEnd,
  onRemove,
}: ChordCardProps) {
  const label = getChordLabel(chord)
  const cardTitle = getChordCardTitle(degreeLabel, label)
  const playTitle = `Play chord ${label}`

  return (
    <div
      className="group relative h-24 w-24 shrink-0"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {onSelect ? (
        <button
          type="button"
          title={`${active ? 'Selected' : 'Select'} chord ${label}`}
          aria-label={`${active ? 'Selected' : 'Select'} chord ${label}`}
          onClick={onSelect}
          className={`flex h-full w-full cursor-pointer flex-col justify-between rounded-md border p-2 text-left transition ${cardSurfaceClass(active)}`}
        >
          <ChordCardContent chord={chord} degreeLabel={degreeLabel} label={label} />
        </button>
      ) : (
        <div
          title={cardTitle}
          className={`flex h-full w-full flex-col justify-between rounded-md border p-2 text-left transition ${cardSurfaceClass(active)}`}
        >
          <ChordCardContent chord={chord} degreeLabel={degreeLabel} label={label} />
        </div>
      )}
      <PlayChordButton title={playTitle} onPlayDown={onPlay} />
      {onRemove ? (
        <RemoveChordButton title={`Remove chord swatch ${label}`} onClick={onRemove} />
      ) : null}
    </div>
  )
}
