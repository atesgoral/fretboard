import { describe, expect, it } from 'vitest'
import { NOTE_NAMES } from './chords'
import { buildDiatonicTriads } from './diatonicChords'
import { SCALE_OPTIONS } from './scales'
import { buildCommonVoicing, getImportedVoicing } from './voicing'

describe('buildCommonVoicing', () => {
  it('uses imported chord shapes before falling back to pitch-class search', () => {
    expect(buildCommonVoicing({ root: 'C', qualityId: 'maj', extensionIds: [] })).toEqual([
      { stringIndex: 1, fret: 3 },
      { stringIndex: 2, fret: 2 },
      { stringIndex: 3, fret: 0 },
      { stringIndex: 4, fret: 1 },
      { stringIndex: 5, fret: 0 },
    ])
  })

  it('maps current half-diminished selections to Oolimo m7(b5) voicings', () => {
    expect(buildCommonVoicing({ root: 'C', qualityId: 'dim', extensionIds: ['b7'] })).toEqual([
      { stringIndex: 1, fret: 3 },
      { stringIndex: 3, fret: 3 },
      { stringIndex: 4, fret: 4 },
      { stringIndex: 5, fret: 2 },
    ])
  })

  it('uses chords-db supplements for diminished triads missing from Oolimo', () => {
    expect(buildCommonVoicing({ root: 'C', qualityId: 'dim', extensionIds: [] })).toEqual([
      { stringIndex: 1, fret: 3 },
      { stringIndex: 2, fret: 1 },
      { stringIndex: 4, fret: 1 },
      { stringIndex: 5, fret: 2 },
    ])
  })

  it('has imported voicing coverage for every listed diatonic triad', () => {
    const missing = NOTE_NAMES.flatMap((scaleRoot) =>
      SCALE_OPTIONS.flatMap((scale) =>
        buildDiatonicTriads(scaleRoot, scale.value)
          .filter(({ chord }) => getImportedVoicing(chord) === null)
          .map(
            ({ degreeLabel, chord }) => `${scaleRoot} ${scale.label} ${degreeLabel} ${chord.root}`,
          ),
      ),
    )

    expect(missing).toEqual([])
  })
})
