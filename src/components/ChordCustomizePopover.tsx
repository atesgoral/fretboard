import { useId } from 'react'
import type { ChordPlayback } from './chordPlayback'
import {
  CHORD_INVERSION_OPTIONS,
  CHORD_PLAY_STYLE_OPTIONS,
  CHORD_REGISTER_OPTIONS,
} from './chordPlayback'

type ChordCustomizePopoverProps = {
  playback: ChordPlayback
  onChange: (playback: Partial<ChordPlayback>) => void
}

const fieldClass =
  'w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100'

const labelClass =
  'mb-1 block text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400'

export default function ChordCustomizePopover({ playback, onChange }: ChordCustomizePopoverProps) {
  const panelId = useId()

  return (
    <div
      id={panelId}
      role="dialog"
      aria-label="Chord playback settings"
      className="absolute bottom-full left-0 z-20 mb-2 w-44 rounded-md border border-zinc-300 bg-white p-2 shadow-lg dark:border-zinc-600 dark:bg-zinc-950"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="mb-2">
        <label htmlFor={`${panelId}-style`} className={labelClass}>
          Style
        </label>
        <select
          id={`${panelId}-style`}
          value={playback.style}
          onChange={(event) => onChange({ style: event.target.value as ChordPlayback['style'] })}
          className={fieldClass}
        >
          {CHORD_PLAY_STYLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label htmlFor={`${panelId}-register`} className={labelClass}>
          Register
        </label>
        <select
          id={`${panelId}-register`}
          title="Voicing position on the neck (lower, standard, or higher)"
          value={playback.register}
          onChange={(event) =>
            onChange({ register: Number(event.target.value) as ChordPlayback['register'] })
          }
          className={fieldClass}
        >
          {CHORD_REGISTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${panelId}-inversion`} className={labelClass}>
          Inversion
        </label>
        <select
          id={`${panelId}-inversion`}
          value={playback.inversion}
          onChange={(event) =>
            onChange({ inversion: Number(event.target.value) as ChordPlayback['inversion'] })
          }
          className={fieldClass}
        >
          {CHORD_INVERSION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
