import type { ChordInversionPreference, ChordPositionPreference } from './voicing'

export type ChordPlaybackMode = 'pluck' | 'strum'

export type ChordPlaybackSettings = {
  positionPreference: ChordPositionPreference
  inversionPreference: ChordInversionPreference
  playbackMode: ChordPlaybackMode
}

export const DEFAULT_CHORD_PLAYBACK_SETTINGS: ChordPlaybackSettings = {
  positionPreference: 'default',
  inversionPreference: 'root',
  playbackMode: 'pluck',
}
