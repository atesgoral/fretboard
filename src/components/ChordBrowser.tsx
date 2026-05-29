import { NOTE_NAMES, type NoteName } from './chords'
import { Eye, EyeOff } from 'lucide-react'
import { SCALE_OPTIONS, type ScaleId } from './scales'

export type ScaleRootSelection = NoteName | null

const KEY_NONE_VALUE = ''

const KEY_OPTIONS = [
  { value: KEY_NONE_VALUE, label: 'None' },
  ...NOTE_NAMES.map((note) => ({ value: note, label: note })),
]

type ChordBrowserProps = {
  scaleRoot: ScaleRootSelection
  scaleId: ScaleId
  showScaleNotes: boolean
  onScaleRootChange: (next: ScaleRootSelection) => void
  onScaleIdChange: (next: ScaleId) => void
  onToggleScaleNotes: () => void
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <label
      className={`flex min-w-[150px] flex-col gap-1 text-xs font-medium uppercase tracking-[0.08em] text-amber-800 dark:text-amber-300${disabled ? ' opacity-40' : ''}`}
    >
      {label}
      <select
        value={value}
        disabled={disabled}
        title={disabled ? undefined : `Select ${label.toLowerCase()}`}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm font-normal tracking-normal text-zinc-800 disabled:cursor-default dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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

export default function ChordBrowser({
  scaleRoot,
  scaleId,
  showScaleNotes,
  onScaleRootChange,
  onScaleIdChange,
  onToggleScaleNotes,
}: ChordBrowserProps) {
  const scaleToggleTitle = showScaleNotes ? 'Hide scale notes' : 'Show scale notes'

  return (
    <section className="relative rounded-lg border border-amber-200/80 p-3 shadow-sm dark:border-amber-800/50">
      <div className="flex flex-wrap items-end gap-3 pr-8">
        <SelectField
          label="Key"
          value={scaleRoot ?? KEY_NONE_VALUE}
          options={KEY_OPTIONS}
          onChange={(value) =>
            onScaleRootChange(value === KEY_NONE_VALUE ? null : (value as NoteName))
          }
        />
        <SelectField
          label="Scale"
          value={scaleId}
          options={SCALE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(value) => onScaleIdChange(value as ScaleId)}
          disabled={scaleRoot === null}
        />
      </div>
      <button
        type="button"
        title={scaleToggleTitle}
        aria-label={scaleToggleTitle}
        onClick={onToggleScaleNotes}
        className="absolute right-2 top-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition enabled:hover:border-zinc-500 enabled:hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 enabled:dark:hover:border-zinc-400 enabled:dark:hover:text-zinc-100"
      >
        {showScaleNotes ? (
          <Eye className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <EyeOff className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
    </section>
  )
}
