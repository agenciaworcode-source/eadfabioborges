import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { randomUUID } from 'crypto'

type SubmissionInsert = Database['public']['Tables']['submissions']['Insert']

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream', // alguns browsers enviam zip com este tipo
])

const MAX_SIZE_BYTES = 52_428_800 // 50 MB

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'FormData inválido' }, { status: 400 })
  }

  const assignmentId = formData.get('assignmentId')
  const file = formData.get('file')

  if (!assignmentId || typeof assignmentId !== 'string') {
    return NextResponse.json({ error: 'assignmentId obrigatório' }, { status: 400 })
  }

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
  }

  // Validar tipo
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de arquivo não permitido. Use PDF, imagem ou ZIP.' },
      { status: 400 }
    )
  }

  // Validar tamanho
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Arquivo muito grande (máx 50 MB)' },
      { status: 400 }
    )
  }

  // Verificar se assignment existe
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('id')
    .eq('id', assignmentId)
    .single()

  if (assignmentError || !assignment) {
    return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
  }

  // Verificar se já foi enviada (reenvio bloqueado)
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('assignment_id', assignmentId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Tarefa já enviada. Não é possível reenviar.' },
      { status: 409 }
    )
  }

  // Montar path isolado por usuário
  const fileName = file instanceof File ? file.name : 'arquivo'
  const submissionId = randomUUID()
  const storagePath = `${user.id}/${submissionId}/${fileName}`

  // Upload para Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('submissions')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: publicUrlData } = supabase.storage
    .from('submissions')
    .getPublicUrl(storagePath)

  const fileUrl = publicUrlData.publicUrl

  // Inserir submission
  const payload: SubmissionInsert = {
    id: submissionId,
    user_id: user.id,
    assignment_id: assignmentId,
    file_url: fileUrl,
  }

  const { error: insertError } = await supabase
    .from('submissions')
    .insert(payload as never)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ submissionId, fileUrl })
}
