import type { ThemePreference } from '../../hooks/useThemePreference'

type ThemeToggleButtonProps = {
  preference: ThemePreference
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

const SystemIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="3.5" y="4.5" width="17" height="12" rx="2" {...ICON_STROKE_PROPS} />
    <path d="M9 19.5h6" {...ICON_STROKE_PROPS} />
    <path d="M12 16.5v3" {...ICON_STROKE_PROPS} />
  </svg>
)

const LightIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="4" {...ICON_STROKE_PROPS} />
    <path d="M12 2.5v2.5M12 19v2.5M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M2.5 12H5M19 12h2.5M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8" {...ICON_STROKE_PROPS} />
  </svg>
)

const DarkIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M15.8 3.5a8.5 8.5 0 1 0 4.7 14.8A9 9 0 1 1 15.8 3.5Z" {...ICON_STROKE_PROPS} />
  </svg>
)

const getThemeLabel = (preference: ThemePreference) => {
  if (preference === 'system') {
    return 'System theme'
  }

  if (preference === 'light') {
    return 'Light theme'
  }

  return 'Dark theme'
}

const ThemeIcon = ({ preference }: { preference: ThemePreference }) => {
  const className = 'h-4 w-4'

  if (preference === 'system') {
    return <SystemIcon className={className} />
  }

  if (preference === 'light') {
    return <LightIcon className={className} />
  }

  return <DarkIcon className={className} />
}

export default function ThemeToggleButton({ preference, onToggle }: ThemeToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
      aria-label="Toggle color theme"
    >
      <ThemeIcon preference={preference} />
      {getThemeLabel(preference)}
    </button>
  )
}
