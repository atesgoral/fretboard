type SpacingToggleButtonProps = {
  linear: boolean
  onToggle: () => void
}

type IconProps = {
  className?: string
}

const ICON_STROKE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.8,
}

const LinearSpacingIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M4 6h16M4 18h16" {...ICON_STROKE_PROPS} />
    <path d="M7 6v12M12 6v12M17 6v12" {...ICON_STROKE_PROPS} />
  </svg>
)

const RealisticSpacingIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M3 7c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" {...ICON_STROKE_PROPS} />
    <path d="M3 12c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" {...ICON_STROKE_PROPS} />
    <path d="M3 17c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" {...ICON_STROKE_PROPS} />
  </svg>
)

export default function SpacingToggleButton({ linear, onToggle }: SpacingToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
      aria-label="Toggle fret spacing"
    >
      {linear ? (
        <LinearSpacingIcon className="h-4 w-4" />
      ) : (
        <RealisticSpacingIcon className="h-4 w-4" />
      )}
      {linear ? 'Linear spacing' : 'Realistic spacing'}
    </button>
  )
}
