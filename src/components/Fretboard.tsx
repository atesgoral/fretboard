import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Reverb, Soundfont } from 'smplr'
import FretboardLegend from './FretboardLegend'
import type { ChordPlaybackMode } from './chordPlayback'

const STRINGS = 6
const DEFAULT_FRETS = 18
const FRETBOARD_MIN_WIDTH_PX = 1280
const SCALE_FUNCTION_LABEL_LEFT = '28%'
const CHORD_FUNCTION_LABEL_LEFT = '72%'
const MARKER_FRETS = new Set([3, 5, 7, 9])
const STRING_THICKNESSES = [4, 3.5, 3, 2.5, 2, 1.5]
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
const GUITAR_SOUNDFONT = 'acoustic_guitar_nylon'
const FALLBACK_SOUNDFONT = 'acoustic_guitar_steel'
const REVERB_STORAGE_KEY = 'cadence_reverb'
const DEFAULT_REVERB_LEVEL = 0.15
const STRUM_DELAY_MS = 28
const TOUCH_SCROLL_THRESHOLD_PX = 8
const TOUCH_LONG_PRESS_MS = 300

type AudioContextConstructor = new () => AudioContext
type WindowWithWebKitAudioContext = Window & {
  webkitAudioContext?: AudioContextConstructor
}

function createAudioContext() {
  const AudioContextClass =
    window.AudioContext ?? (window as WindowWithWebKitAudioContext).webkitAudioContext

  return AudioContextClass ? new AudioContextClass() : null
}

function isAudioContextRunning(context: AudioContext) {
  return context.state === 'running'
}

function getStringYPositions() {
  return Array.from({ length: STRINGS }, (_, index) => ((index + 0.5) / STRINGS) * 100)
}

function getFretPositions(linear: boolean, frets: number) {
  if (linear) {
    return Array.from({ length: frets + 1 }, (_, index) => index / frets)
  }

  const scaleLength = 1
  const nutToFret = Array.from(
    { length: frets + 1 },
    (_, fret) => scaleLength - scaleLength / 2 ** (fret / 12),
  )
  const maxDistance = nutToFret[frets]

  return nutToFret.map((distance) => distance / maxDistance)
}

type FretboardProps = {
  linear: boolean
  lowEAtBottom: boolean
  naturalDecay: boolean
  reverbEnabled: boolean
  muted: boolean
  frets?: number
  markedNotes: Map<number, string>
  highlightedPitchClasses?: number[]
  highlightedChordRoles?: Map<number, string>
  playedPositions: ActivePosition[]
  playSequence: number
  playbackMode?: ChordPlaybackMode
}

function getStoredReverbLevel() {
  if (typeof window === 'undefined') return DEFAULT_REVERB_LEVEL
  const stored = Number.parseFloat(window.localStorage.getItem(REVERB_STORAGE_KEY) ?? '')
  if (Number.isNaN(stored)) return DEFAULT_REVERB_LEVEL
  return Math.max(0, Math.min(1, stored))
}

type FretLinesProps = {
  fretPositions: number[]
  frets: number
}

function FretLines({ fretPositions, frets }: FretLinesProps) {
  const nutLeft = `${fretPositions[1] * 100}%`

  return (
    <>
      <div
        className="absolute top-0 h-full bg-zinc-700 dark:bg-zinc-200"
        style={{
          left: nutLeft,
          width: '5px',
          transform: 'translateX(-50%)',
        }}
      />
      {Array.from({ length: frets - 1 }, (_, index) => index + 2).map((fret) => {
        const left = `${fretPositions[fret] * 100}%`

        return (
          <div
            key={`fret-${fret}`}
            className="absolute top-0 h-full bg-zinc-300 dark:bg-zinc-600"
            style={{
              left,
              width: '2px',
              transform: 'translateX(-1px)',
            }}
          />
        )
      })}
    </>
  )
}

function StringLines({
  stringYPositions,
  stringThicknesses,
  hoveredOpenStringVisualIndex,
  highlightedOpenStringVisualIndexes,
  activeStringVisualIndexes,
  scaleOpenStringVisualIndexes,
}: {
  stringYPositions: number[]
  stringThicknesses: number[]
  hoveredOpenStringVisualIndex: number
  highlightedOpenStringVisualIndexes: Set<number>
  activeStringVisualIndexes: Set<number>
  scaleOpenStringVisualIndexes: Set<number>
}) {
  return Array.from({ length: STRINGS }, (_, index) => {
    const stringTop = `calc(${stringYPositions[index]}% - ${stringThicknesses[index] / 2}px)`
    const isDirectlyHoveredOpenString = hoveredOpenStringVisualIndex === index
    const isChordHighlighted = highlightedOpenStringVisualIndexes.has(index)
    const isActiveString = activeStringVisualIndexes.has(index)
    const isScaleOpenString = scaleOpenStringVisualIndexes.has(index)
    const stringColorClass = isDirectlyHoveredOpenString
      ? 'bg-black dark:bg-white'
      : isChordHighlighted
        ? 'bg-blue-500 dark:bg-blue-300'
        : isActiveString
          ? 'bg-purple-500 dark:bg-purple-300'
          : isScaleOpenString
            ? 'bg-amber-500 dark:bg-amber-300'
            : 'bg-zinc-500 dark:bg-zinc-400'

    return (
      <div
        key={`string-${index}`}
        className={`absolute left-0 right-0 ${stringColorClass}`}
        style={{
          top: stringTop,
          height: `${stringThicknesses[index]}px`,
        }}
      />
    )
  })
}

