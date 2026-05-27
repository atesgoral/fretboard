import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Activity,
  AudioLines,
  Check,
  Menu,
  Monitor,
  Rows3,
  Sun,
  ArrowUpDown,
  Moon,
} from 'lucide-react'
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
  reverbEnabled: boolean
  onToggleReverb: () => void
}

const getThemeLabel = (preference: ThemePreference) => {
  if (preference === 'system') return 'System'
  if (preference === 'light') return 'Light'
  return 'Dark'
}

const ThemeIcon = ({ preference }: { preference: ThemePreference }) => {
  const className = 'h-4 w-4'
  if (preference === 'system') return <Monitor className={className} aria-hidden="true" />
  if (preference === 'light') return <Sun className={className} aria-hidden="true" />
  return <Moon className={className} aria-hidden="true" />
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
  reverbEnabled,
  onToggleReverb,
}: SettingsMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <span title="Open settings menu" className="inline-flex">
          <button
            type="button"
            title="Open settings menu"
            aria-label="Open settings menu"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </span>
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
              <Rows3 className="h-4 w-4" aria-hidden="true" /> Fret spacing
            </span>
            <span>{linear ? 'Linear' : 'Realistic'}</span>
          </MenuItem>
        </DropdownMenu.Item>

        <DropdownMenu.CheckboxItem checked={!lowEAtBottom} onCheckedChange={onToggleLowEPosition}>
          <MenuItem>
            <span className="inline-flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" aria-hidden="true" /> Show low E on top
            </span>
            <DropdownMenu.ItemIndicator>
              <Check className="h-4 w-4" aria-hidden="true" />
            </DropdownMenu.ItemIndicator>
          </MenuItem>
        </DropdownMenu.CheckboxItem>

        <DropdownMenu.CheckboxItem checked={naturalDecay} onCheckedChange={onToggleNaturalDecay}>
          <MenuItem>
            <span className="inline-flex items-center gap-2">
              <Activity className="h-4 w-4" aria-hidden="true" /> Natural decay
            </span>
            <DropdownMenu.ItemIndicator>
              <Check className="h-4 w-4" aria-hidden="true" />
            </DropdownMenu.ItemIndicator>
          </MenuItem>
        </DropdownMenu.CheckboxItem>

        <DropdownMenu.CheckboxItem checked={reverbEnabled} onCheckedChange={onToggleReverb}>
          <MenuItem>
            <span className="inline-flex items-center gap-2">
              <AudioLines className="h-4 w-4" aria-hidden="true" /> Reverb
            </span>
            <DropdownMenu.ItemIndicator>
              <Check className="h-4 w-4" aria-hidden="true" />
            </DropdownMenu.ItemIndicator>
          </MenuItem>
        </DropdownMenu.CheckboxItem>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
