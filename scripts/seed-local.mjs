/**
 * Seed local para testes — cria curso, módulo, lições, plano e matrícula
 * Uso: node scripts/seed-local.mjs
 */

const BASE = 'http://127.0.0.1:54321/rest/v1'
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const ADMIN_ID = '21afa5e1-8b36-4e99-8406-aa2c1938559c'
const ALUNO_ID = '046d6796-cd36-47a5-825f-6c8789514f0b'

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation,resolution=merge-duplicates',
}

async function upsert(table, data) {
  const res = await fetch(`${BASE}/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) {
    console.error(`❌ ${table}:`, json)
    return null
  }
  const row = Array.isArray(json) ? json[0] : json
  console.log(`✅ ${table}: ${row?.id || JSON.stringify(row).slice(0, 80)}`)
  return row
}

async function patch(table, filter, data) {
  const res = await fetch(`${BASE}/${table}?${filter}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) {
    console.error(`❌ PATCH ${table}:`, json)
    return null
  }
  const row = Array.isArray(json) ? json[0] : json
  console.log(`✅ PATCH ${table}: ok`)
  return row
}

// ─── Cursos ────────────────────────────────────────────────────────────────

const course1 = await upsert('courses', {
  id: 'aaaaaaaa-0001-0001-0001-000000000001',
  slug: 'estetica-facial-avancada',
  title: 'Estética Facial Avançada',
  description: 'Curso completo de estética facial com técnicas avançadas para profissionais.',
  price: 297.0,
  is_vip: false,
  published: true,
})

const course2 = await upsert('courses', {
  id: 'aaaaaaaa-0002-0002-0002-000000000002',
  slug: 'massoterapia-profissional',
  title: 'Massoterapia Profissional',
  description: 'Técnicas avançadas de massoterapia para clínicas de estética.',
  price: 197.0,
  is_vip: true,
  published: true,
})

// ─── Módulos ───────────────────────────────────────────────────────────────

const mod1 = await upsert('modules', {
  id: 'bbbbbbbb-0001-0001-0001-000000000001',
  course_id: course1.id,
  title: 'Fundamentos da Estética Facial',
  order: 1,
  is_free_preview: true,
})

const mod2 = await upsert('modules', {
  id: 'bbbbbbbb-0002-0002-0002-000000000002',
  course_id: course1.id,
  title: 'Técnicas Avançadas',
  order: 2,
  is_free_preview: false,
})

// ─── Lições ────────────────────────────────────────────────────────────────

await upsert('lessons', {
  id: 'cccccccc-0001-0001-0001-000000000001',
  module_id: mod1.id,
  title: 'Introdução ao Curso',
  vimeo_id: '123456789',
  duration_secs: 420,
  order: 1,
  attachments: [],
})

await upsert('lessons', {
  id: 'cccccccc-0002-0002-0002-000000000002',
  module_id: mod1.id,
  title: 'Anatomia da Face',
  vimeo_id: '987654321',
  duration_secs: 1800,
  order: 2,
  attachments: [],
})

await upsert('lessons', {
  id: 'cccccccc-0003-0003-0003-000000000003',
  module_id: mod2.id,
  title: 'Peeling Químico Profundo',
  vimeo_id: '111222333',
  duration_secs: 3600,
  order: 1,
  attachments: [],
})

// ─── Planos ────────────────────────────────────────────────────────────────

// Planos já existem via migration — só verifica
const planosRes = await fetch(`${BASE}/plans?select=id,name,price_monthly`, {
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
})
const planos = await planosRes.json()
console.log('✅ plans (já inseridos via migration):', planos.map((p) => p.id).join(', '))

// ─── Matrícula do aluno no curso 1 ────────────────────────────────────────

await upsert('enrollments', {
  id: 'dddddddd-0001-0001-0001-000000000001',
  user_id: ALUNO_ID,
  course_id: course1.id,
  status: 'active',
  enrolled_at: new Date().toISOString(),
})

console.log('\n🎉 Seed concluído!')
console.log('─────────────────────────────────────────')
console.log('Admin: admin@test.com / Admin@12345')
console.log('Aluno: aluno@test.com / Aluno@12345')
console.log('Curso: /cursos/estetica-facial-avancada')
console.log('Admin: http://localhost:3000/admin')
console.log('Studio: http://127.0.0.1:54323')