type FretMarkersProps = {
  fretPositions: number[]
  frets: number
  stringYPositions: number[]
}

type FretLabelsProps = {
  fretPositions: number[]
  frets: number
}

function FretLabels({ fretPositions, frets }: FretLabelsProps) {
  return (
    <div
      className="relative mx-auto mt-2 h-5 select-none"
      style={{ minWidth: FRETBOARD_MIN_WIDTH_PX }}
    >
      <span
        className="absolute -translate-x-1/2 text-xs font-medium tracking-wide text-zinc-600 dark:text-zinc-300"
        style={{ left: `${((fretPositions[0] + fretPositions[1]) / 2) * 100}%` }}
      >
        Open
      </span>
      {Array.from({ length: frets - 1 }, (_, index) => index + 1).map((fret) => {
        const labelCenter = (fretPositions[fret] + fretPositions[fret + 1]) / 2

        return (
          <span
            key={`fret-label-${fret}`}
            className="absolute -translate-x-1/2 text-xs font-medium text-zinc-600 dark:text-zinc-300"
            style={{ left: `${labelCenter * 100}%` }}
          >
            {fret}
          </span>
        )
      })}
    </div>
  )
}

function FretMarkers({ fretPositions, frets, stringYPositions }: FretMarkersProps) {
  const singleMarkerFrets = Array.from({ length: frets - 1 }, (_, i) => i + 1).filter((fret) =>
    MARKER_FRETS.has(fret % 12),
  )

  return (
    <>
      {singleMarkerFrets.map((fret) => {
        const midpoint = (fretPositions[fret] + fretPositions[fret + 1]) / 2

        return (
          <div
            key={`marker-${fret}`}
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700"
            style={{ left: `calc(${midpoint * 100}% - 8px)` }}
          />
        )
      })}

      {Array.from({ length: Math.floor(frets / 12) }, (_, index) => {
        const octaveFret = 12 * (index + 1)
        if (octaveFret >= frets) {
          return null
        }

        const midpoint = (fretPositions[octaveFret] + fretPositions[octaveFret + 1]) / 2

        const upperTop = (stringYPositions[1] + stringYPositions[2]) / 2
        const lowerTop = (stringYPositions[3] + stringYPositions[4]) / 2

        return (
          <div key={`double-marker-${octaveFret}`}>
            <div
              className="absolute h-3 w-3 -translate-y-1/2 rounded-full border border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700"
              style={{ left: `calc(${midpoint * 100}% - 6px)`, top: `${upperTop}%` }}
            />
            <div
              className="absolute h-3 w-3 -translate-y-1/2 rounded-full border border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700"
              style={{ left: `calc(${midpoint * 100}% - 6px)`, top: `${lowerTop}%` }}
            />
          </div>
        )
      })}
    </>
  )
}

type HoveredPosition = {
  stringIndex: number
  fret: number
} | null

type ActivePosition = {
  stringIndex: number
  fret: number
}

type ExcitationState = {
  level: number
  timestampMs: number
}

type TriggerType = 'pick' | 'slide'

type PointerPressState = {
  stringIndex: number
  fret: number
  lastKey: string
}

