import { useMemo } from 'react'

const STRINGS = 6
const DEFAULT_FRETS = 18
const MARKER_FRETS = new Set([3, 5, 7, 9])
const STRING_THICKNESSES = [4, 3.5, 3, 2.5, 2, 1.5]

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

export default function Fretboard({ linear, frets = DEFAULT_FRETS }: FretboardProps) {
  const fretPositions = useMemo(() => getFretPositions(linear, frets), [linear, frets])

  return (
    <section className="w-full overflow-x-auto border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="relative mx-auto h-[260px] min-w-[1200px] bg-zinc-50">
        <div className="absolute inset-0 border border-zinc-200" />
        <FretLines fretPositions={fretPositions} />
        <StringLines />
        <FretMarkers fretPositions={fretPositions} frets={frets} />
      </div>
    </section>
  )
}
