import { useRef, type ReactNode } from 'react'
import { Pin, Play, X } from 'lucide-react'
import type { ChordPlaybackSettingsOverride } from './chordPlayback'
import type { ChordSelection } from './chordSearch'
import { getChordQueryForSelection } from './chordSearch'
import ChordPlaybackSettingsMenu from './ChordPlaybackSettingsMenu'

export type ChordCardProps = {
  chord: ChordSelection
  degreeLabel?: string
  active?: boolean
  onSelect?: () => void
  onPlay: () => void
  onPlayEnd?: () => void
  onHoverStart?: () => void
  onHoverEnd?: () => void
  onPlayHoverStart?: () => void
  onPlayHoverEnd?: () => void
  onPin?: () => void
  onRemove?: () => void
  playbackSettings?: ChordPlaybackSettingsOverride
  onPlaybackSettingsChange?: (settings: ChordPlaybackSettingsOverride) => void
}

function getChordLabel(chord: ChordSelection) {
  return getChordQueryForSelection(chord.root, chord.qualityId, chord.extensionIds)
}

function getChordQualityLine(chord: ChordSelection) {
  const label = getChordLabel(chord)
  return label.slice(chord.root.length) || 'maj'
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

const cornerButtonClass =
  'inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:text-zinc-100'
const TOUCH_PLAY_HIT_SIZE_PX = 40

function isTouchPlayCorner(event: React.PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'touch') {
    return false
  }

  const rect = event.currentTarget.getBoundingClientRect()
  return (
    event.clientX >= rect.right - TOUCH_PLAY_HIT_SIZE_PX &&
    event.clientY >= rect.bottom - TOUCH_PLAY_HIT_SIZE_PX
  )
}

function ChordCornerButton({
  title,
  positionClassName,
  onPointerDown,
  onPointerEnd,
  onPointerEnter,
  onPointerLeave,
  onClick,
  children,
}: {
  title: string
  positionClassName: string
  onPointerDown?: () => void
  onPointerEnd?: () => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  onClick?: () => void
  children: ReactNode
}) {
  const activePointerIdRef = useRef<number | null>(null)

  const finishPointerPlayback = () => {
    if (activePointerIdRef.current === null) {
      return
    }

    activePointerIdRef.current = null
    onPointerEnd?.()
  }

  return (
    <span title={title} className={`absolute hidden group-hover:inline-flex ${positionClassName}`}>
      <button
        type="button"
        data-chord-card-control=""
        title={title}
        aria-label={title}
        onPointerDown={(event) => {
          if (!onPointerDown) {
            return
          }
          event.preventDefault()
          event.stopPropagation()
          event.currentTarget.setPointerCapture?.(event.pointerId)
          activePointerIdRef.current = event.pointerId
          onPointerDown()
        }}
        onPointerUp={(event) => {
          if (activePointerIdRef.current !== event.pointerId) {
            return
          }
          event.preventDefault()
          event.stopPropagation()
          finishPointerPlayback()
        }}
        onPointerCancel={(event) => {
          if (activePointerIdRef.current !== event.pointerId) {
            return
          }
          event.stopPropagation()
          finishPointerPlayback()
        }}
        onLostPointerCapture={() => {
          finishPointerPlayback()
        }}
        onPointerEnter={(event) => {
          if (!onPointerEnter) {
            return
          }
          event.stopPropagation()
          onPointerEnter()
        }}
        onPointerLeave={(event) => {
          if (!onPointerLeave) {
            return
          }
          onPointerLeave()
        }}
        onClick={(event) => {
          if (!onClick) {
            return
          }
          event.stopPropagation()
          onClick()
        }}
        className={cornerButtonClass}
      >
        {children}
      </button>
    </span>
  )
}

