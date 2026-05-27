import { NOTE_NAMES, type NoteName } from './chords'

export const SCALE_OPTIONS = [
  {
    value: 'major',
    label: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    roles: ['R', '2', '3', '4', '5', '6', '7'],
  },
  {
    value: 'natural-minor',
    label: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    roles: ['R', '2', 'b3', '4', '5', 'b6', 'b7'],
  },
  {
    value: 'dorian',
    label: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    roles: ['R', '2', 'b3', '4', '5', '6', 'b7'],
  },
  {
    value: 'phrygian',
    label: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    roles: ['R', 'b2', 'b3', '4', '5', 'b6', 'b7'],
  },
  {
    value: 'lydian',
    label: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    roles: ['R', '2', '3', '#4', '5', '6', '7'],
  },
  {
    value: 'mixolydian',
    label: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    roles: ['R', '2', '3', '4', '5', '6', 'b7'],
  },
  {
    value: 'locrian',
    label: 'Locrian',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    roles: ['R', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
  },
  {
    value: 'harmonic-minor',
    label: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    roles: ['R', '2', 'b3', '4', '5', 'b6', '7'],
  },
  {
    value: 'melodic-minor',
    label: 'Melodic Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    roles: ['R', '2', 'b3', '4', '5', '6', '7'],
  },
  {
    value: 'major-pentatonic',
    label: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    roles: ['R', '2', '3', '5', '6'],
  },
  {
    value: 'minor-pentatonic',
    label: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    roles: ['R', 'b3', '4', '5', 'b7'],
  },
  {
    value: 'blues',
    label: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    roles: ['R', 'b3', '4', 'b5', '5', 'b7'],
  },
] as const

export type ScaleId = (typeof SCALE_OPTIONS)[number]['value']

export function buildScaleRoles(root: NoteName, scaleId: ScaleId) {
  const rootIndex = NOTE_NAMES.indexOf(root)
  const scale = SCALE_OPTIONS.find((option) => option.value === scaleId) ?? SCALE_OPTIONS[0]
  const roleMap = new Map<number, string>()

  scale.intervals.forEach((interval, index) => {
    roleMap.set((rootIndex + interval) % 12, scale.roles[index])
  })

  return roleMap
}
