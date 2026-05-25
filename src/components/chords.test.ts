import { describe, expect, it } from 'vitest'
import { buildChordRoles, NOTE_NAMES } from './chords'

describe('buildChordRoles', () => {
  it('uses #11 for C major 13 voicing family', () => {
    const roles = buildChordRoles('C', 'maj', ['7', '9', '#11', '13'])
    expect(roles.get(NOTE_NAMES.indexOf('F#'))).toBe('#11')
    expect(roles.get(NOTE_NAMES.indexOf('F'))).toBeUndefined()
  })
})
