import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
}

export function Avatar({ name, avatarUrl, size = 'md' }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase()

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={cn('rounded-full object-cover flex-shrink-0', sizeMap[size])}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-amber-500 flex items-center justify-center font-semibold text-black flex-shrink-0',
        sizeMap[size]
      )}
      aria-label={name}
    >
      {initial}
    </div>
  )
}
