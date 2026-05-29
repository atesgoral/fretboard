import type { ChordInversionPreference, ChordPositionPreference } from './voicing'

export type ChordPlaybackMode = 'pluck' | 'strum'
export type InheritedChordPlaybackPreference = 'inherit'

export type ChordPlaybackSettings = {
  positionPreference: ChordPositionPreference
  inversionPreference: ChordInversionPreference
  playbackMode: ChordPlaybackMode
}

export type ChordPlaybackSettingsOverride = {
  positionPreference: ChordPositionPreference | InheritedChordPlaybackPreference
  inversionPreference: ChordInversionPreference | InheritedChordPlaybackPreference
  playbackMode: ChordPlaybackMode | InheritedChordPlaybackPreference
}

export const DEFAULT_CHORD_PLAYBACK_SETTINGS: ChordPlaybackSettings = {
  positionPreference: 'default',
  inversionPreference: 'root',
  playbackMode: 'pluck',
}

export const INHERITED_CHORD_PLAYBACK_SETTINGS: ChordPlaybackSettingsOverride = {
  positionPreference: 'inherit',
  inversionPreference: 'inherit',
  playbackMode: 'inherit',
}

export function resolveChordPlaybackSettings(
  settings: ChordPlaybackSettings | ChordPlaybackSettingsOverride,
  inheritedSettings: ChordPlaybackSettings,
): ChordPlaybackSettings {
  return {
    positionPreference:
      settings.positionPreference === 'inherit'
        ? inheritedSettings.positionPreference
        : settings.positionPreference,
    inversionPreference:
      settings.inversionPreference === 'inherit'
        ? inheritedSettings.inversionPreference
        : settings.inversionPreference,
    playbackMode:
      settings.playbackMode === 'inherit' ? inheritedSettings.playbackMode : settings.playbackMode,
  }
}
