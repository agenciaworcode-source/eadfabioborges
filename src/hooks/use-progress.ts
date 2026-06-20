'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

interface LessonProgressData {
  completed: boolean
  watchedSecs: number
}

interface CourseProgressResponse {
  lessons: Record<string, LessonProgressData>
}

export function useCourseProgress(courseId: string) {
  return useQuery<CourseProgressResponse>({
    queryKey: ['progress', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/progress/${courseId}`)
      if (!res.ok) throw new Error('Erro ao buscar progresso')
      return res.json() as Promise<CourseProgressResponse>
    },
    staleTime: 30_000,
    enabled: !!courseId,
  })
}

export function useSaveProgress(courseId: string) {
  const queryClient = useQueryClient()

  return async function saveProgress(
    lessonId: string,
    watchedSecs: number,
    completed?: boolean
  ) {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, watchedSecs, completed }),
      })

      // Invalida cache para refletir progresso atualizado
      await queryClient.invalidateQueries({ queryKey: ['progress', courseId] })
    } catch {
      // Falha silenciosa — auto-save não deve interromper o player
    }
  }
}
