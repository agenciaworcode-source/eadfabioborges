import type { CheckoutProvider } from './types'
import { stubProvider } from './providers/stub'
import { stripeProvider } from './providers/stripe'
import { mercadoPagoProvider } from './providers/mercadopago'
import { pagarmeProvider } from './providers/pagarme'

/**
 * Retorna o provider de checkout configurado via env CHECKOUT_PROVIDER.
 *
 * Para adicionar um novo gateway:
 * 1. Crie `src/lib/checkout/providers/{nome}.ts` implementando CheckoutProvider
 * 2. Adicione o case abaixo
 * 3. Configure CHECKOUT_PROVIDER={nome} nas envs
 * Zero mudança no restante da plataforma.
 */
export function getCheckoutProvider(): CheckoutProvider {
  const provider = process.env.CHECKOUT_PROVIDER ?? 'stub'

  switch (provider) {
    case 'stub':
      return stubProvider
    case 'stripe':
      return stripeProvider
    case 'mercadopago':
      return mercadoPagoProvider
    case 'pagarme':
      return pagarmeProvider
    // case 'hotmart':
    //   return hotmartProvider // import from './providers/hotmart'
    default:
      console.warn(`[checkout] Unknown CHECKOUT_PROVIDER "${provider}" — falling back to stub`)
      return stubProvider
  }
}
