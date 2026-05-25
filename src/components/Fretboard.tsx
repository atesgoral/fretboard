import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Soundfont } from 'smplr'

const STRINGS = 6
const DEFAULT_FRETS = 18
const MARKER_FRETS = new Set([3, 5, 7, 9])
const STRING_THICKNESSES = [4, 3.5, 3, 2.5, 2, 1.5]
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
const GUITAR_SOUNDFONT = 'acoustic_guitar_nylon'
const FALLBACK_SOUNDFONT = 'acoustic_guitar_steel'

function getFretPositions(linear: boolean, frets: number) {
  if (linear) {
    return Array.from({ length: frets + 1 }, (_, index) => index / frets)
  }

  const scaleLength = 1
  const nutToFret = Array.from({ length: frets + 1 }, (_, fret) => scaleLength - scaleLength / 2 ** (fret / 12))
  const maxDistance = nutToFret[frets]

  return nutToFret.map((distance) => distance / maxDistance)
}

type FretboardProps = {
  linear: boolean
  lowEAtBottom: boolean
  naturalDecay: boolean
  frets?: number
}

type FretLinesProps = {
  fretPositions: number[]
}

function FretLines({ fretPositions }: FretLinesProps) {
  return fretPositions.map((position, fret) => {
    const left = `${position * 100}%`
    const isNut = fret === 0

    return (
      <div
        key={`fret-${fret}`}
        className={`absolute top-0 h-full ${isNut ? 'bg-zinc-700 dark:bg-zinc-200' : 'bg-zinc-300 dark:bg-zinc-600'}`}
        style={{
          left,
          width: isNut ? '4px' : '2px',
          transform: isNut ? 'translateX(0)' : 'translateX(-1px)',
        }}
      />
    )
  })
}