function getActivePositionsFromPointers(
  pointers: Map<number, PointerPressState>,
): ActivePosition[] {
  const seen = new Set<string>()
  const positions: ActivePosition[] = []

  for (const { stringIndex, fret } of pointers.values()) {
    const key = `${stringIndex}:${fret}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    positions.push({ stringIndex, fret })
  }

  return positions
}

const CIRCLE_TONE = {
  chord:
    'border-blue-900/30 bg-blue-500 text-white dark:border-blue-200/40 dark:bg-blue-300 dark:text-zinc-900',
  chordRoot:
    'border-2 border-blue-950 bg-blue-500 text-white dark:border-white dark:bg-blue-300 dark:text-zinc-900',
  played:
    'border-purple-900/40 bg-purple-500 text-zinc-50 dark:border-purple-200/50 dark:bg-purple-300 dark:text-zinc-900',
  scale:
    'border-amber-900/20 bg-amber-500 text-white dark:border-amber-200/30 dark:bg-amber-300 dark:text-zinc-900',
  scaleRoot:
    'border-2 border-amber-950 bg-amber-500 text-white dark:border-white dark:bg-amber-300 dark:text-zinc-900',
  neutral: 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black',
} as const

function getCircleToneClass({
  isDirectlyHovered,
  isChordHighlighted,
  isChordRoot,
  isActive,
  scaleRole,
}: {
  isDirectlyHovered: boolean
  isChordHighlighted: boolean
  isChordRoot: boolean
  isActive: boolean
  scaleRole: string | undefined
}) {
  if (isDirectlyHovered) return CIRCLE_TONE.neutral
  if (isChordHighlighted) return isChordRoot ? CIRCLE_TONE.chordRoot : CIRCLE_TONE.chord
  if (isActive) return CIRCLE_TONE.played
  if (scaleRole) return scaleRole === '1' ? CIRCLE_TONE.scaleRoot : CIRCLE_TONE.scale
  return CIRCLE_TONE.neutral
}

type NoteGridProps = {
  fretPositions: number[]
  frets: number
  scrollContainerRef: React.RefObject<HTMLDivElement>
  stringOrder: number[]
  stringYPositions: number[]
  hoveredPosition: HoveredPosition
  onPointerMove: (pointerId: number, position: FretCellPosition | null) => void
  onPointerLeave: () => void
  onPressStart: (pointerId: number, stringIndex: number, fret: number) => void
  onPressEnd: (pointerId: number) => void
  markedNotes: Map<number, string>
  highlightedPitchClasses: Set<number>
  highlightedChordRoles: Map<number, string>
  activePositions: ActivePosition[]
  burstActivePositions: ActivePosition[]
  animatedPositionBursts: Record<string, number>
  stringThicknesses: number[]
}

type OpenStringHighlightOverlayProps = {
  top: number
  bottom: number
  stringThickness: number
}

function OpenStringPulseOverlay({ top, bottom, stringThickness }: OpenStringHighlightOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20"
      style={{
        top: `${top}%`,
        height: `${bottom - top}%`,
      }}
    >
      <span
        className="open-string-burst-wave"
        style={{ '--string-thickness': `${stringThickness}px` } as React.CSSProperties}
      />
    </div>
  )
}

type FretCellPosition = {
  stringIndex: number
  fret: number
}

type TouchGestureState = {
  stringIndex: number
  fret: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  startScrollLeft: number
  mode: 'pending' | 'scrolling' | 'playing'
  longPressTimeoutId: number
}

function getFretCellFromPointer(
  event: { clientX: number; clientY: number },
  grid: HTMLElement | null,
): FretCellPosition | null {
  if (!grid) {
    return null
  }

  const target = document.elementFromPoint(event.clientX, event.clientY)
  if (!target || !grid.contains(target)) {
    return null
  }

  const cell = target.closest('[data-fret-cell]')
  if (!(cell instanceof HTMLElement)) {
    return null
  }

  const { stringIndex, fret } = cell.dataset
  if (stringIndex === undefined || fret === undefined) {
    return null
  }

  return { stringIndex: Number(stringIndex), fret: Number(fret) }
}

function getStringBandBounds(stringYPositions: number[]) {
  return stringYPositions.map((position, index) => {
    if (index === 0) {
      const nextMidpoint = (position + stringYPositions[index + 1]) / 2
      return { top: 0, bottom: nextMidpoint }
    }

    if (index === stringYPositions.length - 1) {
      const previousMidpoint = (stringYPositions[index - 1] + position) / 2
      return { top: previousMidpoint, bottom: 100 }
    }

    const top = (stringYPositions[index - 1] + position) / 2
    const bottom = (position + stringYPositions[index + 1]) / 2
    return { top, bottom }
  })
}

function NoteGrid({
  fretPositions,
  frets,
  scrollContainerRef,
  stringOrder,
  stringYPositions,
  hoveredPosition,
  onPointerMove,
  onPointerLeave,
  onPressStart,
  onPressEnd,
  markedNotes,
  highlightedPitchClasses,
  highlightedChordRoles,
  activePositions,
  burstActivePositions,
  animatedPositionBursts,
  stringThicknesses,
}: NoteGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const touchGesturesRef = useRef(new Map<number, TouchGestureState>())
  const stringBandBounds = getStringBandBounds(stringYPositions)

  const updatePositionFromPointer = (
    pointerId: number,
    event: { clientX: number; clientY: number },
  ) => {
    const position = getFretCellFromPointer(event, gridRef.current)
    onPointerMove(pointerId, position)
  }

  const releasePointerCapture = (pointerId: number) => {
    if (gridRef.current?.hasPointerCapture?.(pointerId)) {
      gridRef.current.releasePointerCapture?.(pointerId)
    }
  }

  const clearTouchGestureTimeout = (gesture: TouchGestureState) => {
    window.clearTimeout(gesture.longPressTimeoutId)
  }

  const getCurrentTouchPosition = (gesture: TouchGestureState) =>
    getFretCellFromPointer(
      { clientX: gesture.currentX, clientY: gesture.currentY },
      gridRef.current,
    ) ?? { stringIndex: gesture.stringIndex, fret: gesture.fret }

  const startTouchPlayback = (pointerId: number) => {
    const gesture = touchGesturesRef.current.get(pointerId)
    if (!gesture || gesture.mode !== 'pending') {
      return
    }

    const position = getCurrentTouchPosition(gesture)
    gesture.stringIndex = position.stringIndex
    gesture.fret = position.fret
    gesture.mode = 'playing'
    onPressStart(pointerId, position.stringIndex, position.fret)
  }

  const hasScrollingTouchGesture = (pointerId: number) => {
    for (const [gesturePointerId, gesture] of touchGesturesRef.current) {
      if (gesturePointerId !== pointerId && gesture.mode === 'scrolling') {
        return true
      }
    }

    return false
  }

  const handleTouchPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    stringIndex: number,
    fret: number,
  ) => {
    gridRef.current?.setPointerCapture?.(event.pointerId)
    const longPressTimeoutId = window.setTimeout(() => {
      startTouchPlayback(event.pointerId)
    }, TOUCH_LONG_PRESS_MS)

    touchGesturesRef.current.set(event.pointerId, {
      stringIndex,
      fret,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      startScrollLeft: scrollContainerRef.current?.scrollLeft ?? 0,
      mode: 'pending',
      longPressTimeoutId,
    })
  }

  const handleTouchPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = touchGesturesRef.current.get(event.pointerId)
    if (!gesture) {
      return false
    }

    gesture.currentX = event.clientX
    gesture.currentY = event.clientY

    if (gesture.mode === 'pending') {
      const distanceX = event.clientX - gesture.startX
      const distanceY = event.clientY - gesture.startY
      const absX = Math.abs(distanceX)
      const absY = Math.abs(distanceY)

      if (absX < TOUCH_SCROLL_THRESHOLD_PX && absY < TOUCH_SCROLL_THRESHOLD_PX) {
        return true
      }

      clearTouchGestureTimeout(gesture)

      if (absY > absX) {
        touchGesturesRef.current.delete(event.pointerId)
        releasePointerCapture(event.pointerId)
        onPointerMove(event.pointerId, null)
        return true
      }

      gesture.mode = 'scrolling'
      onPointerMove(event.pointerId, null)
    }

    if (gesture.mode === 'scrolling') {
      event.preventDefault()
      const distanceX = event.clientX - gesture.startX
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = gesture.startScrollLeft - distanceX
      }
      return true
    }

    updatePositionFromPointer(event.pointerId, event)
    return true
  }

  const finishTouchGesture = (pointerId: number, playPendingTap: boolean) => {
    const gesture = touchGesturesRef.current.get(pointerId)
    if (!gesture) {
      return false
    }

    clearTouchGestureTimeout(gesture)
    touchGesturesRef.current.delete(pointerId)
    releasePointerCapture(pointerId)

    if (gesture.mode === 'playing') {
      onPressEnd(pointerId)
      return true
    }

    if (gesture.mode === 'pending' && playPendingTap && !hasScrollingTouchGesture(pointerId)) {
      const position = getCurrentTouchPosition(gesture)
      onPressStart(pointerId, position.stringIndex, position.fret)
      onPressEnd(pointerId)
    }

    return true
  }

  useEffect(() => {
    return () => {
      for (const gesture of touchGesturesRef.current.values()) {
        clearTouchGestureTimeout(gesture)
      }
      touchGesturesRef.current.clear()
    }
  }, [])

  const handleGridPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' && handleTouchPointerMove(event)) {
      return
    }

    updatePositionFromPointer(event.pointerId, event)
  }

  const handleCellPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    stringIndex: number,
    fret: number,
  ) => {
    if (event.pointerType === 'touch') {
      handleTouchPointerDown(event, stringIndex, fret)
      return
    }

    event.preventDefault()
    gridRef.current?.setPointerCapture?.(event.pointerId)
    onPressStart(event.pointerId, stringIndex, fret)
  }

  const handleGridPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' && finishTouchGesture(event.pointerId, true)) {
      return
    }

    releasePointerCapture(event.pointerId)
    onPressEnd(event.pointerId)
  }

  const handleGridPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' && finishTouchGesture(event.pointerId, false)) {
      return
    }

    releasePointerCapture(event.pointerId)
    onPressEnd(event.pointerId)
  }

  const handleGridPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return
    }
    onPointerLeave()
  }
  const activePositionSet = new Set(
    activePositions.map((position) => `${position.stringIndex}:${position.fret}`),
  )
  const burstActivePositionSet = new Set(
    burstActivePositions.map((position) => `${position.stringIndex}:${position.fret}`),
  )
  const activeOpenStringVisualIndexes = stringOrder.reduce<
    Array<{ visualIndex: number; stringThickness: number; burstKey: number }>
  >((indexes, stringIndex, visualIndex) => {
    const openStringPositionKey = `${stringIndex}:0`
    const isOpenStringBurstActive = burstActivePositionSet.has(openStringPositionKey)
    const hasFrettedNoteOnString = burstActivePositions.some(
      (position) => position.stringIndex === stringIndex && position.fret > 0,
    )

    if (isOpenStringBurstActive && !hasFrettedNoteOnString) {
      indexes.push({
        visualIndex,
        stringThickness: stringThicknesses[visualIndex],
        burstKey: animatedPositionBursts[openStringPositionKey] ?? 0,
      })
    }
    return indexes
  }, [])

  return (
    <div
      ref={gridRef}
      className="absolute inset-0 touch-pan-y"
      onPointerMove={handleGridPointerMove}
      onPointerLeave={handleGridPointerLeave}
      onPointerUp={handleGridPointerUp}
      onPointerCancel={handleGridPointerCancel}
    >
      {stringOrder.map((stringIndex, visualIndex) => {
        const band = stringBandBounds[visualIndex]
        const top = `${band.top}%`
        const height = `${band.bottom - band.top}%`

        return Array.from({ length: frets }, (_, fret) => {
          const left = `${fretPositions[fret] * 100}%`
          const width = `${(fretPositions[fret + 1] - fretPositions[fret]) * 100}%`
          const isDirectlyHovered =
            hoveredPosition?.stringIndex === stringIndex && hoveredPosition?.fret === fret
          const noteClass = (OPEN_STRING_MIDI[stringIndex] + fret) % 12
          const isHighlighted = isDirectlyHovered || highlightedPitchClasses.has(noteClass)
          const role = markedNotes.get(noteClass)
          const chordRole = highlightedChordRoles.get(noteClass)
          const positionKey = `${stringIndex}:${fret}`
          const isActive = activePositionSet.has(positionKey)
          const showChordRoleLabel = Boolean(chordRole && isHighlighted && !isActive)
          const shouldShowCircle = Boolean(role) || isActive || isHighlighted
          const noteName = getNoteName(OPEN_STRING_MIDI[stringIndex] + fret)
          const burstKey = animatedPositionBursts[positionKey] ?? 0
          const shouldRenderBurst =
            burstActivePositionSet.has(positionKey) && burstKey > 0 && fret > 0
          const circleToneClass = getCircleToneClass({
            isDirectlyHovered,
            isChordHighlighted: highlightedPitchClasses.has(noteClass),
            isChordRoot: chordRole === 'R',
            isActive,
            scaleRole: role,
          })

          return (
            <button
              key={`note-${stringIndex}-${fret}`}
              type="button"
              data-fret-cell=""
              data-string-index={stringIndex}
              data-fret={fret}
              title={
                fret === 0
                  ? `Play string ${stringIndex + 1}, open string`
                  : `Play string ${stringIndex + 1}, fret ${fret}`
              }
              className="absolute cursor-pointer border-0 bg-transparent p-0"
              style={{ left, top, width, height }}
              onPointerDown={(event) => handleCellPointerDown(event, stringIndex, fret)}
            >
              {role ? (
                <span
                  className="pointer-events-none absolute top-1 z-20 -translate-x-1/2 text-[10px] font-semibold leading-none text-amber-900 dark:text-amber-200"
                  style={{ left: `max(0.25rem, calc(${SCALE_FUNCTION_LABEL_LEFT} - 0.4375rem))` }}
                >
                  {role}
                </span>
              ) : null}
              {showChordRoleLabel ? (
                <span
                  className="pointer-events-none absolute top-1 z-20 -translate-x-1/2 text-[10px] font-semibold leading-none text-blue-900 dark:text-blue-200"
                  style={{
                    left: `min(calc(100% - 0.25rem), calc(${CHORD_FUNCTION_LABEL_LEFT} + 0.4375rem))`,
                  }}
                >
                  {chordRole}
                </span>
              ) : null}
              {shouldShowCircle ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                  {shouldRenderBurst ? (
                    <span key={`burst-${positionKey}-${burstKey}`} className="note-burst-wave" />
                  ) : null}
                  <span
                    className={`relative block h-7 w-7 rounded-full border shadow-sm ${circleToneClass}`}
                  >
                    <span className="font-varela-round absolute inset-0 flex translate-y-px items-center justify-center text-xs font-semibold leading-none">
                      {noteName}
                    </span>
                  </span>
                </span>
              ) : null}
            </button>
          )
        })
      })}
      {activeOpenStringVisualIndexes.map(({ visualIndex, stringThickness, burstKey }) => {
        const band = stringBandBounds[visualIndex]
        return (
          <OpenStringPulseOverlay
            key={`active-open-string-${visualIndex}-${burstKey}`}
            top={band.top}
            bottom={band.bottom}
            stringThickness={stringThickness}
          />
        )
      })}
    </div>
  )
}

type NoteIdentity = { name: string }

type NoteReadoutProps = {
  activeNotes: NoteIdentity[]
}

function getNoteName(midiNote: number) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  return noteNames[midiNote % 12]
}

function getNoteIdentity(position: ActivePosition): NoteIdentity {
  const midiNote = OPEN_STRING_MIDI[position.stringIndex] + position.fret
  return {
    name: getNoteName(midiNote),
  }
}

function NoteReadout({ activeNotes }: NoteReadoutProps) {
  const noteNames = activeNotes.map((note) => note.name)

  return (
    <div className="relative my-3 flex min-h-10 items-center">
      <div className="absolute left-1/2 -translate-x-1/2">
        <span
          className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 px-3 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 ${noteNames.length > 0 ? 'visible' : 'invisible'}`}
        >
          {noteNames.join(' · ')}
        </span>
      </div>
    </div>
  )
}

