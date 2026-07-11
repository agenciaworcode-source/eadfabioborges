/**
 * Provider PagarMe v5 (Core API)
 *
 * Abordagem: Order com payment_method='checkout' → URL de checkout hospedado pelo PagarMe.
 * Aceita: cartão de crédito (até 12x), boleto e PIX.
 *
 * API Base: https://api.pagar.me/core/v5
 * Auth: Basic auth com PAGARME_API_KEY como usuário, senha vazia → base64("key:")
 *
 * Envs necessárias:
 *   PAGARME_API_KEY         — chave secreta (sk_...)
 *   NEXT_PUBLIC_APP_URL     — URL pública da aplicação (para success/cancel URLs)
 */

import type {
  CheckoutProvider,
  CheckoutSession,
  CartCourseCheckoutItem,
  CreateCartCheckoutParams,
  CreateCourseCheckoutParams,
  CreatePlanCheckoutParams,
} from '../types'

const BASE_URL = 'https://api.pagar.me/core/v5'

/**
 * Valida coerência entre PAGARME_API_KEY e PAGARME_ENV.
 * Chaves de teste do PagarMe têm prefixo `sk_test_`; as de produção, `sk_` (live).
 * Um descasamento significa cobrar cartões reais em "sandbox" ou usar chave de
 * teste em produção — ambos perigosos. Loga erro alto, sem derrubar o checkout.
 */
function assertKeyEnvCoherence(key: string): void {
  const env = process.env.PAGARME_ENV ?? 'sandbox'
  const isTestKey = key.startsWith('sk_test_')

  if (env === 'production' && isTestKey) {
    console.error(
      '[pagarme] INCOERÊNCIA: PAGARME_ENV=production mas a chave é de TESTE (sk_test_). Pagamentos não serão reais.'
    )
  }
  if (env === 'sandbox' && !isTestKey) {
    console.error(
      '[pagarme] INCOERÊNCIA: PAGARME_ENV=sandbox mas a chave é de PRODUÇÃO (sk_). Cobranças serão REAIS.'
    )
  }
}

function getAuthHeader(): string {
  const key = process.env.PAGARME_API_KEY
  if (!key) throw new Error('[pagarme] PAGARME_API_KEY não configurada')
  assertKeyEnvCoherence(key)
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64')
}

function boletoExpiresAt(): string {
  const d = new Date()
  d.setDate(d.getDate() + 3) // 3 dias úteis
  return d.toISOString()
}

interface PagarmeOrderResponse {
  id: string
  status: string
  metadata: Record<string, string>
  checkouts?: Array<{ id: string; payment_url: string; status: string }>
}

