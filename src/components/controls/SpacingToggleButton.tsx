import { ChartNoAxesColumnIncreasing, Rows3 } from 'lucide-react'

type SpacingToggleButtonProps = {
  linear: boolean
  onToggle: () => void
}

export default function SpacingToggleButton({ linear, onToggle }: SpacingToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Toggle fret spacing"
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
      aria-label="Toggle fret spacing"
    >
      {linear ? (
        <Rows3 className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ChartNoAxesColumnIncreasing className="h-4 w-4" aria-hidden="true" />
      )}
      {linear ? 'Linear spacing' : 'Realistic spacing'}
    </button>
  )
}
