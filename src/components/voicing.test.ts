import { describe, expect, it } from 'vitest'
import { buildCommonVoicing } from './voicing'

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
})