async function createCheckoutOrder(params: {
  code: string
  customerName: string
  customerEmail: string
  description: string
  amountCents?: number
  items?: CartCourseCheckoutItem[]
  installments: number[]
  successUrl: string
  metadata: Record<string, string>
}): Promise<string> {
  const body = {
    code: params.code,
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      type: 'individual',
    },
    items: params.items
      ? params.items.map((item) => ({
          amount: item.priceAmountCents,
          description: item.courseTitle,
          quantity: 1,
        }))
      : [
          {
            amount: params.amountCents ?? 0,
            description: params.description,
            quantity: 1,
          },
        ],
    metadata: params.metadata,
    payments: [
      {
        payment_method: 'checkout',
        checkout: {
          expires_in: 1440, // 24h em minutos
          billing_address_editable: true,
          customer_editable: true,
          accepted_payment_methods: ['credit_card', 'boleto', 'pix'],
          success_url: params.successUrl,
          skip_checkout_success_page: false,
          boleto: {
            instructions: 'Pagar até a data de vencimento.',
            due_at: boletoExpiresAt(),
            statement_descriptor: 'FABIOBORGES',
          },
          pix: {
            expires_in: 3600, // 1h
          },
          credit_card: {
            capture: true,
            statement_descriptor: 'FABIOBORGES',
            installments: params.installments.map((n) => ({
              number: n,
              total: params.amountCents,
            })),
          },
        },
      },
    ],
  }

  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[pagarme] Erro ao criar order (${res.status}): ${text}`)
  }

  const data = (await res.json()) as PagarmeOrderResponse

  const paymentUrl = data.checkouts?.[0]?.payment_url
  if (!paymentUrl) {
    throw new Error(`[pagarme] Order criada (${data.id}) sem URL de checkout`)
  }

  return paymentUrl
}

/* ─── Transparent checkout (direct API, no redirect) ─── */

export interface BillingAddressInput {
  line1: string
  zipCode: string
  city: string
  state: string
}

export type TransparentPaymentInput =
  | {
      method: 'credit_card'
      cardNumber: string
      cardName: string
      expMonth: string
      expYear: string
      cvv: string
      installments: number
      billingAddress: BillingAddressInput
    }
  | { method: 'pix' }
  | { method: 'boleto'; customerDocument: string }

export type TransparentOrderResult =
  | { method: 'credit_card'; orderId: string; paid: boolean; failReason?: string }
  | { method: 'pix'; orderId: string; qrCode: string; qrCodeUrl: string }
  | { method: 'boleto'; orderId: string; url: string; line: string; dueAt: string }

interface PagarmeTransparentResponse {
  id: string
  status: string
  charges?: Array<{
    id: string
    status: string
    last_transaction?: {
      acquirer_message?: string
      qr_code?: string
      qr_code_url?: string
      url?: string
      line?: string
      due_at?: string
    }
  }>
}

export async function createPagarmeTransparentOrder(params: {
  code: string
  customerName: string
  customerEmail: string
  customerDocument?: string
  customerPhone?: string
  items: Array<{ amount: number; description: string; quantity: number; code?: string }>
  payment: TransparentPaymentInput
  metadata: Record<string, string>
}): Promise<TransparentOrderResult> {
  const customer: Record<string, unknown> = {
    name: params.customerName,
    email: params.customerEmail,
    type: 'individual',
  }

  // O gateway exige CPF do cliente em todos os métodos de pagamento
  const document =
    (params.payment.method === 'boleto' ? params.payment.customerDocument : undefined) ||
    params.customerDocument
  if (document) {
    customer.document = document
    customer.document_type = 'CPF'
  }

  // O gateway exige ao menos um telefone do cliente (dígitos: DDD + número)
  if (params.customerPhone) {
    const phone = params.customerPhone.replace(/\D/g, '')
    customer.phones = {
      mobile_phone: {
        country_code: '55',
        area_code: phone.slice(0, 2),
        number: phone.slice(2),
      },
    }
  }

  // Antifraude/validação da PagarMe exige o endereço de cobrança no nível da
  // order (não basta no token do cartão): sem `customer.address`, transações de
  // cartão originadas de certos IPs (ex.: datacenter da Vercel) são recusadas
  // com "validation_error | billing | value is required".
  if (params.payment.method === 'credit_card') {
    const b = params.payment.billingAddress
    customer.address = {
      line_1: b.line1,
      zip_code: b.zipCode.replace(/\D/g, ''),
      city: b.city,
      state: b.state.toUpperCase(),
      country: 'BR',
    }
  }

  let payments: Record<string, unknown>[]

  switch (params.payment.method) {
    case 'credit_card': {
      // Enviamos o cartão inline (com billing_address no próprio cartão da
      // order) em vez de tokenizar à parte: o antifraude/validação da PagarMe
      // exige o billing na transação, e o billing embutido no token NÃO era
      // propagado de forma confiável a partir de certos IPs (ex.: datacenter
      // da Vercel), causando "validation_error | billing | value is required".
      payments = [
        {
          payment_method: 'credit_card',
          credit_card: {
            installments: params.payment.installments,
            statement_descriptor: 'FABIOBORGES',
            card: {
              number: params.payment.cardNumber,
              holder_name: params.payment.cardName,
              exp_month: parseInt(params.payment.expMonth, 10),
              exp_year: parseInt(params.payment.expYear, 10),
              cvv: params.payment.cvv,
              billing_address: {
                line_1: params.payment.billingAddress.line1,
                zip_code: params.payment.billingAddress.zipCode.replace(/\D/g, ''),
                city: params.payment.billingAddress.city,
                state: params.payment.billingAddress.state.toUpperCase(),
                country: 'BR',
              },
            },
          },
        },
      ]
      break
    }

    case 'pix':
      payments = [
        {
          payment_method: 'pix',
          pix: { expires_in: 3600 },
        },
      ]
      break

    case 'boleto': {
      payments = [
        {
          payment_method: 'boleto',
          boleto: {
            instructions: 'Pagar até o vencimento.',
            due_at: boletoExpiresAt(),
            // PagarMe limita document_number a 16 caracteres
            document_number: `BOL${Date.now()}`,
          },
        },
      ]
      break
    }
  }

  const body = {
    code: params.code,
    customer,
    items: params.items,
    metadata: params.metadata,
    payments,
  }

  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[pagarme] Erro ao criar order transparente (${res.status}): ${text}`)
  }

  const data = (await res.json()) as PagarmeTransparentResponse
  const tx = data.charges?.[0]?.last_transaction

  switch (params.payment.method) {
    case 'credit_card':
      return {
        method: 'credit_card',
        orderId: data.id,
        paid: data.status === 'paid',
        failReason:
          data.status !== 'paid' ? (tx?.acquirer_message ?? 'Pagamento não aprovado') : undefined,
      }

    case 'pix':
      return {
        method: 'pix',
        orderId: data.id,
        qrCode: tx?.qr_code ?? '',
        qrCodeUrl: tx?.qr_code_url ?? '',
      }

    case 'boleto':
      return {
        method: 'boleto',
        orderId: data.id,
        url: tx?.url ?? '',
        line: tx?.line ?? '',
        dueAt: tx?.due_at ?? boletoExpiresAt(),
      }
  }
}

