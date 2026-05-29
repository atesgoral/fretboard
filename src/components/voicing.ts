import { CHORD_EXTENSIONS, CHORD_QUALITIES, NOTE_NAMES } from './chords'
import type { ChordSelection } from './chordSearch'
import chordVoicingsJson from '../data/chordVoicings.json'

export type PlayedPosition = {
  stringIndex: number
  fret: number
}

export type ChordPositionPreference = 'default' | 'open' | 'moveable'
export type ChordInversionPreference = 'root' | 'first' | 'second'
export type ChordVoicingOptions = {
  positionPreference?: ChordPositionPreference
  inversionPreference?: ChordInversionPreference
}

type StoredVoicing = {
  frets: Array<number | null>
  category?: string
  mustKnow?: boolean | string
  lowFret?: number
  highFret?: number
}

type OolimoTemplate = StoredVoicing & {
  type: string
  bassInterval: string | null
  sourceRoot: string
  transposable: boolean
}

type StoredChord = {
  root: string
  type: string
  bassInterval: string | null
  voicings: StoredVoicing[]
}

type ChordVoicingDatabase = {
  oolimo: {
    templates: OolimoTemplate[]
  }
  supplementalChords: StoredChord[]
}

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
const MAX_FRET_SEARCH = 6
const NOTE_PITCH_CLASS: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}
const ENHARMONIC_ROOT: Record<string, string> = {
  'C#': 'Db',
  Db: 'C#',
  'D#': 'Eb',
  Eb: 'D#',
  'F#': 'Gb',
  Gb: 'F#',
  'G#': 'Ab',
  Ab: 'G#',
  'A#': 'Bb',
  Bb: 'A#',
}
const CATEGORY_ORDER: Record<string, number> = { open: 0, moveable: 1, capo: 2 }
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
  ['dim:', 'dim'],
  ['dim:b7', 'm7(b5)'],
  ['aug:', 'aug'],
  ['sus2:', 'sus2'],
  ['sus4:', 'sus4'],
  ['sus4:b7', '7sus4'],
])
const BASS_INTERVALS_BY_QUALITY = {
  maj: ['3', '5'],
  min: ['m3', '5'],
  dim: ['m3', 'b5'],
  aug: ['3', '#5'],
  sus2: ['9', '5'],
  sus4: ['11', '5'],
} as const
const voicingByRootAndType = new Map(
  chordVoicings.supplementalChords.map((chord) => [
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

function getBassIntervalForInversion(chord: ChordSelection, inversion: ChordInversionPreference) {
  if (inversion === 'root') return null
  const bassIntervals =
    BASS_INTERVALS_BY_QUALITY[chord.qualityId as keyof typeof BASS_INTERVALS_BY_QUALITY]
  return bassIntervals?.[inversion === 'first' ? 0 : 1] ?? null
}

function applyPositionPreference(
  voicings: StoredVoicing[],
  positionPreference: ChordPositionPreference | undefined,
) {
  if (!positionPreference || positionPreference === 'default') return voicings

  const preferred = voicings.filter((voicing) => voicing.category === positionPreference)
  return preferred.length > 0 ? preferred : voicings
}

function transposeFrets(frets: Array<number | null>, sourceRoot: string, targetRoot: string) {
  let transposeBy = NOTE_PITCH_CLASS[targetRoot] - NOTE_PITCH_CLASS[sourceRoot] - 12

  frets.forEach((fret) => {
    if (fret === null) return
    while (fret + transposeBy < 0) {
      transposeBy += 12
    }
  })

  const transposed = frets.map((fret) => (fret === null ? null : fret + transposeBy))
  return transposed.some((fret) => fret !== null && fret > 15) ? null : transposed
}

function getTemplateCategory(root: string, template: OolimoTemplate) {
  if (template.transposable) return 'moveable'
  if (template.sourceRoot === root || ENHARMONIC_ROOT[template.sourceRoot] === root) return 'open'
  return 'capo'
}

function getTemplateVoicing(root: string, template: OolimoTemplate): StoredVoicing | null {
  const frets =
    root === template.sourceRoot
      ? template.frets
      : transposeFrets(template.frets, template.sourceRoot, root)
  if (!frets) return null

  const playedFrets = frets.filter((fret) => fret !== null)
  if (playedFrets.length === 0) return null

  return {
    frets,
    category: getTemplateCategory(root, template),
    mustKnow: template.mustKnow === true || template.mustKnow === root,
    lowFret: Math.min(...playedFrets),
    highFret: Math.max(...playedFrets),
  }
}

function compareVoicings(left: StoredVoicing, right: StoredVoicing) {
  const mustKnow = Number(Boolean(right.mustKnow)) - Number(Boolean(left.mustKnow))
  if (mustKnow !== 0) return mustKnow

  const category =
    (CATEGORY_ORDER[left.category ?? 'moveable'] ?? 99) -
    (CATEGORY_ORDER[right.category ?? 'moveable'] ?? 99)
  if (category !== 0) return category

  const lowFret = (left.lowFret ?? 99) - (right.lowFret ?? 99)
  if (lowFret !== 0) return lowFret

  return (left.highFret ?? 99) - (right.highFret ?? 99)
}

function getOolimoVoicing(
  root: string,
  type: string,
  bassInterval: string | null,
  positionPreference: ChordPositionPreference | undefined,
): StoredVoicing | null {
  const voicings = chordVoicings.oolimo.templates
    .filter((template) => template.type === type && template.bassInterval === bassInterval)
    .map((template) => getTemplateVoicing(root, template))
    .filter((voicing): voicing is StoredVoicing => voicing !== null)
    .sort(compareVoicings)

  return applyPositionPreference(voicings, positionPreference)[0] ?? null
}

function getStoredVoicing(
  chord: ChordSelection,
  type: string,
  bassInterval: string | null,
  positionPreference: ChordPositionPreference | undefined,
) {
  const supplemental = voicingByRootAndType.get(getVoicingKey(chord.root, type, bassInterval))
  if (supplemental?.[0]) {
    return applyPositionPreference(supplemental, positionPreference)[0]
  }
  return getOolimoVoicing(chord.root, type, bassInterval, positionPreference)
}

export function getImportedVoicing(
  chord: ChordSelection,
  options: ChordVoicingOptions = {},
): PlayedPosition[] | null {
  const databaseType = DATABASE_CHORD_TYPE_BY_SELECTION.get(getSelectionSignature(chord))
  if (!databaseType) return null

  const requestedBassInterval = getBassIntervalForInversion(
    chord,
    options.inversionPreference ?? 'root',
  )
  const voicing =
    getStoredVoicing(chord, databaseType, requestedBassInterval, options.positionPreference) ??
    getStoredVoicing(chord, databaseType, null, options.positionPreference)
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

export function buildCommonVoicing(
  chord: ChordSelection,
  options: ChordVoicingOptions = {},
): PlayedPosition[] {
  const databaseVoicing = getImportedVoicing(chord, options)
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
