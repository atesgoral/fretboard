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

  it('builds triads for C lydian with a diminished chord on #4', () => {
    const chords = buildDiatonicTriads('C', 'lydian')
    const fourthDegree = chords[3]

    expect(fourthDegree.degreeLabel).toBe('#iv°')
    expect(
      getChordQueryForSelection(fourthDegree.chord.root, fourthDegree.chord.qualityId, []),
    ).toBe('F#dim')
  })
})
