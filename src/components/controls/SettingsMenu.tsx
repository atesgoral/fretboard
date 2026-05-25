import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import type { ThemePreference } from '../../hooks/useThemePreference'

type SettingsMenuProps = {
  preference: ThemePreference
  onCycleTheme: () => void
  linear: boolean
  onToggleLinear: () => void
  lowEAtBottom: boolean
  onToggleLowEPosition: () => void
  naturalDecay: boolean
  onToggleNaturalDecay: () => void
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

const MenuIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" {...ICON_STROKE_PROPS} />
  </svg>
)

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

const SpacingIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M4 6h16M4 18h16" {...ICON_STROKE_PROPS} />
    <path d="M7 6v12M12 6v12M17 6v12" {...ICON_STROKE_PROPS} />
  </svg>
)

const StringOrderIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M6 5v14m0 0-3-3m3 3 3-3" {...ICON_STROKE_PROPS} />
    <path d="M18 19V5m0 0-3 3m3-3 3 3" {...ICON_STROKE_PROPS} />
  </svg>
)

const CheckIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M5 13.5 10 18l9-11" {...ICON_STROKE_PROPS} />
  </svg>
)

const DecayIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M4 18c2.8-5.3 5.5-7.8 8-7.8 2.1 0 4 .8 8 3.8" {...ICON_STROKE_PROPS} />
    <path d="M16 9.5h4v4" {...ICON_STROKE_PROPS} />
  </svg>
)

const getThemeLabel = (preference: ThemePreference) => {
  if (preference === 'system') return 'System'
  if (preference === 'light') return 'Light'
  return 'Dark'
}

const ThemeIcon = ({ preference }: { preference: ThemePreference }) => {
  const className = 'h-4 w-4'
  if (preference === 'system') return <SystemIcon className={className} />
  if (preference === 'light') return <LightIcon className={className} />
  return <DarkIcon className={className} />
}

function MenuItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none transition data-[highlighted]:bg-zinc-100 dark:text-zinc-100 dark:data-[highlighted]:bg-zinc-800">
      {children}
    </div>
  )
}

export default function SettingsMenu({
  preference,
  onCycleTheme,
  linear,
  onToggleLinear,
  lowEAtBottom,
  onToggleLowEPosition,
  naturalDecay,
  onToggleNaturalDecay,
}: SettingsMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
          aria-label="Open settings menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        sideOffset={8}
        align="end"
        className="z-50 min-w-64 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      >
        <DropdownMenu.Item onSelect={onCycleTheme}>
          <MenuItem>
            <span className="inline-flex items-center gap-2">
              <ThemeIcon preference={preference} /> Theme
            </span>
            <span>{getThemeLabel(preference)}</span>
          </MenuItem>
        </DropdownMenu.Item>

        <DropdownMenu.Item onSelect={onToggleLinear}>
          <MenuItem>
            <span className="inline-flex items-center gap-2">
              <SpacingIcon className="h-4 w-4" /> Fret spacing
            </span>
            <span>{linear ? 'Linear' : 'Realistic'}</span>
          </MenuItem>
        </DropdownMenu.Item>

        <DropdownMenu.CheckboxItem checked={!lowEAtBottom} onCheckedChange={onToggleLowEPosition}>
          <MenuItem>
            <span className="inline-flex items-center gap-2">
              <StringOrderIcon className="h-4 w-4" /> Show low E on top
            </span>
            <DropdownMenu.ItemIndicator>
              <CheckIcon className="h-4 w-4" />
            </DropdownMenu.ItemIndicator>
          </MenuItem>
        </DropdownMenu.CheckboxItem>

        <DropdownMenu.CheckboxItem checked={naturalDecay} onCheckedChange={onToggleNaturalDecay}>
          <MenuItem>
            <span className="inline-flex items-center gap-2">
              <DecayIcon className="h-4 w-4" /> Natural decay
            </span>
            <DropdownMenu.ItemIndicator>
              <CheckIcon className="h-4 w-4" />
            </DropdownMenu.ItemIndicator>
          </MenuItem>
        </DropdownMenu.CheckboxItem>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
