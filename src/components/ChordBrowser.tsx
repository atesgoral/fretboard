import { NOTE_NAMES, type NoteName } from './chords'
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
  onScaleRootChange: (next: ScaleRootSelection) => void
  onScaleIdChange: (next: ScaleId) => void
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="flex min-w-[150px] flex-col gap-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
      {label}
      <select
        value={value}
        title={`Select ${label.toLowerCase()}`}
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

export default function ChordBrowser({
  scaleRoot,
  scaleId,
  onScaleRootChange,
  onScaleIdChange,
}: ChordBrowserProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-end gap-3">
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
        />
      </div>
    </section>
  )
}
