import { CHORD_EXTENSIONS, CHORD_QUALITIES, NOTE_NAMES } from './chords'
import type { ChordPlayback, ChordInversion } from './chordPlayback'
import { DEFAULT_CHORD_PLAYBACK } from './chordPlayback'
import type { ChordSelection } from './chordSearch'

export type PlayedPosition = {
  stringIndex: number
  fret: number
}

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
const MAX_FRET_SEARCH = 12
const REGISTER_FRET_SHIFT = 3
const MAX_FRET = 15

type ChordTone = {
  pitchClass: number
  role: string
  interval: number
}

function isShellRole(role: string) {
  return role === 'R' || role === '3' || role === 'm3' || role === 'b7' || role === '7'
}

function getChordTones(chord: ChordSelection): ChordTone[] {
  const rootIndex = NOTE_NAMES.indexOf(chord.root)
  const quality = CHORD_QUALITIES.find((item) => item.id === chord.qualityId) ?? CHORD_QUALITIES[0]
  const tones: ChordTone[] = quality.intervals.map((interval, index) => ({
    pitchClass: (rootIndex + interval) % 12,
    role: quality.roles[index],
    interval,
  }))

  chord.extensionIds.forEach((id) => {
    const extension = CHORD_EXTENSIONS.find((item) => item.id === id)
    if (!extension) {
      return
    }
    tones.push({
      pitchClass: (rootIndex + extension.interval) % 12,
      role: extension.role,
      interval: extension.interval,
    })
  })

  return tones.sort((a, b) => a.interval - b.interval)
}

function getBassPitchClass(tones: ChordTone[], inversion: ChordInversion) {
  const triadTones = tones.filter((tone) => ['R', '3', 'm3', '4', '2', '5'].includes(tone.role))
  const bassTone = triadTones[Math.min(inversion, triadTones.length - 1)] ?? tones[0]
  return bassTone.pitchClass
}

function findFretsForString(stringIndex: number, pitchClasses: number[]) {
  const openMidi = OPEN_STRING_MIDI[stringIndex]
  return Array.from({ length: MAX_FRET_SEARCH + 1 }, (_, fret) => fret).filter((fret) =>
    pitchClasses.includes((openMidi + fret) % 12),
  )
}

function shiftPositionsByRegister(
  positions: PlayedPosition[],
  register: ChordPlayback['register'],
) {
  if (register === 0 || positions.length === 0) {
    return positions
  }

  const shift = register * REGISTER_FRET_SHIFT
  const shifted = positions.map((position) => ({
    ...position,
    fret: position.fret + shift,
  }))

  if (shifted.some((position) => position.fret < 0 || position.fret > MAX_FRET)) {
    return positions
  }

  return shifted
}

export function getChordPitchClasses(chord: ChordSelection) {
  return Array.from(new Set(getChordTones(chord).map((tone) => tone.pitchClass)))
}

export function buildChordVoicing(
  chord: ChordSelection,
  playback: ChordPlayback = DEFAULT_CHORD_PLAYBACK,
): PlayedPosition[] {
  const tones = getChordTones(chord)
  const pitchClasses = tones.map((tone) => tone.pitchClass)
  const allowedPitchClasses =
    playback.style === 'shell'
      ? tones.filter((tone) => isShellRole(tone.role)).map((tone) => tone.pitchClass)
      : pitchClasses

  const bassPitchClass = getBassPitchClass(tones, playback.inversion)
  const positions: PlayedPosition[] = []

  for (let stringIndex = 0; stringIndex < OPEN_STRING_MIDI.length; stringIndex += 1) {
    const frets = findFretsForString(stringIndex, allowedPitchClasses)
    if (frets.length === 0) {
      continue
    }

    const isBassString = positions.length === 0
    const fret = isBassString
      ? (frets.find(
          (candidate) => (OPEN_STRING_MIDI[stringIndex] + candidate) % 12 === bassPitchClass,
        ) ?? frets[0])
      : frets[0]

    positions.push({ stringIndex, fret })
  }

  let voicing =
    playback.style === 'shell'
      ? positions.slice(0, 4)
      : positions.length >= 4
        ? positions
        : positions.slice(0, 3)

  voicing = shiftPositionsByRegister(voicing, playback.register)
  return voicing
}

export function buildCommonVoicing(chord: ChordSelection): PlayedPosition[] {
  return buildChordVoicing(chord, DEFAULT_CHORD_PLAYBACK)
}
