import { describe, expect, it } from 'vitest'
import { buildChordVoicing } from './voicing'
import { lookupVoicingShape, VOICING_SHAPE_TEMPLATES } from './voicingShapes'

describe('voicing shape encyclopedia', () => {
  it('uses a curated C major finger shape in open position', () => {
    const positions = buildChordVoicing(
      { root: 'C', qualityId: 'maj', extensionIds: [] },
      { style: 'finger', register: 0, inversion: 0 },
    )

    expect(positions).toEqual(
      VOICING_SHAPE_TEMPLATES.find((shape) => shape.id === 'c-maj-finger-bossa')?.positions,
    )
    expect(positions.length).toBe(4)
  })

  it('transposes movable shell shapes to another root', () => {
    const dShell = lookupVoicingShape(
      { root: 'D', qualityId: 'maj', extensionIds: ['7'] },
      { style: 'shell', register: 0, inversion: 0 },
    )

    expect(dShell).not.toBeNull()
    expect(dShell?.[0]).toEqual({ stringIndex: 0, fret: 10 })
  })

  it('falls back to heuristic voicing when no template exists', () => {
    const positions = buildChordVoicing(
      { root: 'F#', qualityId: 'dim', extensionIds: [] },
      { style: 'finger', register: 0, inversion: 0 },
    )

    expect(positions.length).toBeGreaterThan(0)
    expect(positions.length).toBeLessThanOrEqual(4)
  })
})
