'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

export interface AssignmentData {
  id: string
  lesson_id: string
  title: string
  instructions: string | null
  deadline: string | null
}

export interface SubmissionData {
  id: string
  user_id: string
  assignment_id: string
  file_url: string | null
  grade: number | null
  feedback: string | null
  graded_at: string | null
  created_at: string
}

interface AssignmentResponse {
  assignment: AssignmentData | null
  submission: SubmissionData | null
}

export function useAssignmentByLesson(lessonId: string | undefined) {
  return useQuery<AssignmentResponse>({
    queryKey: ['assignment', 'lesson', lessonId],
    queryFn: async () => {
      const res = await fetch(`/api/assignment/lesson/${lessonId}`)
      if (!res.ok) throw new Error('Erro ao buscar tarefa')
      return res.json() as Promise<AssignmentResponse>
    },
    enabled: !!lessonId,
    staleTime: 60_000,
  })
}

export function useUploadAssignment(lessonId: string) {
  const queryClient = useQueryClient()

  return async function uploadAssignment(
    assignmentId: string,
    file: File
  ): Promise<{ submissionId: string; fileUrl: string }> {
    const formData = new FormData()
    formData.append('assignmentId', assignmentId)
    formData.append('file', file)

    const res = await fetch('/api/assignment/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = (await res.json()) as { error: string }
      throw new Error(err.error ?? 'Erro ao enviar arquivo')
    }

    const result = (await res.json()) as { submissionId: string; fileUrl: string }

    await queryClient.invalidateQueries({
      queryKey: ['assignment', 'lesson', lessonId],
    })

    return result
  }
}
