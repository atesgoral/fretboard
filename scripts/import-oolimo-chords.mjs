import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

const DEFAULT_CHORDS_URL = 'https://www.oolimo.com/data/chordsdb26.js'
const DEFAULT_LIST_URL = 'https://www.oolimo.com/en/guitar-chords/list'
const DEFAULT_OUT = 'src/data/chordVoicings.json'

const ROOTS = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
]
const ROOT_URL_TO_ROOT = new Map(ROOTS.map((root) => [root.replaceAll('#', '~'), root]))
const ROOT_URL_PREFIXES = [...ROOT_URL_TO_ROOT.keys()].sort((a, b) => b.length - a.length)
const NATURAL_PITCH_CLASS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const INTERVAL_TO_SEMITONE = {
  1: 0,
  9: 2,
  m3: 3,
  3: 4,
  11: 5,
  b5: 6,
  '#11': 6,
  5: 7,
  '#5': 8,
  b13: 8,
  13: 9,
  dim7: 9,
  7: 10,
  maj7: 11,
}
const ENHARMONIC_ROOT = {
  'C#': 'Db',
  Db: 'C#',
  'D#': 'Eb',
  Eb: 'D#',
  'F#': 'Gb',
  Gb: 'F#',
  'G#': 'Ab',
  Ab: 'G#',
  'A#': 'Bb',
  Bb: 'A#',
}
const CATEGORY_ORDER = { open: 0, moveable: 1, capo: 2 }

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) continue
    args[arg.slice(2)] = argv[index + 1]
    index += 1
  }
  return args
}

