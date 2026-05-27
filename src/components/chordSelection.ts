import type { ChordSelection } from './chordSearch'

export function areChordSelectionsEqual(a: ChordSelection, b: ChordSelection) {
  return (
    a.root === b.root &&
    a.qualityId === b.qualityId &&
    a.extensionIds.length === b.extensionIds.length &&
    a.extensionIds.every((extensionId, index) => extensionId === b.extensionIds[index])
  )
}

export function getChordSelectionKey(chord: ChordSelection, index: number) {
  return `${chord.root}-${chord.qualityId}-${chord.extensionIds.join('-')}-${index}`
}
