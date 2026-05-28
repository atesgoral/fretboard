import { describe, expect, it } from 'vitest'
import { buildChordVoicing } from './voicing'

const cMajor = { root: 'C' as const, qualityId: 'maj', extensionIds: [] as string[] }

describe('buildChordVoicing', () => {
  it('returns playable finger positions for a major triad', () => {
    const positions = buildChordVoicing(cMajor)
    expect(positions.length).toBeGreaterThanOrEqual(3)
    expect(positions.length).toBeLessThanOrEqual(4)
    positions.forEach((position) => {
      expect(position.fret).toBeGreaterThanOrEqual(0)
      expect(position.fret).toBeLessThanOrEqual(15)
    })
  })

  it('limits finger style to four voices with thumb on the lowest string', () => {
    const finger = buildChordVoicing(cMajor, { style: 'finger', register: 0, inversion: 0 })
    const strum = buildChordVoicing(cMajor, { style: 'strum', register: 0, inversion: 0 })

    expect(finger.length).toBeLessThanOrEqual(4)
    expect(strum.length).toBeGreaterThan(finger.length)

    const stringIndices = finger.map((position) => position.stringIndex)
    expect(new Set(stringIndices).size).toBe(stringIndices.length)
    expect(finger[0]?.stringIndex).toBe(Math.min(...stringIndices))
  })

  it('uses fewer notes for shell style', () => {
    const finger = buildChordVoicing(cMajor, { style: 'finger', register: 0, inversion: 0 })
    const shell = buildChordVoicing(cMajor, { style: 'shell', register: 0, inversion: 0 })
    expect(shell.length).toBeLessThanOrEqual(finger.length)
    expect(shell.length).toBeLessThanOrEqual(4)
  })

  it('shifts register when the voicing still fits on the neck', () => {
    const standard = buildChordVoicing(cMajor, { style: 'finger', register: 0, inversion: 0 })
    const higher = buildChordVoicing(cMajor, { style: 'finger', register: 1, inversion: 0 })

    if (higher !== standard) {
      expect(higher[0]?.fret).toBeGreaterThan(standard[0]?.fret ?? 0)
    }
  })

  it('changes the bass note for inversions', () => {
    const root = buildChordVoicing(cMajor, { style: 'finger', register: 0, inversion: 0 })
    const first = buildChordVoicing(cMajor, { style: 'finger', register: 0, inversion: 1 })
    expect(root[0]?.fret).not.toBe(first[0]?.fret)
  })
})
