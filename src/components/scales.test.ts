import { describe, expect, it } from 'vitest'
import { NOTE_NAMES } from './chords'
import { buildScaleRoles, SCALE_OPTIONS } from './scales'

function pitchClass(note: string) {
  return NOTE_NAMES.indexOf(note as (typeof NOTE_NAMES)[number])
}

function getScale(value: string) {
  const scale = SCALE_OPTIONS.find((option) => option.value === value)
  if (!scale) throw new Error(`Missing scale ${value}`)
  return scale
}

describe('buildScaleRoles', () => {
  it('maps C major scale roles correctly', () => {
    const roles = buildScaleRoles('C', 'major')

    expect(roles.get(pitchClass('C'))).toBe('1')
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

    expect(roles.get(pitchClass('D'))).toBe('1')
    expect(roles.get(pitchClass('F#'))).toBe('3')
    expect(roles.get(pitchClass('C#'))).toBe('7')
  })

  it('maps Spanish 8-Tone with both minor and major third colors', () => {
    const roles = buildScaleRoles('C', 'spanish-8-tone')

    expect(roles.get(pitchClass('C'))).toBe('1')
    expect(roles.get(pitchClass('C#'))).toBe('b2')
    expect(roles.get(pitchClass('D#'))).toBe('b3')
    expect(roles.get(pitchClass('E'))).toBe('3')
    expect(roles.get(pitchClass('F#'))).toBe('b5')
  })

  it('maps C bebop dominant with both dominant and major seventh colors', () => {
    const roles = buildScaleRoles('C', 'bebop-dominant')

    expect(roles.get(pitchClass('C'))).toBe('1')
    expect(roles.get(pitchClass('D'))).toBe('2')
    expect(roles.get(pitchClass('E'))).toBe('3')
    expect(roles.get(pitchClass('F'))).toBe('4')
    expect(roles.get(pitchClass('G'))).toBe('5')
    expect(roles.get(pitchClass('A'))).toBe('6')
    expect(roles.get(pitchClass('A#'))).toBe('b7')
    expect(roles.get(pitchClass('B'))).toBe('7')
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

  it('includes bebop, Spanish, diminished, whole tone, and related scale formulas', () => {
    expect(getScale('bebop-dominant')).toMatchObject({
      label: 'Bebop Dominant',
      intervals: [0, 2, 4, 5, 7, 9, 10, 11],
      roles: ['1', '2', '3', '4', '5', '6', 'b7', '7'],
    })
    expect(getScale('phrygian-dominant')).toMatchObject({
      label: 'Phrygian Dominant (Spanish Gypsy)',
      intervals: [0, 1, 4, 5, 7, 8, 10],
      roles: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
    })
    expect(getScale('spanish-8-tone')).toMatchObject({
      label: 'Spanish 8-Tone',
      intervals: [0, 1, 3, 4, 5, 6, 8, 10],
      roles: ['1', 'b2', 'b3', '3', '4', 'b5', 'b6', 'b7'],
    })
    expect(getScale('whole-tone')).toMatchObject({
      label: 'Whole Tone',
      intervals: [0, 2, 4, 6, 8, 10],
      roles: ['1', '2', '3', '#4', '#5', 'b7'],
    })
    expect(getScale('diminished-whole-half')).toMatchObject({
      label: 'Diminished (Whole-Half)',
      intervals: [0, 2, 3, 5, 6, 8, 9, 11],
      roles: ['1', '2', 'b3', '4', 'b5', 'b6', 'bb7', '7'],
    })
    expect(getScale('diminished-half-whole')).toMatchObject({
      label: 'Dominant Diminished (Half-Whole)',
      intervals: [0, 1, 3, 4, 6, 7, 9, 10],
      roles: ['1', 'b2', '#2', '3', '#4', '5', '6', 'b7'],
    })
  })
})
