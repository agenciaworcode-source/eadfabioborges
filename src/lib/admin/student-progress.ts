import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type ProgressRow = {
  lesson_id: string
  completed: boolean
  updated_at: string
}

type LessonNode = {
  id: string
  title: string | null
  order: number | null
}

type ModuleNode = {
  id: string
  title: string | null
  order: number | null
  lessons: LessonNode[]
}

type CourseNode = {
  id: string
  title: string | null
  modules: ModuleNode[] | null
}

type EnrollmentNode = {
  course_id: string
  enrolled_at: string
  expires_at: string | null
  courses: CourseNode | null
}

export type AdminUserProgressLesson = {
  lesson_id: string
  lesson_title: string
  is_completed: boolean
}

export type AdminUserProgressModule = {
  module_id: string
  module_title: string
  module_order: number
  total_lessons: number
  completed_lessons: number
  progress_percent: number
  lessons: AdminUserProgressLesson[]
}

export type AdminUserProgressCourse = {
  course_id: string
  course_title: string
  enrolled_at: string
  expires_at: string | null
  total_lessons: number
  completed_lessons: number
  progress_percent: number
  last_activity_at: string | null
  modules: AdminUserProgressModule[]
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return null
  const ts = new Date(value).getTime()
  return Number.isNaN(ts) ? null : ts
}

function sortByOrder<T extends { order: number | null }>(items: T[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export async function getAdminUserProgress(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<AdminUserProgressCourse[]> {
  const { data: enrollmentsData, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select(
      'course_id, enrolled_at, expires_at, courses(id, title, modules(id, title, order, lessons(id, title, order)))'
    )
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false })

  if (enrollmentsError) {
    throw new Error(enrollmentsError.message)
  }

  const enrollments = (enrollmentsData ?? []) as unknown as EnrollmentNode[]
  const lessonToCourseId: Record<string, string> = {}
  const lessonIds: string[] = []

  for (const enrollment of enrollments) {
    const modules = sortByOrder(enrollment.courses?.modules ?? [])
    for (const courseModule of modules) {
      const lessons = sortByOrder(courseModule.lessons ?? [])
      for (const lesson of lessons) {
        lessonIds.push(lesson.id)
        lessonToCourseId[lesson.id] = enrollment.course_id
      }
    }
  }

  const completedLessonIds = new Set<string>()
  const lastActivityByCourse: Record<string, number> = {}

  if (lessonIds.length > 0) {
    const { data: progressData, error: progressError } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, updated_at')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)

    if (progressError) {
      throw new Error(progressError.message)
    }

    const progressRows = (progressData ?? []) as unknown as ProgressRow[]
    for (const row of progressRows) {
      if (row.completed) completedLessonIds.add(row.lesson_id)
      const courseId = lessonToCourseId[row.lesson_id]
      const updatedAt = toTimestamp(row.updated_at)
      if (courseId && updatedAt !== null) {
        const current = lastActivityByCourse[courseId]
        if (current === undefined || updatedAt > current) {
          lastActivityByCourse[courseId] = updatedAt
        }
      }
    }
  }

  return enrollments.map((enrollment) => {
    const course = enrollment.courses
    const modules = sortByOrder(course?.modules ?? []).map((courseModule) => {
      const lessons = sortByOrder(courseModule.lessons ?? [])
      const moduleCompletedLessons = lessons.filter((lesson) => completedLessonIds.has(lesson.id))
      const totalLessons = lessons.length
      const completedLessons = moduleCompletedLessons.length

      return {
        module_id: courseModule.id,
        module_title: courseModule.title ?? 'Módulo',
        module_order: courseModule.order ?? 0,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percent:
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        lessons: lessons.map((lesson) => ({
          lesson_id: lesson.id,
          lesson_title: lesson.title ?? 'Aula',
          is_completed: completedLessonIds.has(lesson.id),
        })),
      }
    })

    const totalLessons = modules.reduce((sum, module) => sum + module.total_lessons, 0)
    const completedLessons = modules.reduce((sum, module) => sum + module.completed_lessons, 0)
    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return {
      course_id: enrollment.course_id,
      course_title: course?.title ?? 'Curso',
      enrolled_at: enrollment.enrolled_at,
      expires_at: enrollment.expires_at,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      progress_percent: progressPercent,
      last_activity_at:
        lastActivityByCourse[enrollment.course_id] !== undefined
          ? new Date(lastActivityByCourse[enrollment.course_id]).toISOString()
          : null,
      modules,
    }
  })
}
