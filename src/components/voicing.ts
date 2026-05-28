import { NOTE_NAMES } from './chords'
import { getChordTones } from './chordTones'
export { getChordPitchClasses } from './chordTones'
import type { ChordPlayback, ChordInversion, ChordPlayStyle } from './chordPlayback'
import { DEFAULT_CHORD_PLAYBACK } from './chordPlayback'
import type { ChordSelection } from './chordSearch'
import { lookupVoicingShape } from './voicingShapes'

export type PlayedPosition = {
  stringIndex: number
  fret: number
}

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
const MAX_FRET_SEARCH = 12
const REGISTER_FRET_SHIFT = 3
const MAX_FRET = 15
const FINGER_VOICE_COUNT = 4

const UPPER_VOICE_ROLE_PRIORITY = [
  '3',
  'm3',
  'b7',
  '7',
  '5',
  '9',
  '13',
  '11',
  '#11',
  '2',
  '4',
  'R',
] as const

function isShellRole(role: string) {
  return role === 'R' || role === '3' || role === 'm3' || role === 'b7' || role === '7'
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

function rolePriority(role: string) {
  const index = UPPER_VOICE_ROLE_PRIORITY.indexOf(
    role as (typeof UPPER_VOICE_ROLE_PRIORITY)[number],
  )
  return index === -1 ? UPPER_VOICE_ROLE_PRIORITY.length : index
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

/** Thumb on bass; up to three upper voices on higher strings (bossa-style). */
function buildFingerVoicing(tones: ChordTone[], bassPitchClass: number): PlayedPosition[] {
  const positions: PlayedPosition[] = []

  for (let stringIndex = 0; stringIndex < OPEN_STRING_MIDI.length; stringIndex += 1) {
    const bassFrets = findFretsForString(stringIndex, [bassPitchClass])
    if (bassFrets.length === 0) {
      continue
    }
    positions.push({ stringIndex, fret: bassFrets[0] })
    break
  }

  if (positions.length === 0) {
    return positions
  }

  const bassString = positions[0].stringIndex
  const usedPitchClasses = new Set([bassPitchClass])

  for (
    let stringIndex = bassString + 1;
    stringIndex < OPEN_STRING_MIDI.length && positions.length < FINGER_VOICE_COUNT;
    stringIndex += 1
  ) {
    const candidates: { fret: number; pitchClass: number; priority: number; isNew: boolean }[] = []

    tones.forEach((tone) => {
      if (tone.role === 'R' && tone.pitchClass === bassPitchClass) {
        return
      }

      const frets = findFretsForString(stringIndex, [tone.pitchClass])
      frets.forEach((fret) => {
        candidates.push({
          fret,
          pitchClass: tone.pitchClass,
          priority: rolePriority(tone.role),
          isNew: !usedPitchClasses.has(tone.pitchClass),
        })
      })
    })

    if (candidates.length === 0) {
      continue
    }

    candidates.sort((a, b) => {
      if (a.isNew !== b.isNew) {
        return a.isNew ? -1 : 1
      }
      return a.priority - b.priority
    })

    const best = candidates[0]
    positions.push({ stringIndex, fret: best.fret })
    usedPitchClasses.add(best.pitchClass)
  }

  return positions
}

function buildStrumVoicing(
  tones: ChordTone[],
  bassPitchClass: number,
  allowedPitchClasses: number[],
): PlayedPosition[] {
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

  return positions.length >= 4 ? positions : positions.slice(0, 3)
}

function buildVoicingForStyle(
  style: ChordPlayStyle,
  tones: ChordTone[],
  bassPitchClass: number,
  allowedPitchClasses: number[],
): PlayedPosition[] {
  if (style === 'finger') {
    return buildFingerVoicing(tones, bassPitchClass)
  }

  const positions = buildStrumVoicing(tones, bassPitchClass, allowedPitchClasses)
  return style === 'shell' ? positions.slice(0, 4) : positions
}

export function buildChordVoicing(
  chord: ChordSelection,
  playback: ChordPlayback = DEFAULT_CHORD_PLAYBACK,
): PlayedPosition[] {
  const curated = lookupVoicingShape(chord, playback)
  if (curated) {
    return curated
  }

  const tones = getChordTones(chord)
  const pitchClasses = tones.map((tone) => tone.pitchClass)
  const allowedPitchClasses =
    playback.style === 'shell'
      ? tones.filter((tone) => isShellRole(tone.role)).map((tone) => tone.pitchClass)
      : pitchClasses

  const bassPitchClass = getBassPitchClass(tones, playback.inversion)
  let voicing = buildVoicingForStyle(playback.style, tones, bassPitchClass, allowedPitchClasses)

  voicing = shiftPositionsByRegister(voicing, playback.register)
  return voicing
}

export function buildCommonVoicing(chord: ChordSelection): PlayedPosition[] {
  return buildChordVoicing(chord, DEFAULT_CHORD_PLAYBACK)
}