export const pagarmeProvider: CheckoutProvider = {
  async createCourseCheckout(params: CreateCourseCheckoutParams): Promise<CheckoutSession> {
    const url = await createCheckoutOrder({
      code: `CURSO-${params.courseId.substring(0, 8)}-${Date.now()}`,
      customerName: params.userEmail.split('@')[0],
      customerEmail: params.userEmail,
      description: params.courseTitle,
      amountCents: params.priceAmountCents,
      installments: [1, 2, 3, 6, 12],
      successUrl: params.successUrl,
      metadata: {
        type: 'course',
        courseId: params.courseId,
        userId: params.userId,
        userEmail: params.userEmail,
      },
    })

    return { url }
  },

  async createPlanCheckout(params: CreatePlanCheckoutParams): Promise<CheckoutSession> {
    // Mensal = 12 parcelas fixas (total = 12 × parcela)
    // Anual  = à vista (1x) com desconto de 17%
    const isMonthly = params.billingPeriod === 'monthly'
    const periodLabel = isMonthly ? '· 12x no cartão' : '· à vista (-17%)'
    const installments = isMonthly ? [12] : [1]

    const url = await createCheckoutOrder({
      code: `PLANO-${params.planId}-${Date.now()}`,
      customerName: params.userEmail.split('@')[0],
      customerEmail: params.userEmail,
      description: `Plano ${params.planName} ${periodLabel}`,
      amountCents: params.priceAmountCents,
      installments,
      successUrl: params.successUrl,
      metadata: {
        type: 'plan',
        planId: params.planId,
        billingPeriod: params.billingPeriod,
        userId: params.userId,
        userEmail: params.userEmail,
      },
    })

    return { url }
  },

  async createCartCheckout(params: CreateCartCheckoutParams): Promise<CheckoutSession> {
    const totalAmountCents = params.courses.reduce(
      (sum, course) => sum + course.priceAmountCents,
      0
    )

    const url = await createCheckoutOrder({
      code: `CARRINHO-${params.userId.substring(0, 8)}-${Date.now()}`,
      customerName: params.userEmail.split('@')[0],
      customerEmail: params.userEmail,
      description: `${params.courses.length} curso(s)`,
      items: params.courses,
      amountCents: totalAmountCents,
      installments: [1, 2, 3, 6, 12],
      successUrl: params.successUrl,
      metadata: {
        type: 'cart',
        courseIds: JSON.stringify(params.courses.map((course) => course.courseId)),
        userId: params.userId,
        userEmail: params.userEmail,
      },
    })

    return { url }
  },
}
