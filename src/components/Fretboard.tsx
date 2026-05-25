import { useMemo } from 'react'

const STRINGS = 6
const FRETS = 12
const MARKER_FRETS = new Set([3, 5, 7, 9])

function getFretPositions(linear: boolean) {
  if (linear) {
    return Array.from({ length: FRETS + 1 }, (_, index) => index / FRETS)
  }

  const scaleLength = 1
  const nutToFret = Array.from({ length: FRETS + 1 }, (_, fret) => scaleLength - scaleLength / 2 ** (fret / 12))
  const maxDistance = nutToFret[FRETS]

  return nutToFret.map((distance) => distance / maxDistance)
}

type FretboardProps = {
  linear: boolean
}

export default function Fretboard({ linear }: FretboardProps) {
  const fretPositions = useMemo(() => getFretPositions(linear), [linear])

  return (
    <section className="w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="relative mx-auto h-[260px] min-w-[900px] rounded-xl bg-zinc-50">
        <div className="absolute inset-0 rounded-xl border border-zinc-200" />

        {Array.from({ length: FRETS + 1 }, (_, fret) => {
          const left = `${fretPositions[fret] * 100}%`
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
        })}

        {Array.from({ length: STRINGS }, (_, index) => {
          const top = `${(index / (STRINGS - 1)) * 100}%`

          return (
            <div
              key={`string-${index}`}
              className="absolute left-0 right-0 h-px bg-zinc-600"
              style={{ top, transform: 'translateY(-0.5px)' }}
            />
          )
        })}

        {Array.from({ length: FRETS - 1 }, (_, i) => i + 1)
          .filter((fret) => MARKER_FRETS.has(fret))
          .map((fret) => {
            const midpoint = (fretPositions[fret] + fretPositions[fret + 1]) / 2

            return (
              <div
                key={`marker-${fret}`}
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-zinc-300 bg-zinc-200"
                style={{ left: `calc(${midpoint * 100}% - 8px)` }}
              />
            )
          })}

        {(() => {
          const midpoint = (fretPositions[12] + fretPositions[11]) / 2

          return (
            <>
              <div
                className="absolute h-3 w-3 rounded-full border border-zinc-300 bg-zinc-200"
                style={{ left: `calc(${midpoint * 100}% - 6px)`, top: '38%' }}
              />
              <div
                className="absolute h-3 w-3 rounded-full border border-zinc-300 bg-zinc-200"
                style={{ left: `calc(${midpoint * 100}% - 6px)`, top: '62%' }}
              />
            </>
          )
        })()}
      </div>
    </section>
  )
}
