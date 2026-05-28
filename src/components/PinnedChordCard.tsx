import { useEffect, useRef, useState } from 'react'
import type { ChordPlayback, PinnedChord } from './chordPlayback'
import ChordCard from './ChordCard'
import ChordCustomizePopover from './ChordCustomizePopover'

type PinnedChordCardProps = {
  chord: PinnedChord
  onPlay: () => void
  onHoverStart: () => void
  onRemove: () => void
  onPlaybackChange: (playback: Partial<ChordPlayback>) => void
}

export default function PinnedChordCard({
  chord,
  onPlay,
  onHoverStart,
  onRemove,
  onPlaybackChange,
}: PinnedChordCardProps) {
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!customizeOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return
      }
      setCustomizeOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [customizeOpen])

  const handleCustomizeToggle = () => {
    setCustomizeOpen((open) => !open)
  }

  const handlePlaybackChange = (playback: Partial<ChordPlayback>) => {
    onPlaybackChange(playback)
  }

  return (
    <div ref={containerRef} className={`relative shrink-0 ${customizeOpen ? 'z-30' : ''}`}>
      <ChordCard
        chord={chord}
        showControls={customizeOpen}
        onPlay={onPlay}
        onHoverStart={onHoverStart}
        onRemove={onRemove}
        onCustomize={handleCustomizeToggle}
      />
      {customizeOpen ? (
        <ChordCustomizePopover playback={chord} onChange={handlePlaybackChange} />
      ) : null}
    </div>
  )
}
