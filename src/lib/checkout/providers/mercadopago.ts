import { MercadoPagoConfig, Preference } from 'mercadopago'
import type {
  CheckoutProvider,
  CheckoutSession,
  CreateCourseCheckoutParams,
  CreatePlanCheckoutParams,
} from '../types'

// Inicialização lazy: MP SDK só instanciado quando o método for chamado.
function getMpClient(): MercadoPagoConfig {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
  return new MercadoPagoConfig({ accessToken: token })
}

export const mercadoPagoProvider: CheckoutProvider = {
  async createCourseCheckout(
    params: CreateCourseCheckoutParams,
  ): Promise<CheckoutSession> {
    const preference = new Preference(getMpClient())
    const result = await preference.create({
      body: {
        items: [
          {
            id: params.courseId,
            title: params.courseTitle,
            quantity: 1,
            unit_price: params.priceAmountCents / 100,
            currency_id: 'BRL',
          },
        ],
        payer: { email: params.userEmail },
        external_reference: `course:${params.courseId}:${params.userId}`,
        redirect_urls: {
          success: params.successUrl,
          failure: params.cancelUrl,
          pending: params.successUrl,
        },
      },
    })
    return { url: result.init_point! }
  },

  async createPlanCheckout(
    params: CreatePlanCheckoutParams,
  ): Promise<CheckoutSession> {
    // MercadoPago não tem subscription nativa — pagamento único pelo valor do período
    const unitPrice =
      params.billingPeriod === 'annual'
        ? (params.priceAmountCents * 12) / 100
        : params.priceAmountCents / 100

    const periodLabel = params.billingPeriod === 'annual' ? 'Anual' : 'Mensal'

    const preference = new Preference(getMpClient())
    const result = await preference.create({
      body: {
        items: [
          {
            id: params.planId,
            title: `${params.planId} (${periodLabel})`,
            quantity: 1,
            unit_price: unitPrice,
            currency_id: 'BRL',
          },
        ],
        payer: { email: params.userEmail },
        external_reference: `plan:${params.planId}:${params.userId}:${params.billingPeriod}`,
        redirect_urls: {
          success: params.successUrl,
          failure: params.cancelUrl,
          pending: params.successUrl,
        },
      },
    })
    return { url: result.init_point! }
  },
}
