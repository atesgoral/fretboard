import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Reverb, Soundfont } from 'smplr'

const STRINGS = 6
const DEFAULT_FRETS = 18
const MARKER_FRETS = new Set([3, 5, 7, 9])
const STRING_THICKNESSES = [4, 3.5, 3, 2.5, 2, 1.5]
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
const GUITAR_SOUNDFONT = 'acoustic_guitar_nylon'
const FALLBACK_SOUNDFONT = 'acoustic_guitar_steel'
const REVERB_STORAGE_KEY = 'cadence_reverb'
const DEFAULT_REVERB_LEVEL = 0.15

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
  reverbEnabled: boolean
  muted: boolean
  frets?: number
  chordRoles: Map<number, string>
  playedPositions: ActivePosition[]
  playSequence: number
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
          transform: 'translateX(-2px)',
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

type FretLabelsProps = {
  fretPositions: number[]
  frets: number
}

function FretLabels({ fretPositions, frets }: FretLabelsProps) {
  return (
    <div className="relative mx-auto mt-2 h-5 min-w-[1200px]">
      <span
        className="absolute -translate-x-1/2 text-xs font-medium tracking-wide text-zinc-600 dark:text-zinc-300"
        style={{ left: `${((fretPositions[0] + fretPositions[1]) / 2) * 100}%` }}
      >
        O
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
      <span className="open-string-burst-wave open-string-burst-wave-up" style={{ '--string-thickness': `${stringThickness}px` } as React.CSSProperties} />
      <span className="open-string-burst-wave open-string-burst-wave-down" style={{ '--string-thickness': `${stringThickness}px` } as React.CSSProperties} />
    </div>
  )
}

type StringHoverOverlayProps = {
  isVisible: boolean
}

