# 18. Error Handling

## 18.1 Formato de Erro Padrão

```typescript
interface ApiError {
  error: {
    code: string // Ex: 'UNAUTHORIZED', 'COURSE_NOT_FOUND'
    message: string // Mensagem human-readable em PT-BR
    details?: unknown // Zod errors ou detalhes técnicos (dev only)
    timestamp: string
  }
}
```

## 18.2 Handler de Erro Frontend

```typescript
// lib/api-client.ts
export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new ApiError(error.error.code, error.error.message)
  }
  return res.json()
}

// Uso com TanStack Query
const mutation = useMutation({
  mutationFn: (courseId: string) => apiPost('/api/checkout/curso', { courseId }),
  onError: (error: ApiError) => toast.error(error.message),
})
```

---
