import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET = 'course-thumbnails'

function extFromType(type: string): string {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profileData as { role: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
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

  const bytes = await file.arrayBuffer()
  const buffer = new Uint8Array(bytes)
  const ext = extFromType(file.type)
  const path = `${params.id}/thumbnail.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  // Adiciona cache-buster para forçar o browser a recarregar a imagem
  const baseUrl = urlData.publicUrl
  const thumbnailUrl = `${baseUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('courses')
    .update({ thumbnail_url: thumbnailUrl } as never)
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ thumbnailUrl })
}
