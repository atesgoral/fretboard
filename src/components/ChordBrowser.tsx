import { useEffect, useMemo, useState } from 'react'
import { CHORD_EXTENSIONS, NOTE_NAMES, type NoteName } from './chords'
import {
  CHORD_PRESETS,
  getAutocompleteTokens,
  getChordPresetById,
  getChordQueryForSelection,
  getPresetIdForSelection,
  parseChordQuery,
} from './chordSearch'

type ChordSelection = { root: NoteName; qualityId: string; extensionIds: string[] }
type ScaleId = 'major' | 'minor'
type ChordSetType = 'triads' | 'sevenths'

type ChordBrowserProps = {
  root: NoteName
  qualityId: string
  extensionIds: string[]
  onRootChange: (next: NoteName) => void
  onQualityChange: (next: string) => void
  onExtensionsChange: (ids: string[]) => void
  onToggleExtension: (id: string) => void
  onAddChordToPalette: (chord: ChordSelection) => void
  onPlayChord: (chord: ChordSelection) => void
  voicingMode: 'strum' | 'finger' | 'shell'
  onVoicingModeChange: (mode: 'strum' | 'finger' | 'shell') => void
  inversion: 0 | 1 | 2
  onInversionChange: (inversion: 0 | 1 | 2) => void
  displayMode: 'fretboard' | 'shape'
  onDisplayModeChange: (mode: 'fretboard' | 'shape') => void
}

const SCALE_INTERVALS: Record<ScaleId, number[]> = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] }
const DEGREE_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const TRIAD_QUALITIES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
const TRIAD_QUALITIES_MINOR = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj']
const SEVENTH_QUALITIES_MAJOR = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
const SEVENTH_EXTENSIONS_MAJOR = [['7'], ['b7'], ['b7'], ['7'], ['b7'], ['b7'], ['b7']]
const SEVENTH_QUALITIES_MINOR = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj']
const SEVENTH_EXTENSIONS_MINOR = [['b7'], ['b7'], ['7'], ['b7'], ['b7'], ['7'], ['b7']]

function SelectField({ label, value, options, onChange, title }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; title?: string }) {
  return <label className="flex min-w-[150px] flex-col gap-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">{label}<select value={value} title={title} onChange={(event) => onChange(event.target.value)} className="cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm font-normal tracking-normal text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function InKeyChordCard({ degree, label, onAdd, onPlay }: { degree: string; label: string; onAdd: () => void; onPlay: () => void }) {
  return (
    <div className="group relative h-24 w-24">
      <div className="flex h-full w-full flex-col justify-between rounded-md border border-zinc-300 bg-white p-2 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="text-xs uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">{degree}</div>
        <div className="text-sm font-semibold">{label}</div>
      </div>
      <button type="button" title={`Add ${label} to palette`} onClick={onAdd} className="absolute right-1 top-1 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-400 group-hover:flex">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
      </button>
      <button type="button" title={`Play ${label}`} onClick={onPlay} className="absolute bottom-1 right-1 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 group-hover:flex dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:text-zinc-100">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 6v12l10-6-10-6Z" /></svg>
      </button>
    </div>
  )
}

