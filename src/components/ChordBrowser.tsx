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

type ChordBrowserProps = {
  root: NoteName
  qualityId: string
  extensionIds: string[]
  onRootChange: (next: NoteName) => void
  onQualityChange: (next: string) => void
  onExtensionsChange: (ids: string[]) => void
  onToggleExtension: (id: string) => void
  voicingMode: 'strum' | 'finger' | 'shell'
  onVoicingModeChange: (mode: 'strum' | 'finger' | 'shell') => void
  inversion: 0 | 1 | 2
  onInversionChange: (inversion: 0 | 1 | 2) => void
  displayMode: 'fretboard' | 'shape'
  onDisplayModeChange: (mode: 'fretboard' | 'shape') => void
}

function SelectField({
  label,
  value,
  options,
  onChange,
  title,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  title?: string
}) {
  return (
    <label className="flex min-w-[150px] flex-col gap-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
      {label}
      <select
        value={value}
        title={title}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm font-normal tracking-normal text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ChordAutocomplete({
  query,
  hasError,
  onBlur,
  onInput,
}: {
  query: string
  hasError: boolean
  onBlur: () => void
  onInput: (value: string) => void
}) {
  const autocompleteTokens = useMemo(() => getAutocompleteTokens(), [])

  return (
    <label className="flex min-w-[180px] flex-col gap-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
      Chord Search
      <div className="relative">
        <input
          value={query}
          list="chord-autocomplete"
          onBlur={onBlur}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onBlur()
            }
          }}
          onChange={(event) => onInput(event.target.value)}
          placeholder="Cmaj7, F#m7, Bb7sus4"
          className={`w-full rounded-md border bg-white px-2 py-2 pr-8 text-sm font-normal tracking-normal text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 ${
            hasError ? 'border-red-500 dark:border-red-400' : 'border-zinc-300 dark:border-zinc-700'
          }`}
        />
        <button
          type="button"
          tabIndex={hasError ? 0 : -1}
          aria-label={hasError ? 'Chord name could not be recognized' : 'Chord name recognized'}
          title={hasError ? 'Unrecognized chord name.' : ''}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`h-4 w-4 ${hasError ? 'text-red-600 dark:text-red-400' : 'text-transparent'}`}>
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="5.5" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>
      <datalist id="chord-autocomplete">
        {autocompleteTokens.map((token) => (
          <option key={token} value={token} />
        ))}
      </datalist>
    </label>
  )
}

export default function ChordBrowser({
  root,
  qualityId,
  extensionIds,
  onRootChange,
  onQualityChange,
  onExtensionsChange,
  onToggleExtension,
  voicingMode,
  onVoicingModeChange,
  inversion,
  onInversionChange,
  displayMode,
  onDisplayModeChange,
}: ChordBrowserProps) {
  const presetOptions = CHORD_PRESETS.map((preset) => ({ value: preset.id, label: preset.label }))
  const selectedPresetId = getPresetIdForSelection(qualityId, extensionIds) ?? 'major-triad'
  const [query, setQuery] = useState(() => getChordQueryForSelection(root, qualityId, extensionIds))
  const [hasError, setHasError] = useState(false)

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

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-end gap-3">
        <ChordAutocomplete
          query={query}
          hasError={hasError}
          onBlur={() => applyQueryToSelection(query)}
          onInput={(nextQuery) => setQuery(nextQuery)}
        />
        <SelectField label="Root" value={root} options={NOTE_NAMES.map((note) => ({ value: note, label: note }))} onChange={(value) => onRootChange(value as NoteName)} />
        <SelectField
          label="Chord Type"
          value={selectedPresetId}
          options={presetOptions}
          onChange={(presetId) => {
            const preset = getChordPresetById(presetId)
            onQualityChange(preset.qualityId)
            onExtensionsChange(preset.extensionIds)
          }}
        />
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="mb-1 w-full text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">Extensions</legend>
          {CHORD_EXTENSIONS.map((extension) => {
            const active = extensionIds.includes(extension.id)
            return (
              <button key={extension.id} type="button" title={`Toggle ${extension.label} extension`} onClick={() => onToggleExtension(extension.id)} className={`cursor-pointer rounded-md border px-2 py-1 text-sm transition ${active ? 'border-zinc-800 bg-zinc-800 text-zinc-100 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-100'}`}>
                {extension.label}
              </button>
            )
          })}
        </fieldset>
        <SelectField
          label="Play Style"
          value={voicingMode}
          options={[
            { value: 'strum', label: 'Strum' },
            { value: 'finger', label: 'Fingerpicking' },
            { value: 'shell', label: 'Shell' },
          ]}
          title="Select a chord play style: Strum for broad rhythm, Fingerpicking for separated tones, or Shell for compact core tones"
          onChange={(value) => onVoicingModeChange(value as 'strum' | 'finger' | 'shell')}
        />
        <SelectField
          label="Inversion"
          value={String(inversion)}
          options={[
            { value: '0', label: 'Root position' },
            { value: '1', label: '1st inversion' },
            { value: '2', label: '2nd inversion' },
          ]}
          onChange={(value) => onInversionChange(Number(value) as 0 | 1 | 2)}
        />
        <SelectField
          label="Display"
          value={displayMode}
          options={[
            { value: 'fretboard', label: 'Full fretboard notes' },
            { value: 'shape', label: 'Single-position shape' },
          ]}
          onChange={(value) => onDisplayModeChange(value as 'fretboard' | 'shape')}
        />
      </div>
    </section>
  )
}
