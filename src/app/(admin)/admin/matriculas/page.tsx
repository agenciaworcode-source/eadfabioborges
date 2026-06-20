import { createClient } from '@/lib/supabase/server'
import { AdminMatriculasClient } from '@/components/admin/AdminMatriculasClient'

interface CourseRaw {
  id: string
  title: string
}

export default async function AdminMatriculasPage() {
  const supabase = createClient()

  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, title')
    .order('title')

  const courseOptions = (coursesData ?? []) as unknown as CourseRaw[]

  return (
    <AdminMatriculasClient
      courseOptions={courseOptions.map((c) => ({ id: c.id, title: c.title }))}
    />
  )
}
