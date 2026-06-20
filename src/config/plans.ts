export type PlanId = 'free' | 'prata' | 'ouro' | 'diamante' | 'macroempresa'

export interface PlanMeta {
  id: PlanId
  name: string
  badge: string
  audience: string
  description: string
  features: string[]
  billingOptions: ('monthly' | 'annual')[]
  hierarchyLevel: number
  isFeatured?: boolean
  isCustomPricing?: boolean
}

export const PLANS: PlanMeta[] = [
  {
    id: 'free',
    name: 'Free',
    badge: '',
    audience: 'Visitantes',
    description: 'Acesso a conteúdos gratuitos e prévia de cursos.',
    features: ['Acesso a cursos gratuitos', 'Prévia de módulos pagos'],
    billingOptions: [],
    hierarchyLevel: 0,
  },
  {
    id: 'prata',
    name: 'Prata',
    badge: 'plan-prata',
    audience: 'Iniciantes',
    description:
      'O ponto de partida ideal para quem quer dominar estética avançada com apoio do mentor.',
    features: [
      'Acesso a todos os cursos pagos da plataforma',
      'Videoconferência mensal em grupo com Fábio Borges',
      'Certificado digital em cada trilha concluída',
      'Materiais e protocolos para download',
      'Acesso à comunidade de alunas',
    ],
    billingOptions: ['monthly', 'annual'],
    hierarchyLevel: 1,
  },
  {
    id: 'ouro',
    name: 'Ouro',
    badge: 'plan-ouro',
    audience: 'Profissionais',
    description:
      'Para quem já atua na área e quer elevar o nível da clínica com suporte direto do mentor.',
    features: [
      'Tudo do Prata',
      'Atendimento por telefone com o mentor',
      'Reunião particular mensal (1h)',
      'Acesso antecipado a novos cursos',
      'Badge verificável de mentoriada Ouro',
    ],
    billingOptions: ['monthly', 'annual'],
    hierarchyLevel: 2,
    isFeatured: true,
  },
  {
    id: 'diamante',
    name: 'Diamante',
    badge: 'plan-diamante',
    audience: 'Clínicas',
    description:
      'Presença do mentor dentro da sua clínica — treinamento de equipe e visita presencial.',
    features: [
      'Tudo do Ouro',
      'Treinamento particular para a sua equipe',
      'Visita presencial à clínica (1x/ano)',
      'Suporte prioritário 24h',
      'Co-branded nos materiais da clínica',
    ],
    billingOptions: ['monthly', 'annual'],
    hierarchyLevel: 3,
  },
  {
    id: 'macroempresa',
    name: 'Macroempresa',
    badge: 'plan-diamante',
    audience: 'Indústrias / Franquias',
    description:
      'Parceria estratégica para redes de clínicas, franquias e indústrias do setor estético.',
    features: [
      'Tudo do Diamante',
      'Uso de imagem e marca do Fábio Borges',
      'Palestras corporativas para a rede',
      'Treinamento de múltiplas equipes',
      'Contrato personalizado por demanda',
    ],
    billingOptions: ['annual'],
    hierarchyLevel: 4,
    isCustomPricing: true,
  },
]

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, PlanMeta>

export const PLAN_LABELS: Record<string, string> = Object.fromEntries(
  PLANS.map((p) => [p.id, p.name])
)

export const PLAN_COLORS: Record<string, string> = {
  free: 'var(--faint)',
  prata: '#9aa3ad',
  ouro: '#d4a017',
  diamante: '#5e72e4',
  macroempresa: '#5e72e4',
}

/** Verifica se o nível do plano do usuário cobre o conteúdo de um plano requerido */
export function hasAccessToContent(userPlan: string, requiredPlan: string): boolean {
  const userLevel = PLAN_MAP[userPlan as PlanId]?.hierarchyLevel ?? 0
  const requiredLevel = PLAN_MAP[requiredPlan as PlanId]?.hierarchyLevel ?? 0
  return userLevel >= requiredLevel
}

/** Formata centavos BRL → string de exibição (ex: 9700 → "R$ 97") */
export function formatPlanPrice(cents: number): string {
  if (cents === 0) return 'Sob consulta'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}
