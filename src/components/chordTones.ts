import { CHORD_EXTENSIONS, CHORD_QUALITIES, NOTE_NAMES } from './chords'
import type { ChordSelection } from './chordSearch'

type ChordTone = {
  pitchClass: number
  role: string
  interval: number
}

export function getChordTones(chord: ChordSelection): ChordTone[] {
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

export function getChordPitchClasses(chord: ChordSelection) {
  return Array.from(new Set(getChordTones(chord).map((tone) => tone.pitchClass)))
}
