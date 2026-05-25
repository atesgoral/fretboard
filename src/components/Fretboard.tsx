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
        className={`absolute top-0 h-full ${isNut ? 'bg-zinc-700' : 'bg-zinc-300'}`}
        style={{
          left,
          width: isNut ? '4px' : '2px',
          transform: isNut ? 'translateX(0)' : 'translateX(-1px)',
        }}
      />
    )
  })
}

function StringLines() {
  return Array.from({ length: STRINGS }, (_, index) => {
    const top = `${10 + (index / (STRINGS - 1)) * 80}%`

    return (
      <div
        key={`string-${index}`}
        className="absolute left-0 right-0 bg-zinc-600"
        style={{
          top,
          height: `${STRING_THICKNESSES[index]}px`,
          transform: `translateY(-${STRING_THICKNESSES[index] / 2}px)`,
        }}
      />
    )
  })
}

type FretMarkersProps = {
  fretPositions: number[]
  frets: number
}

function FretMarkers({ fretPositions, frets }: FretMarkersProps) {
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
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-zinc-300 bg-zinc-200"
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

        return (
          <div key={`double-marker-${octaveFret}`}>
            <div
              className="absolute h-3 w-3 rounded-full border border-zinc-300 bg-zinc-200"
              style={{ left: `calc(${midpoint * 100}% - 6px)`, top: '38%' }}
            />
            <div
              className="absolute h-3 w-3 rounded-full border border-zinc-300 bg-zinc-200"
              style={{ left: `calc(${midpoint * 100}% - 6px)`, top: '62%' }}
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

type NoteGridProps = {
  fretPositions: number[]
  frets: number
  hoveredPosition: HoveredPosition
  onHover: (stringIndex: number, fret: number) => void
  onLeave: () => void
  onPlay: (stringIndex: number, fret: number) => void
}

function NoteGrid({ fretPositions, frets, hoveredPosition, onHover, onLeave, onPlay }: NoteGridProps) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {Array.from({ length: STRINGS }, (_, stringIndex) => {
        const y = 10 + (stringIndex / (STRINGS - 1)) * 80

        return Array.from({ length: frets }, (_, fret) => {
          const x = ((fretPositions[fret] + fretPositions[fret + 1]) / 2) * 100
          const isHovered =
            hoveredPosition?.stringIndex === stringIndex && hoveredPosition?.fret === fret

          return (
            <g key={`note-${stringIndex}-${fret}`}>
              <circle
                cx={x}
                cy={y}
                r={3.8}
                fill="transparent"
                onMouseEnter={() => onHover(stringIndex, fret)}
                onMouseLeave={onLeave}
                onMouseDown={() => onPlay(stringIndex, fret)}
              />
              {isHovered ? <circle cx={x} cy={y} r={2.4} fill="#3f3f46" fillOpacity={0.7} /> : null}
            </g>
          )
        })
      })}
    </svg>
  )
}

export default function Fretboard({ linear, frets = DEFAULT_FRETS }: FretboardProps) {
  const fretPositions = useMemo(() => getFretPositions(linear, frets), [linear, frets])
  const audioContextRef = useRef<AudioContext | null>(null)
  const instrumentRef = useRef<ReturnType<typeof Soundfont> | null>(null)
  const [hoveredPosition, setHoveredPosition] = useState<HoveredPosition>(null)

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
      const instrument = await getInstrument()
      const context = audioContextRef.current
      if (context && context.state !== 'running') {
        await context.resume()
      }

      const midiNote = OPEN_STRING_MIDI[stringIndex] + fret
      instrument.start({ note: midiNote, velocity: 110, duration: 1.6 })
    },
    [getInstrument],
  )

  return (
    <section className="w-full overflow-x-auto border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="relative mx-auto h-[260px] min-w-[1200px] bg-zinc-50">
        <div className="absolute inset-0 border border-zinc-200" />
        <FretLines fretPositions={fretPositions} />
        <StringLines />
        <FretMarkers fretPositions={fretPositions} frets={frets} />
        <NoteGrid
          fretPositions={fretPositions}
          frets={frets}
          hoveredPosition={hoveredPosition}
          onHover={(stringIndex, fret) => setHoveredPosition({ stringIndex, fret })}
          onLeave={() => setHoveredPosition(null)}
          onPlay={playNote}
        />
      </div>
    </section>
  )
}
