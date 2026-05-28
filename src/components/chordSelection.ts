import type { ChordSelection } from './chordSearch'

export function getChordSelectionKey(chord: ChordSelection, index: number) {
  return `${chord.root}-${chord.qualityId}-${chord.extensionIds.join('-')}-${index}`
}
