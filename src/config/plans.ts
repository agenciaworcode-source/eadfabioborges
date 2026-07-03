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
    audience: 'Estudantes e iniciantes na área da estética',
    description:
      'O ponto de partida ideal para quem quer dominar a eletrotermoterapia aplicada à estética com base científica.',
    features: [
      'Plataforma com videoconferências, vídeoaulas e palestras online',
      'Material complementar digital (apostilas, artigos científicos e livros)',
      'Acesso a todos os cursos da plataforma',
      'Certificado digital em cada trilha concluída',
    ],
    billingOptions: ['monthly', 'annual'],
    hierarchyLevel: 1,
  },
  {
    id: 'ouro',
    name: 'Ouro',
    badge: 'plan-ouro',
    audience: 'Profissionais liberais e professores de estética',
    description:
      'Para quem já atua na área e quer elevar o nível com suporte direto do mentor em dias e horários comerciais.',
    features: [
      'Tudo do Prata',
      'Telefone exclusivo do mentor (ligação e videochamada em horário comercial)',
      'E-mail exclusivo para dúvidas, orientações e material de estudo',
    ],
    billingOptions: ['monthly', 'annual'],
    hierarchyLevel: 2,
    isFeatured: true,
  },
  {
    id: 'diamante',
    name: 'Diamante',
    badge: 'plan-diamante',
    audience: 'Microempreendedores — clínicas e consultórios',
    description:
      'Presença do mentor dentro da sua clínica: planejamento de arsenal, treinamento de equipe e visita presencial.',
    features: [
      'Tudo do Ouro',
      'Reunião particular online a cada 60 dias (planejamento de clínica, até 60 min)',
      'Treinamento online particular para equipamentos a cada 60 dias (até 60 min)',
      'Possibilidade de visita física ao local de trabalho (sujeito a disponibilidade)',
      'Uso do Selo "MENTORIA FÁBIO BORGES" nos materiais da clínica',
    ],
    billingOptions: ['monthly', 'annual'],
    hierarchyLevel: 3,
  },
  {
    id: 'macroempresa',
    name: 'Macroempresa',
    badge: 'plan-diamante',
    audience: 'Grandes empresas do setor estético',
    description:
      'Parceria estratégica para redes, franquias e indústrias de equipamentos eletrotermoterapêuticos.',
    features: [
      'Tudo do Diamante',
      '6 reuniões anuais online (equipamentos, cosméticos, pesquisa — até 90 min cada)',
      '6 treinamentos online anuais para uso de equipamentos (até 90 min cada)',
      '2 visitas físicas gratuitas de 4h ou 1 de 8h por ano',
      '2 palestras em congressos/eventos por ano (até 1h cada)',
      'Uso do nome e imagem do mentor em material publicitário da empresa',
    ],
    billingOptions: ['monthly', 'annual'],
    hierarchyLevel: 4,
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

/** Formata centavos BRL → string de exibição (ex: 12500 → "R$ 125") */
export function formatPlanPrice(cents: number): string {
  if (cents === 0) return 'Sob consulta'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}
