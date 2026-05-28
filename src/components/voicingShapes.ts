import { NOTE_NAMES, type NoteName } from './chords'
import type { ChordPlayback, ChordInversion, ChordPlayStyle } from './chordPlayback'
import type { ChordSelection } from './chordSearch'
import { getChordPitchClasses } from './chordTones'
import type { PlayedPosition } from './voicing'

const MAX_FRET = 15
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]

/**
 * Curated fretboard shapes (reference key + transposition).
 * Heuristic voicing is only a fallback when no template matches.
 */
export type VoicingShapeTemplate = {
  id: string
  style: ChordPlayStyle
  qualityId: string
  extensionIds: string[]
  inversion: ChordInversion
  register: ChordPlayback['register']
  referenceRoot: NoteName
  /** false when the shape uses open strings and only fits referenceRoot */
  movable: boolean
  positions: PlayedPosition[]
}

export const VOICING_SHAPE_TEMPLATES: VoicingShapeTemplate[] = [
  {
    id: 'c-maj-finger-bossa',
    style: 'finger',
    qualityId: 'maj',
    extensionIds: [],
    inversion: 0,
    register: 0,
    referenceRoot: 'C',
    movable: false,
    positions: [
      { stringIndex: 1, fret: 3 },
      { stringIndex: 2, fret: 2 },
      { stringIndex: 3, fret: 0 },
      { stringIndex: 4, fret: 1 },
    ],
  },
  {
    id: 'c-maj7-shell-low',
    style: 'shell',
    qualityId: 'maj',
    extensionIds: ['7'],
    inversion: 0,
    register: 0,
    referenceRoot: 'C',
    movable: true,
    positions: [
      { stringIndex: 0, fret: 8 },
      { stringIndex: 1, fret: 7 },
      { stringIndex: 2, fret: 9 },
    ],
  },
  {
    id: 'c-min7-shell-low',
    style: 'shell',
    qualityId: 'min',
    extensionIds: ['b7'],
    inversion: 0,
    register: 0,
    referenceRoot: 'C',
    movable: true,
    positions: [
      { stringIndex: 0, fret: 8 },
      { stringIndex: 1, fret: 11 },
      { stringIndex: 2, fret: 8 },
    ],
  },
  {
    id: 'c-maj7-finger-mid',
    style: 'finger',
    qualityId: 'maj',
    extensionIds: ['7'],
    inversion: 0,
    register: 0,
    referenceRoot: 'C',
    movable: true,
    positions: [
      { stringIndex: 0, fret: 8 },
      { stringIndex: 1, fret: 7 },
      { stringIndex: 2, fret: 9 },
      { stringIndex: 4, fret: 8 },
    ],
  },
]

function extensionIdsKey(extensionIds: string[]) {
  return [...extensionIds].sort().join(',')
}

function transposePositions(
  positions: PlayedPosition[],
  fromRoot: NoteName,
  toRoot: NoteName,
): PlayedPosition[] | null {
  const offset = (NOTE_NAMES.indexOf(toRoot) - NOTE_NAMES.indexOf(fromRoot) + 12) % 12
  if (offset === 0) {
    return positions.map((position) => ({ ...position }))
  }

  const transposed = positions.map((position) => ({
    stringIndex: position.stringIndex,
    fret: position.fret + offset,
  }))

  if (transposed.some((position) => position.fret > MAX_FRET)) {
    return null
  }

  return transposed
}

function isSubsetOfChordTones(positions: PlayedPosition[], chord: ChordSelection) {
  const expected = new Set(getChordPitchClasses(chord))
  const played = positions.map(
    (position) => (OPEN_STRING_MIDI[position.stringIndex] + position.fret) % 12,
  )
  return played.length > 0 && played.every((pitchClass) => expected.has(pitchClass))
}

export function lookupVoicingShape(
  chord: ChordSelection,
  playback: ChordPlayback,
): PlayedPosition[] | null {
  if (playback.style === 'strum') {
    return null
  }

  const extensionKey = extensionIdsKey(chord.extensionIds)
  const template = VOICING_SHAPE_TEMPLATES.find(
    (candidate) =>
      candidate.style === playback.style &&
      candidate.qualityId === chord.qualityId &&
      extensionIdsKey(candidate.extensionIds) === extensionKey &&
      candidate.inversion === playback.inversion &&
      candidate.register === playback.register,
  )

  if (!template) {
    return null
  }

  if (!template.movable && template.referenceRoot !== chord.root) {
    return null
  }

  const positions =
    template.referenceRoot === chord.root
      ? template.positions.map((position) => ({ ...position }))
      : transposePositions(template.positions, template.referenceRoot, chord.root)

  if (!positions) {
    return null
  }

  if (!isSubsetOfChordTones(positions, chord)) {
    return null
  }

  return positions
}
