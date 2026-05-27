import { NOTE_NAMES, type NoteName } from './chords'
import { SCALE_OPTIONS, type ScaleId } from './scales'

type ChordBrowserProps = {
  scaleRoot: NoteName
  scaleId: ScaleId
  onScaleRootChange: (next: NoteName) => void
  onScaleIdChange: (next: ScaleId) => void
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
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

export default function ChordBrowser({ scaleRoot, scaleId, onScaleRootChange, onScaleIdChange }: ChordBrowserProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          label="Key"
          value={scaleRoot}
          options={NOTE_NAMES.map((note) => ({ value: note, label: note }))}
          onChange={(value) => onScaleRootChange(value as NoteName)}
        />
        <SelectField
          label="Scale"
          value={scaleId}
          options={[
            { value: 'major', label: 'Major' },
            { value: 'minor', label: 'Natural Minor' },
          ]}
          onChange={(value) => onScaleIdChange(value as ScaleId)}
        />
      </div>
    </section>
  )
}
