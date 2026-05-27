export const SCALE_OPTIONS = [
  { value: 'major', label: 'Major (Ionian)' },
  { value: 'natural-minor', label: 'Natural Minor (Aeolian)' },
  { value: 'dorian', label: 'Dorian' },
  { value: 'phrygian', label: 'Phrygian' },
  { value: 'lydian', label: 'Lydian' },
  { value: 'mixolydian', label: 'Mixolydian' },
  { value: 'locrian', label: 'Locrian' },
  { value: 'harmonic-minor', label: 'Harmonic Minor' },
  { value: 'melodic-minor', label: 'Melodic Minor' },
  { value: 'major-pentatonic', label: 'Major Pentatonic' },
  { value: 'minor-pentatonic', label: 'Minor Pentatonic' },
  { value: 'blues', label: 'Blues' },
] as const

export type ScaleId = (typeof SCALE_OPTIONS)[number]['value']
