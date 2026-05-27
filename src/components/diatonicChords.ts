import { NOTE_NAMES, type NoteName } from './chords'
import type { ChordSelection } from './chordSearch'
import { SCALE_OPTIONS, type ScaleId } from './scales'

export type DiatonicChord = {
  degreeLabel: string
  chord: ChordSelection
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const

function getTriadQualityId(thirdInterval: number, fifthInterval: number) {
  if (thirdInterval === 3 && fifthInterval === 7) return 'min'
  if (thirdInterval === 4 && fifthInterval === 7) return 'maj'
  if (thirdInterval === 3 && fifthInterval === 6) return 'dim'
  if (thirdInterval === 4 && fifthInterval === 8) return 'aug'
  if (thirdInterval === 2 && fifthInterval === 7) return 'sus2'
  if (thirdInterval === 5 && fifthInterval === 7) return 'sus4'
  return 'maj'
}

function getRomanNumeral(
  degreeIndex: number,
  qualityId: string,
  scaleLength: number,
  scaleRole: string,
) {
  if (scaleLength !== 7) {
    return null
  }

  const alteration = scaleRole.startsWith('b') ? 'b' : scaleRole.startsWith('#') ? '#' : ''
  const base = ROMAN_NUMERALS[degreeIndex]
  const alteredBase = `${alteration}${base}`

  if (qualityId === 'maj') return alteredBase
  if (qualityId === 'min') return alteredBase.toLowerCase()
  if (qualityId === 'dim') return `${alteredBase.toLowerCase()}°`
  if (qualityId === 'aug') return `${alteredBase}+`
  if (qualityId === 'sus2' || qualityId === 'sus4') {
    return `${alteredBase.toLowerCase()}(${qualityId === 'sus2' ? 'sus2' : 'sus4'})`
  }
  return alteredBase
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
    const roman = getRomanNumeral(degreeIndex, qualityId, scaleLength, scale.roles[degreeIndex])

    return {
      degreeLabel: roman ?? scale.roles[degreeIndex],
      chord: {
        root: chordRoot,
        qualityId,
        extensionIds: [],
      },
    }
  })
}
