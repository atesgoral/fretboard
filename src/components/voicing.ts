import { CHORD_EXTENSIONS, CHORD_QUALITIES, NOTE_NAMES } from './chords'
import type { ChordSelection } from './chordSearch'
import chordVoicingsJson from '../data/chordVoicings.json'

export type PlayedPosition = {
  stringIndex: number
  fret: number
}

type StoredVoicing = {
  frets: Array<number | null>
}

type StoredChord = {
  root: string
  type: string
  bassInterval: string | null
  voicings: StoredVoicing[]
}

type ChordVoicingDatabase = {
  chords: StoredChord[]
}

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
const MAX_FRET_SEARCH = 6
const chordVoicings = chordVoicingsJson as ChordVoicingDatabase
const DATABASE_CHORD_TYPE_BY_SELECTION = new Map([
  ['maj:', 'major'],
  ['maj:13', '6'],
  ['maj:7', 'maj7'],
  ['maj:7,9', 'maj7(9)'],
  ['maj:7,#11', 'maj7(#11)'],
  ['maj:7,9,#11,13', 'maj7(13)'],
  ['maj:b7', '7'],
  ['maj:b7,9', '7(9)'],
  ['maj:b7,9,13', '7(13)'],
  ['min:', 'm'],
  ['min:b7', 'm7'],
  ['min:b7,9', 'm7(9)'],
  ['dim:b7', 'm7(b5)'],
  ['aug:', 'aug'],
  ['sus2:', 'sus2'],
  ['sus4:', 'sus4'],
  ['sus4:b7', '7sus4'],
])
const voicingByRootAndType = new Map(
  chordVoicings.chords.map((chord) => [
    getVoicingKey(chord.root, chord.type, chord.bassInterval),
    chord.voicings,
  ]),
)

function getVoicingKey(root: string, type: string, bassInterval: string | null) {
  return `${root}:${type}:${bassInterval ?? ''}`
}

function getSelectionSignature(chord: ChordSelection) {
  return `${chord.qualityId}:${chord.extensionIds.join(',')}`
}

function getDatabaseVoicing(chord: ChordSelection): PlayedPosition[] | null {
  const databaseType = DATABASE_CHORD_TYPE_BY_SELECTION.get(getSelectionSignature(chord))
  if (!databaseType) return null

  const voicing = voicingByRootAndType.get(getVoicingKey(chord.root, databaseType, null))?.[0]
  if (!voicing) return null

  const positions = voicing.frets
    .map((fret, stringIndex) => (fret === null ? null : { stringIndex, fret }))
    .filter((position): position is PlayedPosition => position !== null)

  return positions.length > 0 ? positions : null
}

export function getChordPitchClasses(chord: ChordSelection) {
  const rootIndex = NOTE_NAMES.indexOf(chord.root)
  const quality = CHORD_QUALITIES.find((item) => item.id === chord.qualityId) ?? CHORD_QUALITIES[0]
  const intervals = [...quality.intervals]

  chord.extensionIds.forEach((id) => {
    const extension = CHORD_EXTENSIONS.find((item) => item.id === id)
    if (extension) {
      intervals.push(extension.interval)
    }
  })

  return Array.from(new Set(intervals.map((interval) => (rootIndex + interval) % 12)))
}

export function buildCommonVoicing(chord: ChordSelection): PlayedPosition[] {
  const databaseVoicing = getDatabaseVoicing(chord)
  if (databaseVoicing) return databaseVoicing

  const pitchClasses = getChordPitchClasses(chord)
  const positions = OPEN_STRING_MIDI.map((openMidi, stringIndex) => {
    const fret = Array.from({ length: MAX_FRET_SEARCH }, (_, index) => index).find(
      (candidateFret) => pitchClasses.includes((openMidi + candidateFret) % 12),
    )
    return fret === undefined ? null : { stringIndex, fret }
  }).filter((position): position is PlayedPosition => position !== null)

  return positions.length >= 4 ? positions : positions.slice(0, 3)
}