export default function ChordBrowser(props: ChordBrowserProps) {
  const { root, qualityId, extensionIds, onRootChange, onQualityChange, onExtensionsChange, onToggleExtension, onAddChordToPalette, onPlayChord, voicingMode, onVoicingModeChange, inversion, onInversionChange, displayMode, onDisplayModeChange } = props
  const presetOptions = CHORD_PRESETS.map((preset) => ({ value: preset.id, label: preset.label }))
  const selectedPresetId = getPresetIdForSelection(qualityId, extensionIds) ?? 'major-triad'
  const [query, setQuery] = useState(() => getChordQueryForSelection(root, qualityId, extensionIds))
  const [hasError, setHasError] = useState(false)
  const [scaleRoot, setScaleRoot] = useState<NoteName>('C')
  const [scaleId, setScaleId] = useState<ScaleId>('major')
  const [chordSetType, setChordSetType] = useState<ChordSetType>('triads')

  const inKeyChords = useMemo(() => {
    const rootIndex = NOTE_NAMES.indexOf(scaleRoot)
    const intervals = SCALE_INTERVALS[scaleId]
    const triadQualities = scaleId === 'major' ? TRIAD_QUALITIES : TRIAD_QUALITIES_MINOR
    const seventhQualities = scaleId === 'major' ? SEVENTH_QUALITIES_MAJOR : SEVENTH_QUALITIES_MINOR
    const seventhExtensions = scaleId === 'major' ? SEVENTH_EXTENSIONS_MAJOR : SEVENTH_EXTENSIONS_MINOR
    return intervals.map((interval, index) => {
      const chordRoot = NOTE_NAMES[(rootIndex + interval) % 12]
      const quality = triadQualities[index]
      const extensionIds = chordSetType === 'sevenths' ? seventhExtensions[index] : []
      const qualityId = chordSetType === 'sevenths' ? seventhQualities[index] : quality
      const chord = { root: chordRoot, qualityId, extensionIds }
      return { degree: DEGREE_LABELS[index], label: getChordQueryForSelection(chord.root, chord.qualityId, chord.extensionIds), chord }
    })
  }, [scaleRoot, scaleId, chordSetType])

  const applyQueryToSelection = (nextQuery: string) => {
    const parsed = parseChordQuery(nextQuery, { root, qualityId, extensionIds })
    const unchanged = parsed.root === root && parsed.qualityId === qualityId && JSON.stringify(parsed.extensionIds) === JSON.stringify(extensionIds)
    if (unchanged && nextQuery.trim().toLowerCase() !== getChordQueryForSelection(root, qualityId, extensionIds).toLowerCase()) {
      setHasError(true)
      return
    }
    setHasError(false)
    onRootChange(parsed.root)
    onQualityChange(parsed.qualityId)
    onExtensionsChange(parsed.extensionIds)
  }

  useEffect(() => {
    setQuery(getChordQueryForSelection(root, qualityId, extensionIds))
    setHasError(false)
  }, [root, qualityId, extensionIds])

  const autocompleteTokens = useMemo(() => getAutocompleteTokens(), [])

  return <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"><div className="flex flex-wrap items-end gap-3"><SelectField label="Key" value={scaleRoot} options={NOTE_NAMES.map((note) => ({ value: note, label: note }))} onChange={(value) => setScaleRoot(value as NoteName)} /><SelectField label="Scale" value={scaleId} options={[{ value: 'major', label: 'Major' }, { value: 'minor', label: 'Natural Minor' }]} onChange={(value) => setScaleId(value as ScaleId)} /><SelectField label="Chord Set" value={chordSetType} options={[{ value: 'triads', label: 'Triads' }, { value: 'sevenths', label: '7ths' }]} onChange={(value) => setChordSetType(value as ChordSetType)} /></div><div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">{inKeyChords.map(({ degree, label, chord }) => <InKeyChordCard key={`${degree}-${label}`} degree={degree} label={label} onAdd={() => onAddChordToPalette(chord)} onPlay={() => onPlayChord(chord)} />)}</div><div className="mt-3 flex flex-wrap items-end gap-3"><label className="flex min-w-[180px] flex-col gap-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">Chord Search<div className="relative"><input value={query} list="chord-autocomplete" onBlur={() => applyQueryToSelection(query)} onKeyDown={(event) => { if (event.key === 'Enter') applyQueryToSelection(query) }} onChange={(event) => setQuery(event.target.value)} placeholder="Cmaj7, F#m7, Bb7sus4" className={`w-full rounded-md border bg-white px-2 py-2 pr-8 text-sm font-normal tracking-normal text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 ${hasError ? 'border-red-500 dark:border-red-400' : 'border-zinc-300 dark:border-zinc-700'}`} /><button type="button" tabIndex={hasError ? 0 : -1} aria-label={hasError ? 'Chord name could not be recognized' : 'Chord name recognized'} title={hasError ? 'Unrecognized chord name.' : 'Chord recognized'} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`h-4 w-4 ${hasError ? 'text-red-600 dark:text-red-400' : 'text-transparent'}`}><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M10 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="10" cy="5.5" r="1" fill="currentColor" /></svg></button></div><datalist id="chord-autocomplete">{autocompleteTokens.map((token) => <option key={token} value={token} />)}</datalist></label><SelectField label="Root" value={root} options={NOTE_NAMES.map((note) => ({ value: note, label: note }))} onChange={(value) => onRootChange(value as NoteName)} /><SelectField label="Chord Type" value={selectedPresetId} options={presetOptions} onChange={(presetId) => { const preset = getChordPresetById(presetId); onQualityChange(preset.qualityId); onExtensionsChange(preset.extensionIds) }} /><fieldset className="flex flex-wrap items-center gap-2"><legend className="mb-1 w-full text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">Extensions</legend>{CHORD_EXTENSIONS.map((extension) => { const active = extensionIds.includes(extension.id); return <button key={extension.id} type="button" title={`Toggle ${extension.label} extension`} onClick={() => onToggleExtension(extension.id)} className={`cursor-pointer rounded-md border px-2 py-1 text-sm transition ${active ? 'border-zinc-800 bg-zinc-800 text-zinc-100 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-100'}`}>{extension.label}</button> })}</fieldset><SelectField label="Play Style" value={voicingMode} options={[{ value: 'strum', label: 'Strum' }, { value: 'finger', label: 'Fingerpicking' }, { value: 'shell', label: 'Shell' }]} title="Select a chord play style" onChange={(value) => onVoicingModeChange(value as 'strum' | 'finger' | 'shell')} /><SelectField label="Inversion" value={String(inversion)} options={[{ value: '0', label: 'Root position' }, { value: '1', label: '1st inversion' }, { value: '2', label: '2nd inversion' }]} onChange={(value) => onInversionChange(Number(value) as 0 | 1 | 2)} /><SelectField label="Display" value={displayMode} options={[{ value: 'fretboard', label: 'Full fretboard notes' }, { value: 'shape', label: 'Single-position shape' }]} onChange={(value) => onDisplayModeChange(value as 'fretboard' | 'shape')} /></div></section>
}
