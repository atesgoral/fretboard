import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { ChordSelection } from './chordSearch'
import ChordCard from './ChordCard'
import ChordPlaybackSettingsMenu from './ChordPlaybackSettingsMenu'
import { getChordSelectionKey } from './chordSelection'
import type { ChordPlaybackSettings, ChordPlaybackSettingsOverride } from './chordPlayback'

export type PinnedChord = ChordSelection & {
  playbackSettings: ChordPlaybackSettings | ChordPlaybackSettingsOverride
}

type PinnedChordListProps = {
  pinnedChords: PinnedChord[]
  onPlayChord: (chord: PinnedChord) => void
  onHoverChord: (chord: ChordSelection | null) => void
  onPreviewChordVoicing: (chord: PinnedChord) => void
  onRemoveChord: (index: number) => void
  onPlaybackSettingsChange: (
    index: number,
    settings: ChordPlaybackSettings | ChordPlaybackSettingsOverride,
  ) => void
  auditionSettings: ChordPlaybackSettings
  onAuditionSettingsChange: (settings: ChordPlaybackSettings) => void
}

const cornerButtonClass =
  'inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition enabled:hover:border-zinc-500 enabled:hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 enabled:dark:hover:border-zinc-400 enabled:dark:hover:text-zinc-100'

export default function PinnedChordList({
  pinnedChords,
  onPlayChord,
  onHoverChord,
  onPreviewChordVoicing,
  onRemoveChord,
  onPlaybackSettingsChange,
  auditionSettings,
  onAuditionSettingsChange,
}: PinnedChordListProps) {
  const [collapsed, setCollapsed] = useState(false)
  const collapseTitle = collapsed ? 'Expand pinned chords panel' : 'Collapse pinned chords panel'

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
      className="relative rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      onPointerLeave={handlePointerLeave}
    >
      <button
        type="button"
        title={collapseTitle}
        aria-label={collapseTitle}
        onClick={() => setCollapsed((current) => !current)}
        className={`absolute right-2 top-2 ${cornerButtonClass}`}
      >
        {collapsed ? (
          <ChevronDown className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronUp className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
      <ChordPlaybackSettingsMenu
        settings={auditionSettings}
        onSettingsChange={(settings) => onAuditionSettingsChange(settings as ChordPlaybackSettings)}
        className="absolute right-10 top-2"
      />
      <h2
        className={`${collapsed ? '' : 'mb-3'} pr-16 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400`}
      >
        Pinned chords
      </h2>
      {collapsed ? null : (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {pinnedChords.map((chord, index) => (
            <ChordCard
              key={getChordSelectionKey(chord, index)}
              chord={chord}
              onPlay={() => onPlayChord(chord)}
              onHoverStart={() => onHoverChord(chord)}
              onHoverEnd={() => onHoverChord(null)}
              onPlayHoverStart={() => onPreviewChordVoicing(chord)}
              onPlayHoverEnd={() => onHoverChord(chord)}
              onRemove={() => onRemoveChord(index)}
              playbackSettings={chord.playbackSettings}
              onPlaybackSettingsChange={(settings) => onPlaybackSettingsChange(index, settings)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
