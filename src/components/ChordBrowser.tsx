import { CHORD_EXTENSIONS, CHORD_QUALITIES, NOTE_NAMES, type NoteName } from './chords'

type ChordBrowserProps = {
  root: NoteName
  qualityId: string
  extensionIds: string[]
  onRootChange: (next: NoteName) => void
  onQualityChange: (next: string) => void
  onToggleExtension: (id: string) => void
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

export default function ChordBrowser({ root, qualityId, extensionIds, onRootChange, onQualityChange, onToggleExtension }: ChordBrowserProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          label="Root"
          value={root}
          options={NOTE_NAMES.map((note) => ({ value: note, label: note }))}
          onChange={(value) => onRootChange(value as NoteName)}
        />
        <SelectField
          label="Quality"
          value={qualityId}
          options={CHORD_QUALITIES.map((quality) => ({ value: quality.id, label: quality.label }))}
          onChange={onQualityChange}
        />
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="mb-1 w-full text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">Extensions</legend>
          {CHORD_EXTENSIONS.map((extension) => {
            const active = extensionIds.includes(extension.id)
            return (
              <button
                key={extension.id}
                type="button"
                onClick={() => onToggleExtension(extension.id)}
                className={`cursor-pointer rounded-md border px-2 py-1 text-sm transition ${active ? 'border-zinc-800 bg-zinc-800 text-zinc-100 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-100'}`}
              >
                {extension.label}
              </button>
            )
          })}
        </fieldset>
      </div>
    </section>
  )
}
