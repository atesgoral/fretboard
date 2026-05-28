import { describe, expect, it } from 'vitest'
import { getChordQueryForSelection } from './chordSearch'
import { buildDiatonicTriads } from './diatonicChords'

describe('buildDiatonicTriads', () => {
  it('builds triads for C major', () => {
    const chords = buildDiatonicTriads('C', 'major')
    const labels = chords.map(({ degreeLabel, chord }) => ({
      degreeLabel,
      label: getChordQueryForSelection(chord.root, chord.qualityId, chord.extensionIds),
    }))

    expect(labels).toEqual([
      { degreeLabel: 'I', label: 'Cmaj' },
      { degreeLabel: 'ii', label: 'Dmin' },
      { degreeLabel: 'iii', label: 'Emin' },
      { degreeLabel: 'IV', label: 'Fmaj' },
      { degreeLabel: 'V', label: 'Gmaj' },
      { degreeLabel: 'vi', label: 'Amin' },
      { degreeLabel: 'vii°', label: 'Bdim' },
    ])
  })

  it('builds triads for A natural minor', () => {
    const chords = buildDiatonicTriads('A', 'natural-minor')
    const labels = chords.map(({ degreeLabel, chord }) => ({
      degreeLabel,
      label: getChordQueryForSelection(chord.root, chord.qualityId, chord.extensionIds),
    }))

    expect(labels).toEqual([
      { degreeLabel: 'i', label: 'Amin' },
      { degreeLabel: 'ii°', label: 'Bdim' },
      { degreeLabel: 'bIII', label: 'Cmaj' },
      { degreeLabel: 'iv', label: 'Dmin' },
      { degreeLabel: 'v', label: 'Emin' },
      { degreeLabel: 'bVI', label: 'Fmaj' },
      { degreeLabel: 'bVII', label: 'Gmaj' },
    ])
  })

  it('uses Roman numerals for C major pentatonic', () => {
    const chords = buildDiatonicTriads('C', 'major-pentatonic')
    const degreeLabels = chords.map(({ degreeLabel }) => degreeLabel)

    expect(degreeLabels).toEqual(['I', 'II', 'III', 'V', 'VI'])
    expect(degreeLabels.every((label) => /^[b#]?[IV]+/.test(label))).toBe(true)
  })

  it('uses Roman numerals for A minor pentatonic', () => {
    const chords = buildDiatonicTriads('A', 'minor-pentatonic')
    const degreeLabels = chords.map(({ degreeLabel }) => degreeLabel)

    expect(degreeLabels).toEqual(['I', 'bIII', 'IV', 'V', 'bVII'])
    expect(degreeLabels).not.toContain('R')
  })

  it('builds triads for C lydian with a diminished chord on #4', () => {
    const chords = buildDiatonicTriads('C', 'lydian')
    const fourthDegree = chords[3]

    expect(fourthDegree.degreeLabel).toBe('#iv°')
    expect(
      getChordQueryForSelection(fourthDegree.chord.root, fourthDegree.chord.qualityId, []),
    ).toBe('F#dim')
  })

  it('builds augmented triads for C whole tone', () => {
    const chords = buildDiatonicTriads('C', 'whole-tone')
    const labels = chords.map(({ degreeLabel, chord }) => ({
      degreeLabel,
      label: getChordQueryForSelection(chord.root, chord.qualityId, chord.extensionIds),
    }))

    expect(labels).toEqual([
      { degreeLabel: 'I+', label: 'Caug' },
      { degreeLabel: 'II+', label: 'Daug' },
      { degreeLabel: 'III+', label: 'Eaug' },
      { degreeLabel: '#IV+', label: 'F#aug' },
      { degreeLabel: '#V+', label: 'G#aug' },
      { degreeLabel: 'bVII+', label: 'A#aug' },
    ])
  })

  it('labels altered diminished degrees without dropping accidentals', () => {
    const wholeHalfLabels = buildDiatonicTriads('C', 'diminished-whole-half').map(
      ({ degreeLabel }) => degreeLabel,
    )
    const halfWholeLabels = buildDiatonicTriads('C', 'diminished-half-whole').map(
      ({ degreeLabel }) => degreeLabel,
    )

    expect(wholeHalfLabels).toEqual(['i°', 'ii°', 'biii°', 'iv°', 'bv°', 'bvi°', 'bbvii°', 'vii°'])
    expect(halfWholeLabels).toEqual(['i°', 'bii°', '#ii°', 'iii°', '#iv°', 'v°', 'vi°', 'bvii°'])
  })
})
