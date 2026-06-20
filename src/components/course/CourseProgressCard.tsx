import Link from 'next/link'
import { BookOpen } from 'lucide-react'

interface CourseProgressCardProps {
  courseId: string
  slug: string
  title: string
  thumbnailUrl: string | null
  completedLessons: number
  totalLessons: number
}

export function CourseProgressCard({
  slug,
  title,
  thumbnailUrl,
  completedLessons,
  totalLessons,
}: CourseProgressCardProps) {
  const percent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <Link
      href={`/dashboard/curso/${slug}`}
      className="group block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-amber-500/40 transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gray-800 overflow-hidden">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-gray-600" />
          </div>
        )}
        {/* Progress badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full">
          {percent}%
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-amber-400 transition-colors">
          {title}
        </h3>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {completedLessons} de {totalLessons} aulas concluídas
          </p>
        </div>
      </div>
    </Link>
  )
}
