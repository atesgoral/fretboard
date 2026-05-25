export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export type NoteName = (typeof NOTE_NAMES)[number]

export type ChordQuality = {
  id: string
  label: string
  intervals: number[]
  roles: string[]
}

export type ChordExtension = {
  id: string
  label: string
  interval: number
  role: string
}

export const CHORD_QUALITIES: ChordQuality[] = [
  { id: 'maj', label: 'Major', intervals: [0, 4, 7], roles: ['R', '3', '5'] },
  { id: 'min', label: 'Minor', intervals: [0, 3, 7], roles: ['R', 'm3', '5'] },
  { id: 'dim', label: 'Diminished', intervals: [0, 3, 6], roles: ['R', 'm3', 'b5'] },
  { id: 'aug', label: 'Augmented', intervals: [0, 4, 8], roles: ['R', '3', '#5'] },
  { id: 'sus2', label: 'Suspended 2', intervals: [0, 2, 7], roles: ['R', '2', '5'] },
  { id: 'sus4', label: 'Suspended 4', intervals: [0, 5, 7], roles: ['R', '4', '5'] },
]

export const CHORD_EXTENSIONS: ChordExtension[] = [
  { id: 'b7', label: 'b7', interval: 10, role: 'b7' },
  { id: '7', label: '7', interval: 11, role: '7' },
  { id: '9', label: '9', interval: 2, role: '9' },
  { id: '11', label: '11', interval: 5, role: '11' },
  { id: '13', label: '13', interval: 9, role: '13' },
]

export function buildChordRoles(root: NoteName, qualityId: string, extensionIds: string[]) {
  const rootIndex = NOTE_NAMES.indexOf(root)
  const quality = CHORD_QUALITIES.find((item) => item.id === qualityId) ?? CHORD_QUALITIES[0]

  const roleMap = new Map<number, string>()
  quality.intervals.forEach((interval, index) => {
    roleMap.set((rootIndex + interval) % 12, quality.roles[index])
  })

  extensionIds.forEach((id) => {
    const extension = CHORD_EXTENSIONS.find((item) => item.id === id)
    if (!extension) return
    roleMap.set((rootIndex + extension.interval) % 12, extension.role)
  })

  return roleMap
}
