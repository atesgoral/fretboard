import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { NoteName } from './chords'
import ChordCard from './ChordCard'
import ChordNotesVisibilityButton from './ChordNotesVisibilityButton'
import ChordPlaybackSettingsMenu from './ChordPlaybackSettingsMenu'
import {
  INHERITED_CHORD_PLAYBACK_SETTINGS,
  resolveChordPlaybackSettings,
  type ChordPlaybackSettings,
  type ChordPlaybackSettingsOverride,
} from './chordPlayback'
import type { ChordSelection } from './chordSearch'
import { buildDiatonicTriads } from './diatonicChords'
import { SCALE_OPTIONS, type ScaleId } from './scales'

type DiatonicChordListProps = {
  scaleRoot: NoteName
  scaleId: ScaleId
  onPlayChord: (chord: ChordSelection, playbackSettings: ChordPlaybackSettings) => void
  onHoverChord: (chord: ChordSelection | null) => void
  onPreviewChordVoicing: (chord: ChordSelection, playbackSettings: ChordPlaybackSettings) => void
  onPinChord: (chord: ChordSelection, playbackSettings: ChordPlaybackSettings) => void
  auditionSettings: ChordPlaybackSettings
  onAuditionSettingsChange: (settings: ChordPlaybackSettings) => void
  showChordNotes: boolean
  onToggleChordNotes: () => void
}

const cornerButtonClass =
  'inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition enabled:hover:border-zinc-500 enabled:hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 enabled:dark:hover:border-zinc-400 enabled:dark:hover:text-zinc-100'

const getDiatonicChordKey = (degreeLabel: string, chord: ChordSelection) =>
  `${degreeLabel}-${chord.root}-${chord.qualityId}-${chord.extensionIds.join(',')}`

export default function DiatonicChordList({
  scaleRoot,
  scaleId,
  onPlayChord,
  onHoverChord,
  onPreviewChordVoicing,
  onPinChord,
  auditionSettings,
  onAuditionSettingsChange,
  showChordNotes,
  onToggleChordNotes,
}: DiatonicChordListProps) {
  const diatonicChords = useMemo(
    () => buildDiatonicTriads(scaleRoot, scaleId),
    [scaleRoot, scaleId],
  )
  const scaleLabel = SCALE_OPTIONS.find((option) => option.value === scaleId)?.label ?? scaleId
  const [collapsed, setCollapsed] = useState(false)
  const [chordSettings, setChordSettings] = useState<Record<string, ChordPlaybackSettingsOverride>>(
    {},
  )
  const collapseTitle = collapsed ? 'Expand chords panel' : 'Collapse chords panel'

  useEffect(() => {
    setChordSettings({})
  }, [scaleRoot, scaleId])

  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return
    }
    onHoverChord(null)
  }

  return (
    <section
      className="relative rounded-lg border border-blue-200/80 p-3 shadow-sm dark:border-blue-800/50"
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
      <ChordNotesVisibilityButton
        showChordNotes={showChordNotes}
        onToggleChordNotes={onToggleChordNotes}
        className={`absolute right-[4.5rem] top-2 ${cornerButtonClass}`}
      />
      <h2
        className={`${collapsed ? '' : 'mb-3'} pr-24 text-xs font-medium uppercase tracking-[0.08em] text-blue-800 dark:text-blue-300`}
      >
        {collapsed ? 'Chords' : `Diatonic triads in ${scaleRoot} ${scaleLabel}`}
      </h2>
      {collapsed ? null : (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {diatonicChords.map(({ degreeLabel, chord }) => {
            const chordKey = getDiatonicChordKey(degreeLabel, chord)
            const settings = chordSettings[chordKey] ?? INHERITED_CHORD_PLAYBACK_SETTINGS
            const resolvedSettings = resolveChordPlaybackSettings(settings, auditionSettings)
            return (
              <ChordCard
                key={chordKey}
                chord={chord}
                degreeLabel={degreeLabel}
                onPlay={() => onPlayChord(chord, resolvedSettings)}
                onHoverStart={() => onHoverChord(chord)}
                onHoverEnd={() => onHoverChord(null)}
                onPin={() => onPinChord(chord, resolvedSettings)}
                onPlayHoverStart={() => onPreviewChordVoicing(chord, resolvedSettings)}
                onPlayHoverEnd={() => onHoverChord(chord)}
                playbackSettings={settings}
                onPlaybackSettingsChange={(nextSettings) =>
                  setChordSettings((current) => ({ ...current, [chordKey]: nextSettings }))
                }
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
