import * as TonalChord from '@tonaljs/chord'
import { CHORD_EXTENSIONS, CHORD_QUALITIES, NOTE_NAMES, type NoteName } from './chords'

export type ChordSelection = {
  root: NoteName
  qualityId: string
  extensionIds: string[]
}

export type ChordPreset = {
  id: string
  label: string
  aliases: string[]
  qualityId: string
  extensionIds: string[]
}

export const CHORD_PRESETS: ChordPreset[] = [
  { id: 'major-triad', label: 'Major (triad)', aliases: ['maj', 'major', 'M'], qualityId: 'maj', extensionIds: [] },
  { id: 'major-6', label: 'Major 6', aliases: ['6', 'maj6', 'CM6'], qualityId: 'maj', extensionIds: ['13'] },
  { id: 'major-7', label: 'Major 7', aliases: ['maj7', 'Δ7'], qualityId: 'maj', extensionIds: ['7'] },
  { id: 'major-9', label: 'Major 9', aliases: ['maj9', 'Δ9'], qualityId: 'maj', extensionIds: ['7', '9'] },
  { id: 'major-7-sharp-11', label: 'Major 7#11', aliases: ['maj7#11', 'maj11', 'Δ#11'], qualityId: 'maj', extensionIds: ['7', '#11'] },
  { id: 'major-13', label: 'Major 13', aliases: ['maj13', 'Δ13'], qualityId: 'maj', extensionIds: ['7', '9', '#11', '13'] },
  { id: 'minor-triad', label: 'Minor (triad)', aliases: ['min', 'm', '-'], qualityId: 'min', extensionIds: [] },
  { id: 'minor-7', label: 'Minor 7', aliases: ['min7', 'm7', '-7'], qualityId: 'min', extensionIds: ['b7'] },
  { id: 'minor-9', label: 'Minor 9', aliases: ['min9', 'm9', '-9'], qualityId: 'min', extensionIds: ['b7', '9'] },
  { id: 'dom-7', label: 'Dominant 7', aliases: ['7', 'dom7'], qualityId: 'maj', extensionIds: ['b7'] },
  { id: 'dom-9', label: 'Dominant 9', aliases: ['9', 'dom9'], qualityId: 'maj', extensionIds: ['b7', '9'] },
  { id: 'dim', label: 'Diminished', aliases: ['dim', 'o'], qualityId: 'dim', extensionIds: [] },
  { id: 'half-dim', label: 'Half Diminished', aliases: ['m7b5', 'ø', 'ø7'], qualityId: 'dim', extensionIds: ['b7'] },
  { id: 'aug', label: 'Augmented', aliases: ['aug', '+'], qualityId: 'aug', extensionIds: [] },
  { id: 'sus2', label: 'Sus 2', aliases: ['sus2'], qualityId: 'sus2', extensionIds: [] },
  { id: 'sus4', label: 'Sus 4', aliases: ['sus4'], qualityId: 'sus4', extensionIds: [] },
  { id: '7sus4', label: '7 Sus 4', aliases: ['7sus4'], qualityId: 'sus4', extensionIds: ['b7'] },
]

const knownAliases = CHORD_PRESETS.flatMap((preset) => preset.aliases.map((alias) => alias.toLowerCase()))

function normalizeQuery(query: string) {
  return query.replace(/\s+/g, '').trim().toLowerCase().replace('♯', '#').replace('♭', 'b')
}
const FLAT_TO_SHARP: Record<string, NoteName> = {
  db: 'C#',
  eb: 'D#',
  gb: 'F#',
  ab: 'G#',
  bb: 'A#',
}

function resolveRoot(root: string | undefined, fallback: NoteName): NoteName {
  if (!root) return fallback
  const normalized = root.replace('♯', '#').replace('♭', 'b').toLowerCase()
  const flatRoot = FLAT_TO_SHARP[normalized]
  if (flatRoot) return flatRoot
  const chromaticRoot = NOTE_NAMES.find((note) => note.toLowerCase() === normalized)
  return chromaticRoot ?? fallback
}

