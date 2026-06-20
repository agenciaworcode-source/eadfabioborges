export interface CheckoutSession {
  url: string
}

export interface CreateCourseCheckoutParams {
  courseId: string
  courseTitle: string
  userId: string
  userEmail: string
  priceAmountCents: number
  successUrl: string
  cancelUrl: string
}

export interface CreatePlanCheckoutParams {
  planId: string
  planName: string
  userId: string
  userEmail: string
  priceAmountCents: number
  billingPeriod: 'monthly' | 'annual'
  successUrl: string
  cancelUrl: string
}

export interface CheckoutProvider {
  createCourseCheckout(params: CreateCourseCheckoutParams): Promise<CheckoutSession>
  createPlanCheckout(params: CreatePlanCheckoutParams): Promise<CheckoutSession>
}
