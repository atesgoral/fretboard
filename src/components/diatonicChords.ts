import { NOTE_NAMES, type NoteName } from './chords'
import type { ChordSelection } from './chordSearch'
import { SCALE_OPTIONS, type ScaleId } from './scales'

export type DiatonicChord = {
  degreeLabel: string
  chord: ChordSelection
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const

const SCALE_ROLE_TO_ROMAN_BASE: Record<string, string> = {
  R: 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV',
  '5': 'V',
  '6': 'VI',
  '7': 'VII',
  b2: 'bII',
  b3: 'bIII',
  '#4': '#IV',
  b5: 'bV',
  b6: 'bVI',
  b7: 'bVII',
}

function getTriadQualityId(thirdInterval: number, fifthInterval: number) {
  if (thirdInterval === 3 && fifthInterval === 7) return 'min'
  if (thirdInterval === 4 && fifthInterval === 7) return 'maj'
  if (thirdInterval === 3 && fifthInterval === 6) return 'dim'
  if (thirdInterval === 4 && fifthInterval === 8) return 'aug'
  if (thirdInterval === 2 && fifthInterval === 7) return 'sus2'
  if (thirdInterval === 5 && fifthInterval === 7) return 'sus4'
  return 'maj'
}

function getRomanBaseFromScaleRole(scaleRole: string, degreeIndex: number) {
  const fromRole = SCALE_ROLE_TO_ROMAN_BASE[scaleRole]
  if (fromRole) {
    return fromRole
  }

  const alteration = scaleRole.startsWith('b') ? 'b' : scaleRole.startsWith('#') ? '#' : ''
  const base = ROMAN_NUMERALS[degreeIndex] ?? String(degreeIndex + 1)
  return `${alteration}${base}`
}

function applyChordQualityToRoman(romanBase: string, qualityId: string) {
  const match = romanBase.match(/^([b#]*)(.+)$/)
  const prefix = match?.[1] ?? ''
  const core = match?.[2] ?? romanBase

  if (qualityId === 'maj') return `${prefix}${core}`
  if (qualityId === 'min') return `${prefix}${core.toLowerCase()}`
  if (qualityId === 'dim') return `${prefix}${core.toLowerCase()}°`
  if (qualityId === 'aug') return `${prefix}${core}+`
  if (qualityId === 'sus2' || qualityId === 'sus4') {
    return `${prefix}${core.toLowerCase()}(${qualityId})`
  }
  return `${prefix}${core}`
}

function getRomanNumeral(degreeIndex: number, qualityId: string, scaleRole: string) {
  const romanBase = getRomanBaseFromScaleRole(scaleRole, degreeIndex)
  return applyChordQualityToRoman(romanBase, qualityId)
}

export function buildDiatonicTriads(scaleRoot: NoteName, scaleId: ScaleId): DiatonicChord[] {
  const scale = SCALE_OPTIONS.find((option) => option.value === scaleId) ?? SCALE_OPTIONS[0]
  const scaleLength = scale.intervals.length
  if (scaleLength < 3) {
    return []
  }

  const rootIndex = NOTE_NAMES.indexOf(scaleRoot)
  const pitchClasses = scale.intervals.map((interval) => (rootIndex + interval) % 12)

  return Array.from({ length: scaleLength }, (_, degreeIndex) => {
    const chordRootPc = pitchClasses[degreeIndex]
    const thirdPc = pitchClasses[(degreeIndex + 2) % scaleLength]
    const fifthPc = pitchClasses[(degreeIndex + 4) % scaleLength]
    const thirdInterval = (thirdPc - chordRootPc + 12) % 12
    const fifthInterval = (fifthPc - chordRootPc + 12) % 12
    const qualityId = getTriadQualityId(thirdInterval, fifthInterval)
    const chordRoot = NOTE_NAMES[chordRootPc]
    const scaleRole = scale.roles[degreeIndex]

    return {
      degreeLabel: getRomanNumeral(degreeIndex, qualityId, scaleRole),
      chord: {
        root: chordRoot,
        qualityId,
        extensionIds: [],
      },
    }
  })
}