function StringLines({ lowEAtBottom }: { lowEAtBottom: boolean }) {
  const stringThicknesses = lowEAtBottom ? [...STRING_THICKNESSES].reverse() : STRING_THICKNESSES

  return Array.from({ length: STRINGS }, (_, index) => {
    const top = `${10 + (index / (STRINGS - 1)) * 80}%`

    return (
      <div
        key={`string-${index}`}
        className="absolute left-0 right-0 bg-zinc-600 dark:bg-zinc-300"
        style={{
          top,
          height: `${stringThicknesses[index]}px`,
          transform: `translateY(-${stringThicknesses[index] / 2}px)`,
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

function FretMarkers({ fretPositions, frets, stringYPositions }: FretMarkersProps) {
  const singleMarkerFrets = Array.from({ length: frets - 1 }, (_, i) => i + 1).filter(
    (fret) => MARKER_FRETS.has(fret % 12),
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

type NoteGridProps = {
  fretPositions: number[]
  frets: number
  stringOrder: number[]
  stringYPositions: number[]
  hoveredPosition: HoveredPosition
  onHover: (stringIndex: number, fret: number) => void
  onLeave: () => void
  onPressStart: (stringIndex: number, fret: number) => void
  onPressEnter: (stringIndex: number, fret: number) => void
  onPressEnd: () => void
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

function NoteGrid({ fretPositions, frets, stringOrder, stringYPositions, hoveredPosition, onHover, onLeave, onPressStart, onPressEnter, onPressEnd }: NoteGridProps) {
  const stringBandBounds = getStringBandBounds(stringYPositions)

  return (
    <div className="absolute inset-0">
      {stringOrder.map((stringIndex, visualIndex) => {
        const band = stringBandBounds[visualIndex]
        const top = `${band.top}%`
        const height = `${band.bottom - band.top}%`

        return Array.from({ length: frets }, (_, fret) => {
          const left = `${fretPositions[fret] * 100}%`
          const width = `${(fretPositions[fret + 1] - fretPositions[fret]) * 100}%`
          const isHovered =
            hoveredPosition?.stringIndex === stringIndex && hoveredPosition?.fret === fret

          return (
            <button
              key={`note-${stringIndex}-${fret}`}
              type="button"
              className="absolute cursor-pointer border-0 bg-transparent p-0"
              style={{ left, top, width, height }}
              onMouseEnter={() => onHover(stringIndex, fret)}
              onMouseMove={() => onPressEnter(stringIndex, fret)}
              onMouseLeave={onLeave}
              onMouseDown={() => onPressStart(stringIndex, fret)}
              onMouseUp={onPressEnd}
            >
              {isHovered ? (
                <span className="pointer-events-none block h-full w-full bg-zinc-600/15 ring-1 ring-inset ring-zinc-600/45 dark:bg-zinc-100/15 dark:ring-zinc-100/45" />
              ) : null}
            </button>
          )
        })
      })}
    </div>
  )
}

type NoteReadoutProps = {
  hoveredPosition: ActivePosition | null
  playedPosition: ActivePosition | null
}

function getNoteName(midiNote: number) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(midiNote / 12) - 1
  return `${noteNames[midiNote % 12]}${octave}`
}

function getFrequency(midiNote: number) {
  return 440 * 2 ** ((midiNote - 69) / 12)
}

function formatPositionLabel(position: ActivePosition) {
  const midiNote = OPEN_STRING_MIDI[position.stringIndex] + position.fret
  const noteName = getNoteName(midiNote)
  const frequency = getFrequency(midiNote).toFixed(2)
  return `${noteName} ${frequency} Hz`
}

function NoteReadout({ hoveredPosition, playedPosition }: NoteReadoutProps) {
  if (!hoveredPosition && !playedPosition) {
    return (
      <div className="absolute inset-x-0 bottom-1 flex justify-center">
        <p className="rounded bg-zinc-900/75 px-2 py-1 text-xs font-medium tracking-wide text-zinc-100">Hover or play a note</p>
      </div>
    )
  }

  const hoveredLabel = hoveredPosition ? formatPositionLabel(hoveredPosition) : null
  const playedLabel = playedPosition ? formatPositionLabel(playedPosition) : null
  const samePosition =
    hoveredPosition &&
    playedPosition &&
    hoveredPosition.stringIndex === playedPosition.stringIndex &&
    hoveredPosition.fret === playedPosition.fret

  return (
    <div className="absolute inset-x-0 bottom-1 flex justify-center">
      <div className="rounded bg-zinc-900/75 px-2 py-1 text-xs font-medium tracking-wide text-zinc-100">
        {samePosition && hoveredLabel ? <p>{hoveredLabel}</p> : null}
        {!samePosition && hoveredLabel ? <p>Hovered: {hoveredLabel}</p> : null}
        {!samePosition && playedLabel ? <p>Played: {playedLabel}</p> : null}
      </div>
    </div>
  )
}

export default function Fretboard({ linear, lowEAtBottom, naturalDecay, frets = DEFAULT_FRETS }: FretboardProps) {
  const fretPositions = useMemo(() => getFretPositions(linear, frets), [linear, frets])
  const stringYPositions = useMemo(
    () => Array.from({ length: STRINGS }, (_, index) => 10 + (index / (STRINGS - 1)) * 80),
    [],
  )
  const stringOrder = useMemo(
    () => (lowEAtBottom ? Array.from({ length: STRINGS }, (_, index) => STRINGS - 1 - index) : Array.from({ length: STRINGS }, (_, index) => index)),
    [lowEAtBottom],
  )
  const audioContextRef = useRef<AudioContext | null>(null)
  const instrumentRef = useRef<ReturnType<typeof Soundfont> | null>(null)
  const [hoveredPosition, setHoveredPosition] = useState<HoveredPosition>(null)
  const isPointerDownRef = useRef(false)
  const lastPlayedRef = useRef<string | null>(null)
  const [playedPosition, setPlayedPosition] = useState<ActivePosition | null>(null)

  const clearPointerPress = useCallback(() => {
    isPointerDownRef.current = false
    lastPlayedRef.current = null
  }, [])

  useEffect(() => {
    window.addEventListener('mouseup', clearPointerPress)
    return () => window.removeEventListener('mouseup', clearPointerPress)
  }, [clearPointerPress])

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close()
    }
  }, [])

  const getInstrument = useCallback(async () => {
    if (instrumentRef.current) {
      return instrumentRef.current
    }

    const context = audioContextRef.current ?? new AudioContext()
    audioContextRef.current = context

    let instrument = Soundfont(context, { instrument: GUITAR_SOUNDFONT })

    try {
      await instrument.ready
    } catch {
      instrument = Soundfont(context, { instrument: FALLBACK_SOUNDFONT })
      await instrument.ready
    }

    instrumentRef.current = instrument
    return instrument
  }, [])

  const playNote = useCallback(
    async (stringIndex: number, fret: number) => {
      setPlayedPosition({ stringIndex, fret })
      const instrument = await getInstrument()
      const context = audioContextRef.current
      if (context && context.state !== 'running') {
        await context.resume()
      }

      const midiNote = OPEN_STRING_MIDI[stringIndex] + fret
      instrument.start({ note: midiNote, velocity: 110, duration: naturalDecay ? 2.4 : 1.0 })
    },
    [getInstrument, naturalDecay],
  )

  const handlePressStart = useCallback(
    (stringIndex: number, fret: number) => {
      isPointerDownRef.current = true
      const positionKey = `${stringIndex}:${fret}`
      lastPlayedRef.current = positionKey
      void playNote(stringIndex, fret)
    },
    [playNote],
  )

  const handlePressEnter = useCallback(
    (stringIndex: number, fret: number) => {
      if (!isPointerDownRef.current) {
        return
      }

      const positionKey = `${stringIndex}:${fret}`
      if (lastPlayedRef.current === positionKey) {
        return
      }

      lastPlayedRef.current = positionKey
      void playNote(stringIndex, fret)
    },
    [playNote],
  )

  return (
    <section className="w-full overflow-x-auto border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="relative mx-auto h-[260px] min-w-[1200px] bg-zinc-50 dark:bg-zinc-800">
        <div className="absolute inset-0 border border-zinc-200 dark:border-zinc-700" />
        <FretLines fretPositions={fretPositions} />
        <StringLines lowEAtBottom={lowEAtBottom} />
        <FretMarkers fretPositions={fretPositions} frets={frets} stringYPositions={stringYPositions} />
        <NoteGrid
          fretPositions={fretPositions}
          frets={frets}
          stringOrder={stringOrder}
          stringYPositions={stringYPositions}
          hoveredPosition={hoveredPosition}
          onHover={(stringIndex, fret) => setHoveredPosition({ stringIndex, fret })}
          onLeave={() => setHoveredPosition(null)}
          onPressStart={handlePressStart}
          onPressEnter={handlePressEnter}
          onPressEnd={clearPointerPress}
        />
        <NoteReadout hoveredPosition={hoveredPosition} playedPosition={playedPosition} />
      </div>
    </section>
  )
}
