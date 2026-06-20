import type { CheckoutProvider, CheckoutSession } from '../types'

/**
 * Stub provider para desenvolvimento.
 * Substitua por stripe.ts, mercadopago.ts etc. conforme necessário,
 * e configure CHECKOUT_PROVIDER=stripe (ou o nome do provider) nas envs.
 */
export const stubProvider: CheckoutProvider = {
  async createCourseCheckout(): Promise<CheckoutSession> {
    return { url: '/checkout/sucesso?stub=1' }
  },
  async createPlanCheckout(): Promise<CheckoutSession> {
    return { url: '/checkout/sucesso?stub=1' }
  },
}