export default function Fretboard({
  linear,
  lowEAtBottom,
  naturalDecay,
  reverbEnabled,
  muted,
  frets = DEFAULT_FRETS,
  markedNotes,
  highlightedPitchClasses = [],
  highlightedChordRoles = new Map(),
  playedPositions,
  playSequence,
  playbackMode = 'pluck',
}: FretboardProps) {
  const fretPositions = useMemo(() => getFretPositions(linear, frets), [linear, frets])
  const highlightedPitchClassSet = useMemo(
    () => new Set(highlightedPitchClasses),
    [highlightedPitchClasses],
  )
  const stringYPositions = useMemo(() => getStringYPositions(), [])
  const stringThicknesses = useMemo(
    () => (lowEAtBottom ? [...STRING_THICKNESSES].reverse() : STRING_THICKNESSES),
    [lowEAtBottom],
  )
  const stringOrder = useMemo(
    () =>
      lowEAtBottom
        ? Array.from({ length: STRINGS }, (_, index) => STRINGS - 1 - index)
        : Array.from({ length: STRINGS }, (_, index) => index),
    [lowEAtBottom],
  )
  const audioContextRef = useRef<AudioContext | null>(null)
  const instrumentRef = useRef<ReturnType<typeof Soundfont> | null>(null)
  const instrumentLoadingRef = useRef<Promise<ReturnType<typeof Soundfont>> | null>(null)
  const dryGainRef = useRef<GainNode | null>(null)
  const wetGainRef = useRef<GainNode | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const audioResumePromiseRef = useRef<Promise<void | undefined> | null>(null)
  const fretboardSurfaceRef = useRef<HTMLDivElement>(null)
  const [hoveredPosition, setHoveredPosition] = useState<HoveredPosition>(null)
  const [heldPositions, setHeldPositions] = useState<ActivePosition[]>([])
  const reverbEnabledRef = useRef(reverbEnabled)
  const activePointersRef = useRef(new Map<number, PointerPressState>())
  const [recentlyPlayedPositions, setRecentlyPlayedPositions] = useState<ActivePosition[]>([])
  const [animatedPositionBursts, setAnimatedPositionBursts] = useState<Record<string, number>>({})
  const excitationByStringRef = useRef<ExcitationState[]>(
    Array.from({ length: STRINGS }, () => ({ level: 0, timestampMs: 0 })),
  )

  const activeNotes =
    heldPositions.length > 0
      ? heldPositions.map(getNoteIdentity)
      : hoveredPosition
        ? [getNoteIdentity(hoveredPosition)]
        : recentlyPlayedPositions.map(getNoteIdentity)
  const activePositions = heldPositions.length > 0 ? heldPositions : recentlyPlayedPositions
  const burstActivePositions = heldPositions.length > 0 ? heldPositions : recentlyPlayedPositions
  const hoveredOpenStringVisualIndex =
    hoveredPosition && hoveredPosition.fret === 0
      ? stringOrder.indexOf(hoveredPosition.stringIndex)
      : -1
  const highlightedOpenStringVisualIndexes = useMemo(() => {
    if (highlightedPitchClassSet.size === 0) {
      return new Set<number>()
    }

    return new Set(
      stringOrder
        .map((stringIndex, visualIndex) =>
          highlightedPitchClassSet.has(OPEN_STRING_MIDI[stringIndex] % 12) ? visualIndex : -1,
        )
        .filter((visualIndex) => visualIndex >= 0),
    )
  }, [highlightedPitchClassSet, stringOrder])
  const activeStringVisualIndexes = useMemo(() => {
    const activeStringIndexes = new Set(
      recentlyPlayedPositions
        .filter((position) => position.fret === 0)
        .map((position) => position.stringIndex),
    )
    return new Set(
      stringOrder
        .map((stringIndex, visualIndex) =>
          activeStringIndexes.has(stringIndex) ? visualIndex : -1,
        )
        .filter((visualIndex) => visualIndex >= 0),
    )
  }, [recentlyPlayedPositions, stringOrder])
  const scaleOpenStringVisualIndexes = useMemo(() => {
    if (markedNotes.size === 0) {
      return new Set<number>()
    }

    return new Set(
      stringOrder
        .map((stringIndex, visualIndex) =>
          markedNotes.has(OPEN_STRING_MIDI[stringIndex] % 12) ? visualIndex : -1,
        )
        .filter((visualIndex) => visualIndex >= 0),
    )
  }, [markedNotes, stringOrder])

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close()
    }
  }, [])

  useEffect(() => {
    reverbEnabledRef.current = reverbEnabled
    const mix = reverbEnabled ? getStoredReverbLevel() : 0
    if (dryGainRef.current) dryGainRef.current.gain.value = 1 - mix
    if (wetGainRef.current) wetGainRef.current.gain.value = mix
  }, [reverbEnabled])

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext()
    }

    return audioContextRef.current
  }, [])

  const resumeAudioContext = useCallback((context: AudioContext) => {
    if (isAudioContextRunning(context)) {
      return Promise.resolve()
    }

    if (!audioResumePromiseRef.current) {
      audioResumePromiseRef.current = context
        .resume()
        .catch(() => undefined)
        .finally(() => {
          audioResumePromiseRef.current = null
        })
    }

    return audioResumePromiseRef.current
  }, [])

  const getInstrument = useCallback(async (context: AudioContext) => {
    if (instrumentRef.current) {
      return instrumentRef.current
    }
    if (instrumentLoadingRef.current) {
      return instrumentLoadingRef.current
    }

    const loading = (async () => {
      const reverbMix = reverbEnabledRef.current ? getStoredReverbLevel() : 0
      const highpassFilter = context.createBiquadFilter()
      highpassFilter.type = 'highpass'
      highpassFilter.frequency.value = 80
      const lowpassFilter = context.createBiquadFilter()
      lowpassFilter.type = 'lowpass'
      lowpassFilter.frequency.value = 7200
      const dryGain = context.createGain()
      const wetGain = context.createGain()
      dryGain.gain.value = 1 - reverbMix
      wetGain.gain.value = reverbMix
      const reverb = Reverb(context)

      highpassFilter.connect(lowpassFilter)
      lowpassFilter.connect(dryGain)
      dryGain.connect(context.destination)
      lowpassFilter.connect(wetGain)
      wetGain.connect(reverb.input)
      reverb.connect(context.destination)
      dryGainRef.current = dryGain
      wetGainRef.current = wetGain

      let instrument = Soundfont(context, {
        instrument: GUITAR_SOUNDFONT,
        destination: highpassFilter,
      })

      try {
        await instrument.ready
      } catch {
        instrument = Soundfont(context, {
          instrument: FALLBACK_SOUNDFONT,
          destination: highpassFilter,
        })
        await instrument.ready
      }

      instrumentRef.current = instrument
      return instrument
    })()

    instrumentLoadingRef.current = loading

    try {
      return await loading
    } finally {
      if (instrumentLoadingRef.current === loading) {
        instrumentLoadingRef.current = null
      }
    }
  }, [])

  const unlockAudioContext = useCallback(() => {
    if (muted) {
      return
    }

    const context = getAudioContext()
    if (context) {
      void resumeAudioContext(context)
    }
  }, [getAudioContext, muted, resumeAudioContext])

  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudioContext, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', unlockAudioContext, { capture: true })
    }
  }, [unlockAudioContext])

  const markRecentlyPlayed = useCallback((positions: ActivePosition[]) => {
    setRecentlyPlayedPositions(positions)
    setAnimatedPositionBursts((current) => {
      const next = { ...current }
      positions.forEach((position) => {
        const key = `${position.stringIndex}:${position.fret}`
        next[key] = (next[key] ?? 0) + 1
      })
      return next
    })
  }, [])

  const clearLastPlayedState = useCallback(() => {
    setHoveredPosition(null)
    setRecentlyPlayedPositions([])
    setAnimatedPositionBursts({})
  }, [])

  const syncHeldPositions = useCallback(() => {
    const positions = getActivePositionsFromPointers(activePointersRef.current)
    setHeldPositions(positions)
    markRecentlyPlayed(positions)
  }, [markRecentlyPlayed])

  const playNote = useCallback(
    async (stringIndex: number, fret: number, triggerType: TriggerType) => {
      if (muted) {
        return
      }

      const context = getAudioContext()
      if (!context) {
        return
      }

      const resumePromise = resumeAudioContext(context)
      const instrument = await getInstrument(context)

      await resumePromise
      if (!isAudioContextRunning(context)) {
        await resumeAudioContext(context)
        if (!isAudioContextRunning(context)) {
          return
        }
      }

      const midiNote = OPEN_STRING_MIDI[stringIndex] + fret

      let attackVelocity = 110
      let durationSeconds = 1.0

      if (naturalDecay) {
        const now = performance.now()
        const previous = excitationByStringRef.current[stringIndex]
        const elapsedSeconds = (now - previous.timestampMs) / 1000
        const timeDecay = Math.exp(-elapsedSeconds / 1.9)
        const residualExcitation = previous.level * timeDecay
        const pickedExcitation = triggerType === 'pick' ? 1 : residualExcitation * 0.74
        const clampedExcitation = Math.max(0.08, Math.min(1, pickedExcitation))

        excitationByStringRef.current[stringIndex] = {
          level: clampedExcitation,
          timestampMs: now,
        }

        attackVelocity = Math.round(38 + clampedExcitation * 72)
        durationSeconds = 0.3 + clampedExcitation * 2.3
      }

      instrument.start({ note: midiNote, velocity: attackVelocity, duration: durationSeconds })
    },
    [getAudioContext, getInstrument, muted, naturalDecay, resumeAudioContext],
  )

  const handlePressStart = useCallback(
    (pointerId: number, stringIndex: number, fret: number) => {
      const positionKey = `${stringIndex}:${fret}`
      activePointersRef.current.set(pointerId, { stringIndex, fret, lastKey: positionKey })
      syncHeldPositions()
      void playNote(stringIndex, fret, 'pick')
    },
    [playNote, syncHeldPositions],
  )

  const handlePressEnter = useCallback(
    (pointerId: number, stringIndex: number, fret: number) => {
      const pointerState = activePointersRef.current.get(pointerId)
      if (!pointerState) {
        return
      }

      const positionKey = `${stringIndex}:${fret}`
      if (pointerState.lastKey === positionKey) {
        return
      }

      activePointersRef.current.set(pointerId, {
        stringIndex,
        fret,
        lastKey: positionKey,
      })
      syncHeldPositions()
      void playNote(stringIndex, fret, 'slide')
    },
    [playNote, syncHeldPositions],
  )

  const handlePressEnd = useCallback(
    (pointerId: number) => {
      activePointersRef.current.delete(pointerId)
      if (activePointersRef.current.size === 0) {
        setHeldPositions([])
        setHoveredPosition(null)
        return
      }
      syncHeldPositions()
    },
    [syncHeldPositions],
  )

  const clearHoverPosition = useCallback(() => {
    if (activePointersRef.current.size === 0) {
      setHoveredPosition(null)
    }
  }, [])

  const handlePointerMove = useCallback(
    (pointerId: number, position: FretCellPosition | null) => {
      if (!position) {
        clearHoverPosition()
        return
      }

      if (activePointersRef.current.has(pointerId)) {
        handlePressEnter(pointerId, position.stringIndex, position.fret)
        return
      }

      setHoveredPosition(position)
    },
    [clearHoverPosition, handlePressEnter],
  )

  useEffect(() => {
    const handleWindowPointerEnd = (event: PointerEvent) => {
      if (!activePointersRef.current.has(event.pointerId)) {
        return
      }
      handlePressEnd(event.pointerId)
    }

    window.addEventListener('pointerup', handleWindowPointerEnd)
    window.addEventListener('pointercancel', handleWindowPointerEnd)
    return () => {
      window.removeEventListener('pointerup', handleWindowPointerEnd)
      window.removeEventListener('pointercancel', handleWindowPointerEnd)
    }
  }, [handlePressEnd])

  useEffect(() => {
    const handleDocumentPointerDown = (event: PointerEvent) => {
      const fretboardSurface = fretboardSurfaceRef.current
      const target = event.target
      if (!fretboardSurface || !(target instanceof Node) || fretboardSurface.contains(target)) {
        return
      }

      clearLastPlayedState()
    }

    document.addEventListener('pointerdown', handleDocumentPointerDown, { capture: true })
    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown, { capture: true })
    }
  }, [clearLastPlayedState])

  useEffect(() => {
    if (playSequence === 0 || playedPositions.length === 0) {
      return
    }

    markRecentlyPlayed(playedPositions)
    if (playbackMode === 'pluck') {
      playedPositions.forEach((position) => {
        void playNote(position.stringIndex, position.fret, 'pick')
      })
      return
    }

    const timeoutIds = [...playedPositions]
      .sort((left, right) => left.stringIndex - right.stringIndex)
      .map((position, index) =>
        window.setTimeout(() => {
          void playNote(position.stringIndex, position.fret, 'pick')
        }, index * STRUM_DELAY_MS),
      )

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [markRecentlyPlayed, playNote, playSequence, playedPositions, playbackMode])

  const handleFretboardPointerLeave = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const next = event.relatedTarget
      if (next instanceof Node && event.currentTarget.contains(next)) {
        return
      }
      clearHoverPosition()
    },
    [clearHoverPosition],
  )

  return (
    <section className="w-full border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div ref={scrollContainerRef} className="w-full overflow-x-auto">
        <div
          ref={fretboardSurfaceRef}
          className="relative mx-auto h-[260px] bg-zinc-50 dark:bg-zinc-800"
          onPointerLeave={handleFretboardPointerLeave}
          style={{ minWidth: FRETBOARD_MIN_WIDTH_PX }}
        >
          <div className="absolute inset-0 border border-zinc-200 dark:border-zinc-700" />
          <FretLines fretPositions={fretPositions} frets={frets} />
          <StringLines
            stringYPositions={stringYPositions}
            stringThicknesses={stringThicknesses}
            hoveredOpenStringVisualIndex={hoveredOpenStringVisualIndex}
            highlightedOpenStringVisualIndexes={highlightedOpenStringVisualIndexes}
            activeStringVisualIndexes={activeStringVisualIndexes}
            scaleOpenStringVisualIndexes={scaleOpenStringVisualIndexes}
          />
          <FretMarkers
            fretPositions={fretPositions}
            frets={frets}
            stringYPositions={stringYPositions}
          />
          <NoteGrid
            fretPositions={fretPositions}
            frets={frets}
            scrollContainerRef={scrollContainerRef}
            stringOrder={stringOrder}
            stringYPositions={stringYPositions}
            hoveredPosition={hoveredPosition}
            onPointerMove={handlePointerMove}
            onPointerLeave={clearHoverPosition}
            onPressStart={handlePressStart}
            onPressEnd={handlePressEnd}
            markedNotes={markedNotes}
            highlightedPitchClasses={highlightedPitchClassSet}
            highlightedChordRoles={highlightedChordRoles}
            activePositions={activePositions}
            burstActivePositions={burstActivePositions}
            animatedPositionBursts={animatedPositionBursts}
            stringThicknesses={stringThicknesses}
          />
        </div>
        <FretLabels fretPositions={fretPositions} frets={frets} />
      </div>
      <NoteReadout activeNotes={activeNotes} />
      <FretboardLegend />
    </section>
  )
}
