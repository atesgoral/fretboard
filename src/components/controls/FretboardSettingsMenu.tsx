import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowUpDown, Check, ChartNoAxesColumnIncreasing, Eye, Rows3, Settings } from 'lucide-react'
import type { ReactNode } from 'react'

type FretboardSettingsMenuProps = {
  linear: boolean
  lowEAtBottom: boolean
  showLastPlayedNotes: boolean
  onToggleLinear: () => void
  onToggleLowEPosition: () => void
  onToggleShowLastPlayedNotes: () => void
}

function MenuItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none transition data-[highlighted]:bg-zinc-100 dark:text-zinc-100 dark:data-[highlighted]:bg-zinc-800">
      {children}
    </div>
  )
}

export default function FretboardSettingsMenu({
  linear,
  lowEAtBottom,
  showLastPlayedNotes,
  onToggleLinear,
  onToggleLowEPosition,
  onToggleShowLastPlayedNotes,
}: FretboardSettingsMenuProps) {
  const spacingIconClass = 'h-4 w-4'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title="Open fretboard settings menu"
          aria-label="Open fretboard settings menu"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition enabled:hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 enabled:dark:hover:border-zinc-500"
        >
          <Settings className="pointer-events-none h-5 w-5" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="top"
        align="end"
        sideOffset={8}
        className="z-50 min-w-64 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      >
        <DropdownMenu.Item onSelect={onToggleLinear}>
          <MenuItem>
            <span className="inline-flex items-center gap-2">
              {linear ? (
                <Rows3 className={spacingIconClass} aria-hidden="true" />
              ) : (
                <ChartNoAxesColumnIncreasing className={spacingIconClass} aria-hidden="true" />
              )}
              Fret spacing
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

        <DropdownMenu.CheckboxItem
          checked={showLastPlayedNotes}
          onCheckedChange={onToggleShowLastPlayedNotes}
        >
          <MenuItem>
            <span className="inline-flex items-center gap-2">
              <Eye className="h-4 w-4" aria-hidden="true" /> Show last played notes
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