function ChordCardContent({
  chord,
  degreeLabel,
  qualityLine,
  active,
}: {
  chord: ChordSelection
  degreeLabel?: string
  qualityLine: string
  active: boolean
}) {
  return (
    <>
      {degreeLabel ? (
        <span
          className={`absolute left-2 top-2 text-xs font-medium tracking-[0.12em] ${
            active ? 'opacity-70' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {degreeLabel}
        </span>
      ) : null}
      <span className="font-varela-round absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-semibold leading-none tracking-tight">
        {chord.root}
      </span>
      <span
        className={`absolute left-1/2 top-[calc(50%+1.125rem)] -translate-x-1/2 text-xs font-medium leading-tight ${
          active ? 'opacity-70' : 'text-zinc-500 dark:text-zinc-400'
        }`}
      >
        {qualityLine}
      </span>
    </>
  )
}

const cardLayoutClass =
  'relative h-full w-full select-none rounded-md border p-2 text-center transition'

export default function ChordCard({
  chord,
  degreeLabel,
  active = false,
  onSelect,
  onPlay,
  onPlayEnd,
  onHoverStart,
  onHoverEnd,
  onPlayHoverStart,
  onPlayHoverEnd,
  onPin,
  onRemove,
  playbackSettings,
  onPlaybackSettingsChange,
}: ChordCardProps) {
  const label = getChordLabel(chord)
  const qualityLine = getChordQualityLine(chord)
  const cardTitle = getChordCardTitle(degreeLabel, label)
  const playTitle = `Play chord ${label}`
  const suppressNextClickRef = useRef(false)
  const touchPlayPointerIdsRef = useRef(new Set<number>())

  const handleCardPointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('[data-chord-card-control]')) {
      return
    }
    if (!isTouchPlayCorner(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    touchPlayPointerIdsRef.current.add(event.pointerId)
    suppressNextClickRef.current = true
    onPlay()
  }

  const handleCardPointerEndCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!touchPlayPointerIdsRef.current.delete(event.pointerId)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onPlayEnd?.()
  }

  const handleCardClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressNextClickRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    suppressNextClickRef.current = false
  }

  return (
    <div
      className="group relative h-24 w-24 shrink-0"
      onPointerDownCapture={handleCardPointerDownCapture}
      onPointerUpCapture={handleCardPointerEndCapture}
      onPointerCancelCapture={handleCardPointerEndCapture}
      onClickCapture={handleCardClickCapture}
      onPointerEnter={onHoverStart}
      onPointerLeave={onHoverEnd}
    >
      {onSelect ? (
        <button
          type="button"
          title={`${active ? 'Selected' : 'Select'} chord ${label}`}
          aria-label={`${active ? 'Selected' : 'Select'} chord ${label}`}
          onClick={onSelect}
          className={`${cardLayoutClass} cursor-pointer ${cardSurfaceClass(active)}`}
        >
          <ChordCardContent
            chord={chord}
            degreeLabel={degreeLabel}
            qualityLine={qualityLine}
            active={active}
          />
        </button>
      ) : (
        <div title={cardTitle} className={`${cardLayoutClass} ${cardSurfaceClass(active)}`}>
          <ChordCardContent
            chord={chord}
            degreeLabel={degreeLabel}
            qualityLine={qualityLine}
            active={active}
          />
        </div>
      )}
      {onPin ? (
        <ChordCornerButton
          title={`Pin chord ${label}`}
          positionClassName="right-1 top-1"
          onClick={onPin}
        >
          <Pin className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
        </ChordCornerButton>
      ) : null}
      {onRemove ? (
        <ChordCornerButton
          title={`Remove pinned chord ${label}`}
          positionClassName="right-1 top-1"
          onClick={onRemove}
        >
          <X className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
        </ChordCornerButton>
      ) : null}
      {playbackSettings && onPlaybackSettingsChange ? (
        <ChordPlaybackSettingsMenu
          settings={playbackSettings}
          onSettingsChange={(settings) =>
            onPlaybackSettingsChange(settings as ChordPlaybackSettingsOverride)
          }
          includeInheritOption
          title={`Open chord settings for ${label}`}
          className="absolute bottom-1 left-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto data-[state=open]:opacity-100 data-[state=open]:pointer-events-auto"
        />
      ) : null}
      <ChordCornerButton
        title={playTitle}
        positionClassName="bottom-1 right-1"
        onPointerDown={onPlay}
        onPointerEnd={onPlayEnd}
        onPointerEnter={onPlayHoverStart}
        onPointerLeave={onPlayHoverEnd}
      >
        <Play className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
      </ChordCornerButton>
    </div>
  )
}
