# 4. Data Models — TypeScript Interfaces

## 4.1 User

**Propósito:** Perfil do aluno/admin na plataforma

```typescript
// src/types/database.ts (gerado via: supabase gen types typescript)
export interface User {
  id: string // UUID (Supabase Auth UID)
  email: string
  name: string
  role: 'student' | 'admin'
  plan: 'free' | 'prata' | 'ouro' | 'diamante' | 'macroempresa' | null
  avatar_url: string | null
  city: string | null
  specialty: string | null
  created_at: string // ISO timestamp
}
```

**Relacionamentos:** 1:N com enrollments, subscriptions, lesson_progress, quiz_attempts, submissions, certificates

---

## 4.2 Course + Module + Lesson

```typescript
export interface Course {
  id: string
  slug: string // URL-friendly: 'imersao-radiofrequencia'
  title: string
  description: string
  price: number | null // null = VIP only
  is_vip: boolean
  thumbnail_url: string | null
  published: boolean
  created_at: string
}

export interface Module {
  id: string
  course_id: string
  title: string
  order: number
  is_free_preview: boolean
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  vimeo_id: string
  duration_secs: number
  order: number
  attachments: { name: string; url: string }[] | null // JSONB
}
```

---

## 4.3 Enrollment + Subscription

```typescript
export type EnrollmentStatus = 'active' | 'completed' | 'refunded'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid'
export type PlanType = 'prata' | 'ouro' | 'diamante' | 'macroempresa'

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  status: EnrollmentStatus
  enrolled_at: string
  completed_at: string | null
}

export interface Subscription {
  id: string
  user_id: string
  plan: PlanType
  status: SubscriptionStatus
  stripe_sub_id: string
  stripe_customer_id: string
  period_start: string
  period_end: string
  grace_period_end: string | null // 3 dias após falha de pagamento
}
```

---

## 4.4 Progress + Quiz + Certificate

```typescript
export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  watched_secs: number
  updated_at: string
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score: number // 0-100
  answers: Record<string, string> // JSONB: { question_id: answer }
  passed: boolean
  created_at: string
}

export interface Certificate {
  id: string // UUID que vai no QR Code
  user_id: string
  course_id: string
  issued_at: string
  pdf_url: string // Supabase Storage public URL
  verified: boolean
}
```

---