function StringHoverOverlay({ isVisible }: StringHoverOverlayProps) {
  if (!isVisible) {
    return null
  }

  return (
    <span className="pointer-events-none block h-full w-full bg-zinc-600/10 ring-1 ring-inset ring-zinc-600/35 dark:bg-zinc-100/10 dark:ring-zinc-100/35" />
  )
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

function NoteGrid({ fretPositions, frets, stringOrder, stringYPositions, hoveredPosition, onHover, onLeave, onPressStart, onPressEnter, onPressEnd, chordRoles, activePositions, burstActivePositions, animatedPositionBursts, stringThicknesses }: NoteGridProps) {
  const stringBandBounds = getStringBandBounds(stringYPositions)
  const activePositionSet = new Set(activePositions.map((position) => `${position.stringIndex}:${position.fret}`))
  const burstActivePositionSet = new Set(burstActivePositions.map((position) => `${position.stringIndex}:${position.fret}`))
  const activeOpenStringVisualIndexes = stringOrder.reduce<Array<{ visualIndex: number; stringThickness: number }>>((indexes, stringIndex, visualIndex) => {
    const isOpenStringActive = activePositionSet.has(`${stringIndex}:0`)
    const hasFrettedNoteOnString = activePositions.some((position) => position.stringIndex === stringIndex && position.fret > 0)

    if (isOpenStringActive && !hasFrettedNoteOnString) {
      indexes.push({ visualIndex, stringThickness: stringThicknesses[visualIndex] })
    }
    return indexes
  }, [])


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
          const shouldHighlightWholeString = isHovered && fret === 0
          const noteClass = (OPEN_STRING_MIDI[stringIndex] + fret) % 12
          const role = chordRoles.get(noteClass)
          const positionKey = `${stringIndex}:${fret}`
          const isActive = activePositionSet.has(positionKey)
          const burstKey = animatedPositionBursts[positionKey] ?? 0
          const shouldRenderBurst = burstActivePositionSet.has(positionKey) && burstKey > 0

          return (
            <button
              key={`note-${stringIndex}-${fret}`}
              type="button"
              title={`Play string ${stringIndex + 1}, fret ${fret}`}
              className="absolute cursor-pointer border-0 bg-transparent p-0"
              style={{ left, top, width, height }}
              onMouseEnter={() => onHover(stringIndex, fret)}
              onMouseMove={() => onPressEnter(stringIndex, fret)}
              onMouseLeave={onLeave}
              onMouseDown={() => onPressStart(stringIndex, fret)}
              onMouseUp={onPressEnd}
            >
              <StringHoverOverlay isVisible={isHovered && !shouldHighlightWholeString} />
              {role ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  {shouldRenderBurst ? <span key={`burst-${positionKey}-${burstKey}`} className="note-burst-wave" /> : null}
                  <span className={`relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold text-zinc-900 shadow-sm ${isActive ? 'border-blue-900/30 bg-blue-500 dark:border-blue-200/40 dark:bg-blue-300' : 'border-amber-900/20 bg-amber-500 dark:border-amber-200/30 dark:bg-amber-300'}`}>
                    {role}
                  </span>
                </span>
              ) : null}
            </button>
          )
        })
      })}
      {activeOpenStringVisualIndexes.map(({ visualIndex, stringThickness }) => {
        const band = stringBandBounds[visualIndex]
        return <OpenStringPulseOverlay key={`active-open-string-${visualIndex}`} top={band.top} bottom={band.bottom} stringThickness={stringThickness} />
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
    <div className="relative flex min-h-10 items-center py-2">
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
  chordRoles,
  playedPositions,
  playSequence,
}: FretboardProps) {
  const fretPositions = useMemo(() => getFretPositions(linear, frets), [linear, frets])
  const stringYPositions = useMemo(
    () => Array.from({ length: STRINGS }, (_, index) => 10 + (index / (STRINGS - 1)) * 80),
    [],
  )
  const stringThicknesses = useMemo(
    () => (lowEAtBottom ? [...STRING_THICKNESSES].reverse() : STRING_THICKNESSES),
    [lowEAtBottom],
  )
  const stringOrder = useMemo(
    () => (lowEAtBottom ? Array.from({ length: STRINGS }, (_, index) => STRINGS - 1 - index) : Array.from({ length: STRINGS }, (_, index) => index)),
    [lowEAtBottom],
  )
  const audioContextRef = useRef<AudioContext | null>(null)
  const instrumentRef = useRef<ReturnType<typeof Soundfont> | null>(null)
  const dryGainRef = useRef<GainNode | null>(null)
  const wetGainRef = useRef<GainNode | null>(null)
  const [hoveredPosition, setHoveredPosition] = useState<HoveredPosition>(null)
  const reverbEnabledRef = useRef(reverbEnabled)
  const isPointerDownRef = useRef(false)
  const lastPlayedRef = useRef<string | null>(null)
  const [recentlyPlayedPositions, setRecentlyPlayedPositions] = useState<ActivePosition[]>([])
  const [animatedPositionBursts, setAnimatedPositionBursts] = useState<Record<string, number>>({})
  const excitationByStringRef = useRef<ExcitationState[]>(
    Array.from({ length: STRINGS }, () => ({ level: 0, timestampMs: 0 })),
  )

  const activePosition = hoveredPosition
  const activeNotes = hoveredPosition
    ? activePosition
      ? [getNoteIdentity(activePosition)]
      : []
    : recentlyPlayedPositions.map(getNoteIdentity)
  const activePositions = hoveredPosition
    ? activePosition
      ? [activePosition]
      : []
    : recentlyPlayedPositions
  const burstActivePositions = recentlyPlayedPositions


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

  useEffect(() => {
    reverbEnabledRef.current = reverbEnabled
    const mix = reverbEnabled ? getStoredReverbLevel() : 0
    if (dryGainRef.current) dryGainRef.current.gain.value = 1 - mix
    if (wetGainRef.current) wetGainRef.current.gain.value = mix
  }, [reverbEnabled])

  const getInstrument = useCallback(async () => {
    if (instrumentRef.current) {
      return instrumentRef.current
    }

    const context = audioContextRef.current ?? new AudioContext()
    audioContextRef.current = context

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

    let instrument = Soundfont(context, { instrument: GUITAR_SOUNDFONT, destination: highpassFilter })

    try {
      await instrument.ready
    } catch {
      instrument = Soundfont(context, { instrument: FALLBACK_SOUNDFONT, destination: highpassFilter })
      await instrument.ready
    }

    instrumentRef.current = instrument
    return instrument
  }, [])


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

  const playNote = useCallback(
    async (stringIndex: number, fret: number, triggerType: TriggerType) => {
      if (muted) {
        return
      }
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
    [getInstrument, muted, naturalDecay],
  )

  const handlePressStart = useCallback(
    (stringIndex: number, fret: number) => {
      isPointerDownRef.current = true
      const positionKey = `${stringIndex}:${fret}`
      lastPlayedRef.current = positionKey
      markRecentlyPlayed([{ stringIndex, fret }])
      void playNote(stringIndex, fret, 'pick')
    },
    [markRecentlyPlayed, playNote],
  )

  useEffect(() => {
    if (playSequence === 0 || playedPositions.length === 0) {
      return
    }

    markRecentlyPlayed(playedPositions)
    playedPositions.forEach((position) => {
      void playNote(position.stringIndex, position.fret, 'pick')
    })
  }, [markRecentlyPlayed, playNote, playSequence, playedPositions])

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
      markRecentlyPlayed([{ stringIndex, fret }])
      void playNote(stringIndex, fret, 'slide')
    },
    [markRecentlyPlayed, playNote],
  )

  return (
    <section className="w-full overflow-x-auto border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="relative mx-auto h-[260px] min-w-[1200px] bg-zinc-50 dark:bg-zinc-800">
        <div className="absolute inset-0 border border-zinc-200 dark:border-zinc-700" />
        <FretLines fretPositions={fretPositions} frets={frets} />
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
          activePositions={activePositions}
          burstActivePositions={burstActivePositions}
          animatedPositionBursts={animatedPositionBursts}
          stringThicknesses={stringThicknesses}
        />
      </div>
      <FretLabels fretPositions={fretPositions} frets={frets} />
      <NoteReadout activeNotes={activeNotes} />
    </section>
  )
}
