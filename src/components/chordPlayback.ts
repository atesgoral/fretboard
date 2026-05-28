import type { ChordSelection } from './chordSearch'

export type ChordPlayStyle = 'strum' | 'finger' | 'shell'

/** Shifts the voicing lower or higher on the neck (not a literal octave jump). */
export type ChordRegister = -1 | 0 | 1

export type ChordInversion = 0 | 1 | 2

export type ChordPlayback = {
  style: ChordPlayStyle
  register: ChordRegister
  inversion: ChordInversion
}

export type PinnedChord = ChordSelection & ChordPlayback

export const DEFAULT_CHORD_PLAYBACK: ChordPlayback = {
  style: 'finger',
  register: 0,
  inversion: 0,
}

export const CHORD_PLAY_STYLE_OPTIONS: { value: ChordPlayStyle; label: string }[] = [
  { value: 'finger', label: 'Finger (4 voices)' },
  { value: 'strum', label: 'Strum' },
  { value: 'shell', label: 'Shell' },
]

export const CHORD_REGISTER_OPTIONS: { value: ChordRegister; label: string }[] = [
  { value: -1, label: 'Lower' },
  { value: 0, label: 'Standard' },
  { value: 1, label: 'Higher' },
]

export const CHORD_INVERSION_OPTIONS: { value: ChordInversion; label: string }[] = [
  { value: 0, label: 'Root position' },
  { value: 1, label: '1st inversion' },
  { value: 2, label: '2nd inversion' },
]

export function createPinnedChord(selection: ChordSelection): PinnedChord {
  return {
    root: selection.root,
    qualityId: selection.qualityId,
    extensionIds: [...selection.extensionIds],
    ...DEFAULT_CHORD_PLAYBACK,
  }
}

export function normalizePinnedChord(chord: ChordSelection & Partial<ChordPlayback>): PinnedChord {
  return {
    root: chord.root,
    qualityId: chord.qualityId,
    extensionIds: [...chord.extensionIds],
    style: chord.style ?? DEFAULT_CHORD_PLAYBACK.style,
    register: chord.register ?? DEFAULT_CHORD_PLAYBACK.register,
    inversion: chord.inversion ?? DEFAULT_CHORD_PLAYBACK.inversion,
  }
}
