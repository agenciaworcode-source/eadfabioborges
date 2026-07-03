import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

const BUCKET = 'certificate-assets'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_KINDS = ['signature', 'logo', 'background'] as const

function extFromType(type: string): string {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

export async function POST(request: Request) {
  const { supabase, response } = await requireAdmin()
  if (response) return response

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const kindValue = formData.get('kind')
  const kind = typeof kindValue === 'string' ? kindValue : 'signature'

  if (!ALLOWED_KINDS.includes(kind as (typeof ALLOWED_KINDS)[number])) {
    return NextResponse.json({ error: 'Tipo de asset inválido' }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de arquivo inválido. Use JPEG, PNG ou WebP.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5 MB.' }, { status: 413 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  const path = `${kind}/${crypto.randomUUID()}.${extFromType(file.type)}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl, path })
}
