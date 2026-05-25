import { describe, expect, it } from 'vitest'
import { getChordPresetById, parseChordQuery } from './chordSearch'

describe('parseChordQuery', () => {
  const fallback = { root: 'C' as const, qualityId: 'maj', extensionIds: [] as string[] }

  it('parses rooted dominant chords quickly', () => {
    expect(parseChordQuery('F#7', fallback)).toEqual({ root: 'F#', qualityId: 'maj', extensionIds: ['b7'] })
  })

  it('parses minor aliases', () => {
    expect(parseChordQuery('Bbm7', fallback)).toEqual({ root: 'A#', qualityId: 'min', extensionIds: ['b7'] })
  })

  it('parses major 7#11 aliases and major 13 with #11', () => {
    expect(parseChordQuery('Cmaj11', fallback)).toEqual({ root: 'C', qualityId: 'maj', extensionIds: ['7', '#11'] })
    expect(parseChordQuery('Cmaj13', fallback)).toEqual({ root: 'C', qualityId: 'maj', extensionIds: ['7', '9', '#11', '13'] })
  })

  it('falls back when query is unknown', () => {
    expect(parseChordQuery('weirdThing', fallback)).toEqual(fallback)
  })
})

describe('getChordPresetById', () => {
  it('returns major triad when id is unknown', () => {
    expect(getChordPresetById('unknown').id).toBe('major-triad')
  })
})