function parseWithTonal(query: string, fallback: ChordSelection): ChordSelection | null {
  const parsed = TonalChord.get(query)
  if (parsed.empty) return null

  const root = resolveRoot(parsed.tonic ?? parsed.root, fallback.root)
  const intervals = new Set(parsed.intervals)

  let qualityId: string = 'maj'
  if (intervals.has('2P') && intervals.has('5P') && !intervals.has('3M') && !intervals.has('3m')) {
    qualityId = 'sus2'
  } else if (intervals.has('4P') && intervals.has('5P') && !intervals.has('3M') && !intervals.has('3m')) {
    qualityId = 'sus4'
  } else if (intervals.has('3m') && intervals.has('5d')) {
    qualityId = 'dim'
  } else if (intervals.has('3M') && intervals.has('5A')) {
    qualityId = 'aug'
  } else if (intervals.has('3m')) {
    qualityId = 'min'
  }

  const extensionIds: string[] = []
  if (intervals.has('7m')) extensionIds.push('b7')
  if (intervals.has('7M')) extensionIds.push('7')
  if (intervals.has('9M') || intervals.has('2M')) extensionIds.push('9')
  if (intervals.has('11P') || intervals.has('4P')) extensionIds.push('11')
  if (intervals.has('11A') || intervals.has('4A')) extensionIds.push('#11')
  if (intervals.has('13M') || intervals.has('6M')) extensionIds.push('13')

  return { root, qualityId, extensionIds: sanitizeExtensions(extensionIds) }
}

export function getAutocompleteTokens(): string[] {
  return [...new Set([...CHORD_PRESETS.map((preset) => preset.label), ...knownAliases])]
}

export function getChordPresetById(id: string) {
  return CHORD_PRESETS.find((preset) => preset.id === id) ?? CHORD_PRESETS[0]
}

export function getPresetIdForSelection(qualityId: string, extensionIds: string[]) {
  return CHORD_PRESETS.find((preset) => preset.qualityId === qualityId && JSON.stringify(preset.extensionIds) === JSON.stringify(extensionIds))?.id
}

export function getChordQueryForSelection(root: NoteName, qualityId: string, extensionIds: string[]) {
  const presetId = getPresetIdForSelection(qualityId, extensionIds) ?? 'major-triad'
  const alias = getChordPresetById(presetId).aliases[0] ?? 'maj'
  return `${root}${alias}`
}

function parsePresetAlias(normalized: string, fallback: ChordSelection): ChordSelection | null {
  const chromaticRoot =
    [...NOTE_NAMES]
      .sort((a, b) => b.length - a.length)
      .find((note) => normalized.startsWith(note.toLowerCase())) ?? fallback.root
  const flatRoot = Object.entries(FLAT_TO_SHARP).find(([flat]) => normalized.startsWith(flat))
  const root = flatRoot ? flatRoot[1] : chromaticRoot
  const consumedRootLength = flatRoot ? flatRoot[0].length : root.length
  const suffix = root === fallback.root && !normalized.startsWith(root.toLowerCase()) ? normalized : normalized.slice(consumedRootLength)

  const preset = CHORD_PRESETS.find((item) => item.aliases.some((alias) => alias.toLowerCase() === suffix) || item.label.toLowerCase() === suffix)
  if (!preset) return null

  return {
    root,
    qualityId: preset.qualityId,
    extensionIds: preset.extensionIds,
  }
}

export function parseChordQuery(query: string, fallback: ChordSelection): ChordSelection {
  const normalized = normalizeQuery(query)
  if (!normalized) return fallback

  const presetSelection = parsePresetAlias(normalized, fallback)
  if (presetSelection) return presetSelection

  const tonalSelection = parseWithTonal(query, fallback)
  return tonalSelection ?? fallback
}

export function sanitizeExtensions(extensionIds: string[]) {
  const valid = new Set(CHORD_EXTENSIONS.map((item) => item.id))
  return extensionIds.filter((id) => valid.has(id))
}

export function isValidQuality(qualityId: string) {
  return CHORD_QUALITIES.some((item) => item.id === qualityId)
}
