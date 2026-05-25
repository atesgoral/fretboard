import { describe, expect, it } from 'vitest'
import { getChordPresetById, parseChordQuery, sanitizeExtensions } from './chordSearch'

describe('parseChordQuery', () => {
  const fallback = { root: 'C' as const, qualityId: 'maj', extensionIds: [] as string[] }

  it('parses rooted dominant chords quickly', () => {
    expect(parseChordQuery('F#7', fallback)).toEqual({ root: 'F#', qualityId: 'maj', extensionIds: ['b7'] })
  })

  it('parses minor aliases', () => {
    expect(parseChordQuery('Bbm7', fallback)).toEqual({ root: 'A#', qualityId: 'min', extensionIds: ['b7'] })
  })

  it('keeps preset alias semantics before tonal fallback', () => {
    expect(parseChordQuery('Cmaj11', fallback)).toEqual({ root: 'C', qualityId: 'maj', extensionIds: ['7', '#11'] })
    expect(parseChordQuery('Cmaj13', fallback)).toEqual({ root: 'C', qualityId: 'maj', extensionIds: ['7', '9', '#11', '13'] })
  })

  it('uses tonal fallback for non-preset chord spellings', () => {
    expect(parseChordQuery('Cadd9', fallback)).toEqual({ root: 'C', qualityId: 'maj', extensionIds: ['9'] })
  })

  it('falls back when query is unknown', () => {
    expect(parseChordQuery('weirdThing', fallback)).toEqual(fallback)
  })
})

describe('sanitizeExtensions', () => {
  it('filters unsupported extension ids while keeping valid ones', () => {
    expect(sanitizeExtensions(['7', 'bogus', '#11', 'bad'])).toEqual(['7', '#11'])
  })
})

describe('getChordPresetById', () => {
  it('returns major triad when id is unknown', () => {
    expect(getChordPresetById('unknown').id).toBe('major-triad')
  })
})
