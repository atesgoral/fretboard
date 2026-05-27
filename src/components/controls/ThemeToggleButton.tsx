import { Monitor, Moon, Sun } from 'lucide-react'
import type { ThemePreference } from '../../hooks/useThemePreference'

type ThemeToggleButtonProps = {
  preference: ThemePreference
  onToggle: () => void
}

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
    return <Monitor className={className} aria-hidden="true" />
  }

  if (preference === 'light') {
    return <Sun className={className} aria-hidden="true" />
  }

  return <Moon className={className} aria-hidden="true" />
}

export default function ThemeToggleButton({ preference, onToggle }: ThemeToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Toggle color theme"
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
      aria-label="Toggle color theme"
    >
      <ThemeIcon preference={preference} />
      {getThemeLabel(preference)}
    </button>
  )
}
