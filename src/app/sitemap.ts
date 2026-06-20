import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://ead.fabioborgesoficial.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  const { data } = await supabase
    .from('courses')
    .select('slug, created_at')
    .eq('published', true)

  const courseUrls: MetadataRoute.Sitemap = (data ?? []).map((c) => {
    const course = c as { slug: string; created_at: string }
    return {
      url: `${APP_URL}/cursos/${course.slug}`,
      lastModified: course.created_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }
  })

  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${APP_URL}/cursos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/planos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...courseUrls,
  ]
}
