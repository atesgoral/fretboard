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
  const gearButtonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!customizeOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (containerRef.current?.contains(target)) {
        return
      }
      if (popoverRef.current?.contains(target)) {
        return
      }
      setCustomizeOpen(false)
    }

    const listenerId = window.setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDown)
    }, 0)

    return () => {
      window.clearTimeout(listenerId)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [customizeOpen])

  const handleCustomizeOpen = () => {
    setCustomizeOpen(true)
  }

  const handlePlaybackChange = (playback: Partial<ChordPlayback>) => {
    onPlaybackChange(playback)
  }

  return (
    <div ref={containerRef} className={`relative shrink-0 ${customizeOpen ? 'z-30' : ''}`}>
      <ChordCard
        chord={chord}
        showControls={customizeOpen}
        customizeButtonRef={gearButtonRef}
        onPlay={onPlay}
        onHoverStart={onHoverStart}
        onRemove={onRemove}
        onCustomize={handleCustomizeOpen}
      />
      {customizeOpen ? (
        <ChordCustomizePopover
          anchorRef={gearButtonRef}
          panelRef={popoverRef}
          playback={chord}
          onChange={handlePlaybackChange}
        />
      ) : null}
    </div>
  )
}
