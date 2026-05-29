import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

const DEFAULT_CHORDS_URL = 'https://www.oolimo.com/data/chordsdb26.js'
const DEFAULT_LIST_URL = 'https://www.oolimo.com/en/guitar-chords/list'
const DEFAULT_CHORDS_DB_URL =
  'https://raw.githubusercontent.com/tombatossals/chords-db/master/lib/guitar.json'
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
const SHARP_NOTE_BY_PITCH_CLASS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
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
const SEMITONE_TO_INTERVAL = {
  0: '1',
  1: 'b9',
  2: '9',
  3: 'm3',
  4: '3',
  5: '11',
  6: 'b5',
  7: '5',
  8: '#5',
  9: '13',
  10: '7',
  11: 'maj7',
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
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
const CHORDS_DB_SUPPLEMENTS = new Map([
  ['dim', { type: 'dim', intervals: ['1', 'm3', 'b5'] }],
  ['11', { type: '11', intervals: ['1', '3', '5', '7', '9', '11'] }],
  ['alt', { type: 'alt', intervals: ['1', '3', '7', 'b9', '#9', 'b5', '#5'] }],
  ['aug7', { type: 'aug7', intervals: ['1', '3', '#5', '7'] }],
  ['aug9', { type: 'aug9', intervals: ['1', '3', '#5', '7', '9'] }],
  ['9b5', { type: '9b5', intervals: ['1', '3', 'b5', '7', '9'] }],
  ['add11', { type: 'add11', intervals: ['1', '3', '5', '11'] }],
  ['sus2sus4', { type: 'sus2sus4', intervals: ['1', '9', '11', '5'] }],
  ['maj7b5', { type: 'maj7b5', intervals: ['1', '3', 'b5', 'maj7'] }],
  ['maj7sus2', { type: 'maj7sus2', intervals: ['1', '9', '5', 'maj7'] }],
  ['maj11', { type: 'maj11', intervals: ['1', '3', '5', 'maj7', '9', '11'] }],
  ['mmaj7b5', { type: 'm(maj7,b5)', intervals: ['1', 'm3', 'b5', 'maj7'] }],
  ['mmaj9', { type: 'm(maj9)', intervals: ['1', 'm3', '5', 'maj7', '9'] }],
  ['mmaj11', { type: 'm(maj11)', intervals: ['1', 'm3', '5', 'maj7', '9', '11'] }],
])

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

async function readJson(input, fallbackUrl) {
  return JSON.parse(await readText(input, fallbackUrl))
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

function toSharpRoot(root) {
  const rootPc = pitchClass(root)
  if (rootPc === undefined) {
    throw new Error(`Cannot canonicalize root: ${root}`)
  }
  return SHARP_NOTE_BY_PITCH_CLASS[rootPc]
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
    source: 'oolimo',
    sourceRoot: sourceShape.ro,
    sourceType: outputType,
    mustKnow: sourceShape.mk === 1 || sourceShape.mk === '1' || sourceShape.mk === root,
    lowFret,
    highFret,
    ...(useCapo && lowFret > 0 ? { capoFret: lowFret } : {}),
  }
}

function convertOolimoTemplate(sourceShape, outputType, aliasRule) {
  const frets = Array.from({ length: 6 }, () => null)
  const intervals = Array.from({ length: 6 }, () => null)
  const spotTokens = sourceShape.sf.split('_')
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

  return {
    type: outputType,
    bassInterval: sourceShape.bi || null,
    frets,
    intervals,
    source: 'oolimo',
    sourceRoot: sourceShape.ro,
    sourceType: sourceShape.ty,
    transposable: sourceShape.tr === '1',
    mustKnow: sourceShape.mk === 1 || sourceShape.mk === '1' ? true : sourceShape.mk || false,
    ...(sourceShape.no ? { notForRoot: sourceShape.no } : {}),
    ...(sourceShape.oc ? { octaveHigherForRoot: sourceShape.oc } : {}),
    ...(sourceShape.kd === '1' ? { capo: true } : {}),
    lowFret,
    highFret,
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

function buildOolimoTemplates(chordtypesdb, chordsdb) {
  const templatesByKey = new Map()

  for (const chordTypeRow of chordtypesdb) {
    let sourceType = chordTypeRow.chordtype
    let aliasRule = null
    if (!Array.isArray(chordsdb[sourceType]) && chordsdb[sourceType]?.ot) {
      aliasRule = {
        replace: chordsdb[sourceType].rp,
        by: chordsdb[sourceType].by,
      }
      sourceType = chordsdb[sourceType].ot
    }

    for (const sourceShape of chordsdb[sourceType] ?? []) {
      if (sourceShape.bi !== (chordTypeRow.bassInt ?? '')) continue
      const template = convertOolimoTemplate(sourceShape, chordTypeRow.chordtype, aliasRule)
      if (!template) continue
      const key = [
        template.type,
        template.bassInterval ?? '',
        template.sourceRoot,
        template.frets.join(','),
        template.intervals.join(','),
        template.sourceType,
      ].join(':')
      if (!templatesByKey.has(key)) {
        templatesByKey.set(key, template)
      }
    }
  }

  return [...templatesByKey.values()]
}

function getChordsDbActualFret(fret, baseFret) {
  if (fret < 0) return null
  if (fret === 0) return 0
  return baseFret + fret - 1
}

function getChordsDbInterval(root, fret, stringIndex, allowedIntervals) {
  const rootPc = pitchClass(root)
  const notePc = (OPEN_STRING_MIDI[stringIndex] + fret) % 12
  const semitone = (notePc - rootPc + 12) % 12
  const preferred = allowedIntervals.find((interval) => INTERVAL_TO_SEMITONE[interval] === semitone)
  return preferred ?? SEMITONE_TO_INTERVAL[semitone] ?? null
}

function convertChordsDbPosition(chord, position, supplement) {
  const root = toSharpRoot(chord.key)
  const baseFret = position.baseFret ?? 1
  const frets = position.frets.map((fret) => getChordsDbActualFret(fret, baseFret))
  const playedFrets = frets.filter((fret) => fret !== null)
  if (playedFrets.length === 0) return null

  const intervals = frets.map((fret, stringIndex) =>
    fret === null ? null : getChordsDbInterval(root, fret, stringIndex, supplement.intervals),
  )
  const lowFret = Math.min(...playedFrets)
  const highFret = Math.max(...playedFrets)

  return {
    frets,
    intervals,
    category: frets.some((fret) => fret === 0) ? 'open' : 'moveable',
    source: 'chords-db',
    sourceRoot: chord.key,
    sourceType: chord.suffix,
    mustKnow: false,
    lowFret,
    highFret,
    ...(position.barres?.length
      ? { barreFrets: position.barres.map((barre) => baseFret + barre - 1) }
      : {}),
    ...(position.capo ? { capoFret: lowFret } : {}),
  }
}

function buildChordsDbSupplements(chordsDb) {
  const supplementalChords = []

  for (const chordList of Object.values(chordsDb.chords)) {
    for (const chord of chordList) {
      const supplement = CHORDS_DB_SUPPLEMENTS.get(chord.suffix)
      if (!supplement) continue

      const voicingsByFrets = new Map()
      for (const position of chord.positions) {
        const voicing = convertChordsDbPosition(chord, position, supplement)
        if (!voicing) continue
        const key = voicing.frets.join(',')
        if (!voicingsByFrets.has(key) || compareVoicings(voicing, voicingsByFrets.get(key)) < 0) {
          voicingsByFrets.set(key, voicing)
        }
      }

      supplementalChords.push({
        id: `${toSharpRoot(chord.key)}${chord.suffix}`,
        root: toSharpRoot(chord.key),
        type: supplement.type,
        bassInterval: null,
        url: null,
        voicings: [...voicingsByFrets.values()].sort(compareVoicings),
      })
    }
  }

  return supplementalChords
}

function buildChordTypeMappings(chordtypesdb) {
  return chordtypesdb.map((row) => ({
    type: row.chordtype,
    url: row.url,
    bassInterval: row.bassInt ?? null,
    label: row.label,
  }))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const outPath = args.out ?? DEFAULT_OUT
  const [chordsSource, listSource, chordsDb] = await Promise.all([
    readText(args.chordsdb, DEFAULT_CHORDS_URL),
    readText(args.list, DEFAULT_LIST_URL),
    readJson(args['chords-db'], DEFAULT_CHORDS_DB_URL),
  ])
  const { chordsdb, chordtypesdb } = loadOolimoData(chordsSource)
  const chordUrls = extractChordUrls(listSource)
  const oolimoChords = chordUrls.map((urlToken) => {
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
  const supplementalChords = buildChordsDbSupplements(chordsDb)

  const database = {
    version: 1,
    sources: [
      {
        id: 'oolimo',
        name: 'Oolimo Guitar Chords',
        chordListUrl: DEFAULT_LIST_URL,
        chordsUrl: DEFAULT_CHORDS_URL,
      },
      {
        id: 'chords-db',
        name: 'chords-db',
        chordsUrl: DEFAULT_CHORDS_DB_URL,
        license: 'MIT',
        licenseUrl: 'https://github.com/tombatossals/chords-db/blob/master/LICENSE',
      },
    ],
    tuning: {
      name: 'standard',
      strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      openMidi: [40, 45, 50, 55, 59, 64],
    },
    oolimo: {
      chordTypes: buildChordTypeMappings(chordtypesdb),
      templates: buildOolimoTemplates(chordtypesdb, chordsdb),
    },
    supplementalChords,
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, `${JSON.stringify(database, null, 2)}\n`)
  const templateCount = database.oolimo.templates.length
  const supplementalVoicingCount = supplementalChords.reduce(
    (sum, chord) => sum + chord.voicings.length,
    0,
  )
  const emptyCount = oolimoChords.filter((chord) => chord.voicings.length === 0).length
  console.log(`Wrote ${templateCount} Oolimo templates to ${outPath}`)
  console.log(
    `Included ${supplementalChords.length} supplemental chords and ${supplementalVoicingCount} supplemental voicings from chords-db`,
  )
  if (emptyCount > 0) {
    console.warn(`${emptyCount} chords have no generated voicings`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
