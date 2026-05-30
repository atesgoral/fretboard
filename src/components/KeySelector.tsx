import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { NOTE_NAMES, type NoteName } from './chords'

const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const SHARP_NOTES = [
  { value: 'C#', leftClassName: 'left-[12.5%]' },
  { value: 'D#', leftClassName: 'left-[26.5%]' },
  { value: 'F#', leftClassName: 'left-[55%]' },
  { value: 'G#', leftClassName: 'left-[69.5%]' },
  { value: 'A#', leftClassName: 'left-[84%]' },
] as const

type KeySelectorProps = {
  value: NoteName | null
  onChange: (next: NoteName | null) => void
}

function getRotatedKey(value: NoteName | null, direction: 1 | -1) {
  const currentIndex = value ? NOTE_NAMES.indexOf(value) : direction === 1 ? -1 : 0
  return NOTE_NAMES[(currentIndex + direction + NOTE_NAMES.length) % NOTE_NAMES.length]
}

function NaturalKeyButton({
  note,
  selected,
  onSelect,
}: {
  note: NoteName
  selected: boolean
  onSelect: (note: NoteName) => void
}) {
  return (
    <button
      type="button"
      title={`Select ${note} key`}
      aria-pressed={selected}
      onClick={() => onSelect(note)}
      className={`flex h-16 flex-1 cursor-pointer items-end justify-center rounded-sm border border-zinc-300 pb-2 text-sm font-medium transition enabled:hover:border-amber-400 enabled:hover:bg-amber-50 dark:border-zinc-600 dark:enabled:hover:border-amber-500 dark:enabled:hover:bg-amber-950/40 ${
        selected
          ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100'
          : 'bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
      }`}
    >
      {note}
    </button>
  )
}

function SharpKeyButton({
  note,
  leftClassName,
  selected,
  onSelect,
}: {
  note: NoteName
  leftClassName: string
  selected: boolean
  onSelect: (note: NoteName) => void
}) {
  return (
    <button
      type="button"
      title={`Select ${note} key`}
      aria-label={`Select ${note} key`}
      aria-pressed={selected}
      onClick={() => onSelect(note)}
      className={`absolute top-2 z-10 flex h-8 w-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-sm border text-xs font-semibold shadow-sm transition enabled:hover:border-amber-300 enabled:hover:bg-zinc-700 enabled:hover:text-amber-100 ${leftClassName} ${
        selected
          ? 'border-amber-200 bg-amber-500 text-zinc-950'
          : 'border-zinc-600 bg-zinc-950 text-white dark:border-zinc-300 dark:bg-black'
      }`}
    >
      <span aria-hidden="true">#</span>
    </button>
  )
}

export default function KeySelector({ value, onChange }: KeySelectorProps) {
  const [open, setOpen] = useState(false)
  const keyboardActiveRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const labelId = useId()
  const valueId = useId()
  const displayValue = value ?? 'None'

  const handleKeyboardSelection = useCallback(
    (key: string) => {
      if (key === 'ArrowRight' || key === 'ArrowDown' || key === 'Right' || key === 'Down') {
        onChange(getRotatedKey(value, 1))
        return true
      }

      if (key === 'ArrowLeft' || key === 'ArrowUp' || key === 'Left' || key === 'Up') {
        onChange(getRotatedKey(value, -1))
        return true
      }

      if (key === 'Escape') {
        setOpen(false)
        return true
      }

      return false
    },
    [onChange, value],
  )

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        keyboardActiveRef.current = false
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  useEffect(() => {
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      const focusInside = rootRef.current?.contains(document.activeElement)

      if (!keyboardActiveRef.current && !focusInside) return

      if (handleKeyboardSelection(event.key)) {
        event.preventDefault()
      }
    }

    document.addEventListener('keydown', handleDocumentKeyDown)
    return () => document.removeEventListener('keydown', handleDocumentKeyDown)
  }, [handleKeyboardSelection])

  const selectKey = (note: NoteName) => {
    keyboardActiveRef.current = true
    onChange(note)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div
      ref={rootRef}
      onBlurCapture={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          keyboardActiveRef.current = false
        }
      }}
      onFocusCapture={() => {
        keyboardActiveRef.current = true
      }}
      onKeyDown={(event) => {
        if (handleKeyboardSelection(event.key)) {
          event.preventDefault()
        }
      }}
      onPointerDown={() => {
        keyboardActiveRef.current = true
      }}
      className="relative flex w-16 flex-col gap-1 text-xs font-medium uppercase tracking-[0.08em] text-amber-800 dark:text-amber-300"
    >
      <span id={labelId}>Key</span>
      <button
        ref={triggerRef}
        type="button"
        title="Select key"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => {
          keyboardActiveRef.current = true
          setOpen((current) => !current)
        }}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-zinc-300 bg-white px-2 text-sm font-normal tracking-normal text-zinc-800 transition enabled:hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 enabled:dark:hover:border-zinc-500"
      >
        <span id={valueId}>{displayValue}</span>
        <ChevronDown className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Select key"
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <button
            type="button"
            title="Select no key"
            aria-pressed={value === null}
            onClick={() => {
              keyboardActiveRef.current = true
              onChange(null)
              setOpen(false)
              triggerRef.current?.focus()
            }}
            className={`mb-3 w-full cursor-pointer rounded-md border px-3 py-2 text-sm font-medium normal-case tracking-normal transition enabled:hover:border-zinc-400 enabled:hover:bg-zinc-50 dark:enabled:hover:border-zinc-500 dark:enabled:hover:bg-zinc-800 ${
              value === null
                ? 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-900/60 dark:text-amber-100'
                : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
            }`}
          >
            None
          </button>
          <div className="relative pt-9" aria-label="Piano key layout">
            <div className="flex gap-1">
              {NATURAL_NOTES.map((note) => (
                <NaturalKeyButton
                  key={note}
                  note={note}
                  selected={value === note}
                  onSelect={selectKey}
                />
              ))}
            </div>
            {SHARP_NOTES.map(({ value: note, leftClassName }) => (
              <SharpKeyButton
                key={note}
                note={note}
                leftClassName={leftClassName}
                selected={value === note}
                onSelect={selectKey}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