async function readText(input, fallbackUrl) {
  if (input) {
    return fs.readFile(input, 'utf8')
  }

  const response = await fetch(fallbackUrl, {
    headers: { 'user-agent': 'fretboard-oolimo-importer' },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${fallbackUrl}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

function loadOolimoData(source) {
  const jsStart = source.indexOf('var chordsdb')
  if (jsStart < 0) {
    throw new Error('Could not find Oolimo chordsdb declaration')
  }

  const context = {}
  vm.createContext(context)
  vm.runInContext(source.slice(jsStart), context)
  return {
    chordsdb: context.chordsdb,
    chordtypesdb: context.chordtypesdb,
  }
}

function extractChordUrls(listSource) {
  const markdownMatches = [...listSource.matchAll(/\.\.\/guitar-chords\/([^)]+)/g)].map((match) =>
    decodeURIComponent(match[1]),
  )
  const htmlMatches = [...listSource.matchAll(/href=["'][^"']*\/guitar-chords\/([^"'?#]+)/g)].map(
    (match) => decodeURIComponent(match[1]),
  )
  return [...new Set([...markdownMatches, ...htmlMatches])]
}

function parseChordUrl(urlToken) {
  for (const prefix of ROOT_URL_PREFIXES) {
    if (urlToken.startsWith(prefix)) {
      return {
        root: ROOT_URL_TO_ROOT.get(prefix),
        suffix: urlToken.slice(prefix.length),
      }
    }
  }
  throw new Error(`Could not parse chord root from URL token: ${urlToken}`)
}

function noteFromUrlToken(token) {
  return token.replaceAll('~', '#')
}

function pitchClass(note) {
  const natural = NATURAL_PITCH_CLASS[note[0]]
  if (natural === undefined) {
    return undefined
  }
  const accidentalOffset = [...note.slice(1)].reduce((offset, accidental) => {
    if (accidental === '#') return offset + 1
    if (accidental === 'b') return offset - 1
    return offset
  }, 0)
  return (natural + accidentalOffset + 120) % 12
}

function intervalSemitoneFromRoot(root, bassNote) {
  const rootPc = pitchClass(root)
  const bassPc = pitchClass(bassNote)
  if (rootPc === undefined || bassPc === undefined) {
    throw new Error(`Cannot resolve slash chord interval for ${root}/${bassNote}`)
  }
  return (bassPc - rootPc + 12) % 12
}

function rowMatchesSlashBass(root, suffix, row) {
  if (!row.url || !row.bassInt || !suffix.startsWith(row.url)) return false
  const bassNote = noteFromUrlToken(suffix.slice(row.url.length))
  return INTERVAL_TO_SEMITONE[row.bassInt] === intervalSemitoneFromRoot(root, bassNote)
}

function findChordTypeRow(root, suffix, chordtypesdb) {
  const exact = chordtypesdb.find((row) => row.url === suffix && !row.bassInt)
  if (exact) return exact

  const slash = chordtypesdb.find((row) => rowMatchesSlashBass(root, suffix, row))
  if (slash) return slash

  const fallbackExact = chordtypesdb.find((row) => row.url === suffix)
  if (fallbackExact) return fallbackExact

  throw new Error(`Could not map Oolimo URL suffix: ${suffix}`)
}

function transposeSpots(shapeString, sourceRoot, targetRoot) {
  let transposeBy = pitchClass(targetRoot) - pitchClass(sourceRoot) - 12
  const spots = shapeString.split('_')

  for (const spot of spots) {
    const fret = spot.slice(1)
    if (fret !== 'x') {
      while (Number(fret) + transposeBy < 0) {
        transposeBy += 12
      }
    }
  }

  const transposed = []
  for (const spot of spots) {
    const stringNumber = spot[0]
    const fret = spot.slice(1)
    const nextFret = fret === 'x' ? 'x' : Number(fret) + transposeBy
    if (nextFret > 15) return null
    transposed.push(`${stringNumber}${nextFret}`)
  }
  return transposed.join('_')
}

function getShapeCategory(root, sourceShape) {
  const sourceEnharmonic = ENHARMONIC_ROOT[sourceShape.ro] ?? sourceShape.ro
  if (sourceShape.tr === '1') return 'moveable'
  if (sourceShape.ro === root || sourceEnharmonic === root) return 'open'
  return 'capo'
}

function convertShape(root, sourceShape, outputType, aliasRule) {
  let shapeString = sourceShape.sf
  if (root !== sourceShape.ro) {
    shapeString = transposeSpots(sourceShape.sf, sourceShape.ro, root)
    if (!shapeString) return null
  }

  const frets = Array.from({ length: 6 }, () => null)
  const intervals = Array.from({ length: 6 }, () => null)
  const spotTokens = shapeString.split('_')
  const intervalTokens = sourceShape.iv.split('_')
  let lowFret = Number.POSITIVE_INFINITY
  let highFret = 0

  spotTokens.forEach((spot, index) => {
    const stringNumber = Number(spot[0])
    const stringIndex = 6 - stringNumber
    const fretToken = spot.slice(1)
    if (fretToken === 'x') return

    const fret = Number(fretToken)
    frets[stringIndex] = fret
    lowFret = Math.min(lowFret, fret)
    highFret = Math.max(highFret, fret)

    const interval = intervalTokens[index]
    intervals[stringIndex] = aliasRule && interval === aliasRule.replace ? aliasRule.by : interval
  })

  if (!frets.some((fret) => fret !== null)) return null

  const hasOpenString = frets.some((fret) => fret === 0)
  const useCapo = sourceShape.capo === '1' || (sourceShape.tr === '0' && hasOpenString)

  return {
    frets,
    intervals,
    category: getShapeCategory(root, sourceShape),
    sourceRoot: sourceShape.ro,
    sourceType: outputType,
    mustKnow: sourceShape.mk === 1 || sourceShape.mk === '1' || sourceShape.mk === root,
    lowFret,
    highFret,
    ...(useCapo && lowFret > 0 ? { capoFret: lowFret } : {}),
  }
}

function compareVoicings(left, right) {
  const mustKnow = Number(right.mustKnow) - Number(left.mustKnow)
  if (mustKnow !== 0) return mustKnow

  const category = CATEGORY_ORDER[left.category] - CATEGORY_ORDER[right.category]
  if (category !== 0) return category

  const lowFret = left.lowFret - right.lowFret
  if (lowFret !== 0) return lowFret

  return left.highFret - right.highFret
}

function buildVoicings(root, chordTypeRow, chordsdb) {
  let sourceType = chordTypeRow.chordtype
  let aliasRule = null
  if (!Array.isArray(chordsdb[sourceType]) && chordsdb[sourceType]?.ot) {
    aliasRule = {
      replace: chordsdb[sourceType].rp,
      by: chordsdb[sourceType].by,
    }
    sourceType = chordsdb[sourceType].ot
  }

  const voicingsByFrets = new Map()
  for (const sourceShape of chordsdb[sourceType] ?? []) {
    if (sourceShape.bi !== (chordTypeRow.bassInt ?? '')) continue
    if (sourceShape.no === root) continue

    const voicing = convertShape(root, sourceShape, chordTypeRow.chordtype, aliasRule)
    if (!voicing) continue

    const key = voicing.frets.join(',')
    if (!voicingsByFrets.has(key) || compareVoicings(voicing, voicingsByFrets.get(key)) < 0) {
      voicingsByFrets.set(key, voicing)
    }
  }

  return [...voicingsByFrets.values()].sort(compareVoicings)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const outPath = args.out ?? DEFAULT_OUT
  const [chordsSource, listSource] = await Promise.all([
    readText(args.chordsdb, DEFAULT_CHORDS_URL),
    readText(args.list, DEFAULT_LIST_URL),
  ])
  const { chordsdb, chordtypesdb } = loadOolimoData(chordsSource)
  const chordUrls = extractChordUrls(listSource)

  const chords = chordUrls.map((urlToken) => {
    const { root, suffix } = parseChordUrl(urlToken)
    const chordTypeRow = findChordTypeRow(root, suffix, chordtypesdb)
    const voicings = buildVoicings(root, chordTypeRow, chordsdb)
    return {
      id: urlToken,
      root,
      type: chordTypeRow.chordtype,
      bassInterval: chordTypeRow.bassInt ?? null,
      url: `https://www.oolimo.com/en/guitar-chords/${encodeURIComponent(urlToken)}`,
      voicings,
    }
  })

  const database = {
    version: 1,
    source: {
      name: 'Oolimo Guitar Chords',
      chordListUrl: DEFAULT_LIST_URL,
      chordsUrl: DEFAULT_CHORDS_URL,
    },
    tuning: {
      name: 'standard',
      strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      openMidi: [40, 45, 50, 55, 59, 64],
    },
    chords,
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, `${JSON.stringify(database, null, 2)}\n`)
  const voicingCount = chords.reduce((sum, chord) => sum + chord.voicings.length, 0)
  const emptyCount = chords.filter((chord) => chord.voicings.length === 0).length
  console.log(`Wrote ${chords.length} chords and ${voicingCount} voicings to ${outPath}`)
  if (emptyCount > 0) {
    console.warn(`${emptyCount} chords have no generated voicings`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
