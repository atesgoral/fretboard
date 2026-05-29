import { Eye, EyeOff } from 'lucide-react'

type ChordNotesVisibilityButtonProps = {
  showChordNotes: boolean
  onToggleChordNotes: () => void
  className: string
}

export default function ChordNotesVisibilityButton({
  showChordNotes,
  onToggleChordNotes,
  className,
}: ChordNotesVisibilityButtonProps) {
  const title = showChordNotes ? 'Hide chord notes' : 'Show chord notes'

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onToggleChordNotes}
      className={className}
    >
      {showChordNotes ? (
        <Eye className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <EyeOff className="pointer-events-none h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  )
}
