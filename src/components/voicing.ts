import { CHORD_EXTENSIONS, CHORD_QUALITIES, NOTE_NAMES } from './chords'
import type { ChordSelection } from './chordSearch'

export type PlayedPosition = {
  stringIndex: number
  fret: number
}

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
const MAX_FRET_SEARCH = 6

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
  const pitchClasses = getChordPitchClasses(chord)
  const positions = OPEN_STRING_MIDI.map((openMidi, stringIndex) => {
    const fret = Array.from({ length: MAX_FRET_SEARCH }, (_, index) => index).find(
      (candidateFret) => pitchClasses.includes((openMidi + candidateFret) % 12),
    )
    return fret === undefined ? null : { stringIndex, fret }
  }).filter((position): position is PlayedPosition => position !== null)

  return positions.length >= 4 ? positions : positions.slice(0, 3)
}
