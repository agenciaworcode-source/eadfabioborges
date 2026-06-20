'use client'

import { useEffect, useRef, useCallback } from 'react'
import Player from '@vimeo/player'
import { useSaveProgress } from '@/hooks/use-progress'
import { buildVimeoPlayerSrc } from '@/lib/vimeo'

interface VimeoPlayerProps {
  vimeoId: string
  lessonId: string
  courseId: string
  durationSecs: number
  initialWatchedSecs?: number
  onComplete?: () => void
}

const AUTOSAVE_INTERVAL_MS = 30_000

export function VimeoPlayer({
  vimeoId,
  lessonId,
  courseId,
  durationSecs,
  initialWatchedSecs = 0,
  onComplete,
}: VimeoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<Player | null>(null)
  const watchedSecsRef = useRef<number>(initialWatchedSecs)
  const completedRef = useRef<boolean>(false)
  const saveProgress = useSaveProgress(courseId)

  const handleSave = useCallback(
    (completed?: boolean) => {
      void saveProgress(lessonId, watchedSecsRef.current, completed)
    },
    [lessonId, saveProgress]
  )

  useEffect(() => {
    if (!iframeRef.current) return

    const player = new Player(iframeRef.current)
    playerRef.current = player

    // Retomar do ponto de parada
    if (initialWatchedSecs > 0) {
      void player.setCurrentTime(initialWatchedSecs)
    }

    // Atualiza watchedSecs local a cada timeupdate
    player.on('timeupdate', ({ seconds }: { seconds: number }) => {
      watchedSecsRef.current = Math.floor(seconds)

      // Marca conclusão ao atingir 90% (só uma vez)
      const threshold = durationSecs > 0 ? durationSecs * 0.9 : Infinity
      if (!completedRef.current && watchedSecsRef.current >= threshold) {
        completedRef.current = true
        handleSave(true)
        onComplete?.()
      }
    })

    // Conclusão ao terminar o vídeo
    player.on('ended', () => {
      if (!completedRef.current) {
        completedRef.current = true
        handleSave(true)
        onComplete?.()
      }
    })

    // Auto-save a cada 30s
    const interval = setInterval(() => {
      if (!completedRef.current) {
        handleSave()
      }
    }, AUTOSAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      void player.destroy()
      playerRef.current = null
    }
  }, [vimeoId, lessonId, durationSecs, initialWatchedSecs, handleSave, onComplete])

  const iframeSrc = buildVimeoPlayerSrc(vimeoId)

  return (
    <div className="relative w-full" style={{ aspectRatio: '16/9', background: 'radial-gradient(120% 120% at 50% 40%, #1b2740, #0a0e16)' }}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="absolute inset-0 h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Aula"
      />
    </div>
  )
}
