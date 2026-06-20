import Stripe from 'stripe'
import type {
  CheckoutProvider,
  CheckoutSession,
  CreateCourseCheckoutParams,
  CreatePlanCheckoutParams,
} from '../types'

// Inicialização lazy: Stripe SDK só instanciado quando o método for chamado.
// Garante que importar este módulo sem STRIPE_SECRET_KEY não quebra o build.
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY não configurada')
  return new Stripe(key, { apiVersion: '2026-05-27.dahlia' })
}

export const stripeProvider: CheckoutProvider = {
  async createCourseCheckout(
    params: CreateCourseCheckoutParams,
  ): Promise<CheckoutSession> {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: params.userEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: params.priceAmountCents,
            product_data: { name: params.courseTitle },
          },
        },
      ],
      metadata: {
        type: 'course',
        courseId: params.courseId,
        userId: params.userId,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    })
    return { url: session.url! }
  },

  async createPlanCheckout(
    params: CreatePlanCheckoutParams,
  ): Promise<CheckoutSession> {
    const envKey =
      params.billingPeriod === 'annual'
        ? `STRIPE_PRICE_${params.planId.toUpperCase()}_ANNUAL`
        : `STRIPE_PRICE_${params.planId.toUpperCase()}_MONTHLY`

    const priceId = process.env[envKey]
    if (!priceId) {
      throw new Error(
        `Stripe Price ID não configurado para ${envKey}. Configure a variável de ambiente.`,
      )
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer_email: params.userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        type: 'plan',
        planId: params.planId,
        userId: params.userId,
        billingPeriod: params.billingPeriod,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    })
    return { url: session.url! }
  },
}
