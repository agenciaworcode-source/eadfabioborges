'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { extractYouTubeId } from '@/lib/youtube'
import { useSaveProgress } from '@/hooks/use-progress'

interface YouTubePlayerProps {
  youtubeUrl: string
  lessonId: string
  courseId: string
  durationSecs: number
  completionPercent?: number
  thumbnailUrl?: string | null
  initialWatchedSecs?: number
  onComplete?: () => void
}

const TICK_MS = 1000
const AUTOSAVE_TICKS = 30

export function YouTubePlayer({
  youtubeUrl,
  lessonId,
  courseId,
  durationSecs,
  completionPercent = 0,
  thumbnailUrl,
  initialWatchedSecs = 0,
  onComplete,
}: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const watchedSecsRef = useRef<number>(initialWatchedSecs)
  const completedRef = useRef<boolean>(false)
  const isPlayingRef = useRef<boolean>(false)
  const ticksSinceLastSaveRef = useRef<number>(0)
  const saveProgress = useSaveProgress(courseId)

  // Exibir thumbnail antes da primeira reprodução quando a posição é zero
  const [showThumbnail, setShowThumbnail] = useState(!!thumbnailUrl && initialWatchedSecs === 0)

  const videoId = extractYouTubeId(youtubeUrl)

  const handleSave = useCallback(
    (completed?: boolean) => {
      void saveProgress(lessonId, watchedSecsRef.current, completed)
    },
    [lessonId, saveProgress]
  )

  const checkCompletion = useCallback(() => {
    if (completedRef.current || durationSecs <= 0) return
    // Se completion_percent > 0 usa esse limiar; caso contrário assume 90% (igual ao VimeoPlayer)
    const threshold =
      completionPercent > 0 ? durationSecs * (completionPercent / 100) : durationSecs * 0.9
    if (watchedSecsRef.current >= threshold) {
      completedRef.current = true
      handleSave(true)
      onComplete?.()
    }
  }, [completionPercent, durationSecs, handleSave, onComplete])

  useEffect(() => {
    if (!videoId) return

    // YouTube IFrame API envia eventos via postMessage quando enablejsapi=1
    function handleMessage(event: MessageEvent) {
      let data: unknown
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }

      type YTEvent = {
        event?: string
        info?: { playerState?: number }
      }
      const msg = data as YTEvent

      if (msg.event === 'onStateChange') {
        const state = msg.info?.playerState
        if (state === 1) {
          // Reproduzindo
          isPlayingRef.current = true
          setShowThumbnail(false)
        } else if (state === 2) {
          // Pausado — salvar posição imediatamente
          isPlayingRef.current = false
          handleSave()
        } else if (state === 0) {
          // Terminou
          isPlayingRef.current = false
          if (!completedRef.current) {
            completedRef.current = true
            handleSave(true)
            onComplete?.()
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Contador de 1 segundo: rastreia posição e dispara auto-save a cada 30s
    const ticker = setInterval(() => {
      if (!isPlayingRef.current) return

      watchedSecsRef.current += 1
      ticksSinceLastSaveRef.current += 1

      if (ticksSinceLastSaveRef.current >= AUTOSAVE_TICKS) {
        ticksSinceLastSaveRef.current = 0
        if (!completedRef.current) handleSave()
      }

      checkCompletion()
    }, TICK_MS)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearInterval(ticker)
    }
  }, [videoId, handleSave, checkCompletion, onComplete])

  if (!videoId) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          aspectRatio: '16/9',
          background: 'radial-gradient(120% 120% at 50% 40%, #1b2740, #0a0e16)',
        }}
      >
        <p className="text-sm" style={{ color: '#6a707a' }}>
          URL do YouTube inválida
        </p>
      </div>
    )
  }

  const startSecs = Math.floor(initialWatchedSecs)
  const embedSrc = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&start=${startSecs}&rel=0&modestbranding=1`

  return (
    <div
      className="relative w-full"
      style={{
        aspectRatio: '16/9',
        background: 'radial-gradient(120% 120% at 50% 40%, #1b2740, #0a0e16)',
      }}
    >
      {showThumbnail && thumbnailUrl ? (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center"
          style={{ border: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }}
          onClick={() => setShowThumbnail(false)}
          aria-label="Reproduzir aula"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt="Thumbnail da aula"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg"
            style={{ background: 'rgba(255,255,255,0.92)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#111">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      ) : (
        <iframe
          ref={iframeRef}
          src={embedSrc}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Aula"
        />
      )}
    </div>
  )
}
