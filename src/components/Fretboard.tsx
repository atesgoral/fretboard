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
  chordRoles: Map<number, string>
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

type ExcitationState = {
  level: number
  timestampMs: number
}

type TriggerType = 'pick' | 'slide'

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
  chordRoles: Map<number, string>
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

function NoteGrid({ fretPositions, frets, stringOrder, stringYPositions, hoveredPosition, onHover, onLeave, onPressStart, onPressEnter, onPressEnd, chordRoles }: NoteGridProps) {
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
          const noteClass = (OPEN_STRING_MIDI[stringIndex] + fret) % 12
          const role = chordRoles.get(noteClass)

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
              {role ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 inline-flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-900/20 bg-amber-500 text-[11px] font-semibold text-zinc-900 shadow-sm dark:border-amber-200/30 dark:bg-amber-300">
                  {role}
                </span>
              ) : null}
            </button>
          )
        })
      })}
    </div>
  )
}

type NoteIdentity = {
  name: string
  frequencyHz: string
}

type NoteReadoutProps = {
  activeNote: NoteIdentity | null
}

function getNoteName(midiNote: number) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  return noteNames[midiNote % 12]
}

function getFrequency(midiNote: number) {
  return 440 * 2 ** ((midiNote - 69) / 12)
}

function getNoteIdentity(position: ActivePosition): NoteIdentity {
  const midiNote = OPEN_STRING_MIDI[position.stringIndex] + position.fret
  return {
    name: getNoteName(midiNote),
    frequencyHz: `${getFrequency(midiNote).toFixed(2)} Hz`,
  }
}

function NoteReadout({ activeNote }: NoteReadoutProps) {
  return (
    <div className="flex min-h-10 items-center justify-center py-2">
      {activeNote ? (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 px-3 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
            {activeNote.name}
          </span>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{activeNote.frequencyHz}</span>
        </div>
      ) : null}
    </div>
  )
}

export default function Fretboard({ linear, lowEAtBottom, naturalDecay, frets = DEFAULT_FRETS, chordRoles }: FretboardProps) {
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
  const excitationByStringRef = useRef<ExcitationState[]>(
    Array.from({ length: STRINGS }, () => ({ level: 0, timestampMs: 0 })),
  )

  const activePosition = hoveredPosition ?? playedPosition
  const activeNote = activePosition ? getNoteIdentity(activePosition) : null

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
    async (stringIndex: number, fret: number, triggerType: TriggerType) => {
      setPlayedPosition({ stringIndex, fret })
      const instrument = await getInstrument()
      const context = audioContextRef.current
      if (context && context.state !== 'running') {
        await context.resume()
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
    [getInstrument, naturalDecay],
  )

  const handlePressStart = useCallback(
    (stringIndex: number, fret: number) => {
      isPointerDownRef.current = true
      const positionKey = `${stringIndex}:${fret}`
      lastPlayedRef.current = positionKey
      void playNote(stringIndex, fret, 'pick')
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
      void playNote(stringIndex, fret, 'slide')
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
          chordRoles={chordRoles}
        />
      </div>
      <NoteReadout activeNote={activeNote} />
    </section>
  )
}
