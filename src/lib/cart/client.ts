export type CartItem =
  | { type: 'course'; courseId: string; courseSlug?: string }
  | { type: 'plan'; planId: string; billingPeriod: 'monthly' | 'annual' }

const CART_KEY = 'ead-fabioborges-cart'

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart:updated'))
}

export function clearCart() {
  writeCart([])
}

export function addCourseToCart(input: { courseId: string; courseSlug?: string }) {
  const current = readCart().filter((item) => item.type !== 'plan')
  const exists = current.some((item) => item.type === 'course' && item.courseId === input.courseId)

  if (exists) {
    writeCart(current)
    return
  }

  writeCart([
    ...current,
    { type: 'course', courseId: input.courseId, courseSlug: input.courseSlug },
  ])
}

export function setPlanCart(input: { planId: string; billingPeriod: 'monthly' | 'annual' }) {
  writeCart([{ type: 'plan', ...input }])
}
