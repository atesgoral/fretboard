import { describe, expect, it } from 'vitest'
import { NOTE_NAMES } from './chords'
import { buildScaleRoles, SCALE_OPTIONS } from './scales'

function pitchClass(note: string) {
  return NOTE_NAMES.indexOf(note as (typeof NOTE_NAMES)[number])
}

describe('buildScaleRoles', () => {
  it('maps C major scale roles correctly', () => {
    const roles = buildScaleRoles('C', 'major')

    expect(roles.get(pitchClass('C'))).toBe('R')
    expect(roles.get(pitchClass('D'))).toBe('2')
    expect(roles.get(pitchClass('E'))).toBe('3')
    expect(roles.get(pitchClass('F'))).toBe('4')
    expect(roles.get(pitchClass('G'))).toBe('5')
    expect(roles.get(pitchClass('A'))).toBe('6')
    expect(roles.get(pitchClass('B'))).toBe('7')
    expect(roles.get(pitchClass('D#'))).toBeUndefined()
  })

  it('maps C natural minor roles with flat degrees', () => {
    const roles = buildScaleRoles('C', 'natural-minor')

    expect(roles.get(pitchClass('D#'))).toBe('b3')
    expect(roles.get(pitchClass('G#'))).toBe('b6')
    expect(roles.get(pitchClass('A#'))).toBe('b7')
    expect(roles.get(pitchClass('E'))).toBeUndefined()
    expect(roles.get(pitchClass('A'))).toBeUndefined()
    expect(roles.get(pitchClass('B'))).toBeUndefined()
  })

  it('transposes roles based on root', () => {
    const roles = buildScaleRoles('D', 'major')

    expect(roles.get(pitchClass('D'))).toBe('R')
    expect(roles.get(pitchClass('F#'))).toBe('3')
    expect(roles.get(pitchClass('C#'))).toBe('7')
  })
})

describe('SCALE_OPTIONS integrity', () => {
  it('keeps intervals and roles aligned and valid for all scales', () => {
    SCALE_OPTIONS.forEach((scale) => {
      expect(scale.intervals.length).toBe(scale.roles.length)

      const uniqueIntervals = new Set(scale.intervals)
      expect(uniqueIntervals.size).toBe(scale.intervals.length)

      scale.intervals.forEach((interval) => {
        expect(interval).toBeGreaterThanOrEqual(0)
        expect(interval).toBeLessThanOrEqual(11)
      })
    })
  })
})
