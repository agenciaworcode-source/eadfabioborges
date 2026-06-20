const VIMEO_EXTRA_PARAMS = {
  autoplay: '0',
  title: '0',
  byline: '0',
  portrait: '0',
  dnt: '1',
}

function extractIframeSrc(input: string): string {
  const match = input.match(/src=["']([^"']+)["']/i)
  return match?.[1] ?? input
}

function extractVimeoVideoId(pathname: string): string | null {
  const videoMatch = pathname.match(/\/video\/(\d+)/)
  if (videoMatch?.[1]) return videoMatch[1]

  const numericSegment = pathname
    .split('/')
    .filter(Boolean)
    .find((segment) => /^\d+$/.test(segment))

  return numericSegment ?? null
}

export function normalizeVimeoInput(input: string | null | undefined): string | null {
  const trimmed = input?.trim()
  if (!trimmed) return null

  const source = extractIframeSrc(trimmed).trim()
  if (/^\d+$/.test(source)) return source

  try {
    const url = new URL(source)
    const videoId = extractVimeoVideoId(url.pathname)
    if (!videoId) return source

    const privateHash = url.searchParams.get('h')
    if (privateHash) {
      return `https://player.vimeo.com/video/${videoId}?h=${privateHash}`
    }

    return videoId
  } catch {
    return source
  }
}

export function buildVimeoPlayerSrc(vimeoInput: string): string {
  const normalized = normalizeVimeoInput(vimeoInput) ?? vimeoInput

  if (/^https?:\/\//i.test(normalized)) {
    const url = new URL(normalized)
    for (const [key, value] of Object.entries(VIMEO_EXTRA_PARAMS)) {
      url.searchParams.set(key, value)
    }
    return url.toString()
  }

  const url = new URL(`https://player.vimeo.com/video/${normalized}`)
  for (const [key, value] of Object.entries(VIMEO_EXTRA_PARAMS)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}
