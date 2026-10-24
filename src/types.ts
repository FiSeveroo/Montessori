import type { Timestamp } from 'firebase/firestore'

export const TIPOS = ['Comprar', 'Fazer em casa', 'Ajuste da casa', 'Tarefa', 'Não comprar'] as const
export const FASES = ['Antes do nascimento', '0–3 meses', '3–6 meses', '6–12 meses', '12+ meses'] as const
export const PRIORIDADES = ['Essencial', 'Recomendado', 'Opcional'] as const
export const FAIXAS = ['$', '$$', '$$$', '—'] as const
export const STATUS = ['Pendente', 'Em andamento', 'Feito', 'Decidido'] as const

export const NAO_COMPRAR = 'Não comprar'

export const FAIXA_DESCRICAO: Record<string, string> = {
  $: 'até ~R$100',
  $$: '~R$100–500',
  $$$: 'acima de ~R$500',
  '—': 'sem custo',
}

export type Tipo = (typeof TIPOS)[number]
export type Status = (typeof STATUS)[number]

export interface LinkCompra {
  url: string
  loja: string
  preco: number | null
}

export interface Item {
  id: string
  numero: number | null
  nome: string
  categoria: string
  tipo: Tipo
  fase: string
  prioridade: string
  faixa_investimento: string
  quantidade: string
  fonte: string
  nota: string
  preco_estimado: number | null
  preco_pago: number | null
  links: LinkCompra[]
  status: Status
  // categoria de origem, para restaurar quando um item volta do "Não comprar"
  categoria_anterior?: string | null
  feito_por?: string | null
  feito_em?: Timestamp | null
  atualizado_por?: string | null
  atualizado_em?: Timestamp | null
  criado_em?: Timestamp | null
}

export type ItemDados = Omit<Item, 'id'>

export interface Categoria {
  id: string
  nome: string
  ordem: number
}
