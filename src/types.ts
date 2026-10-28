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
  /** URL da imagem da loja ou data URL comprimido (ver comprimirImagem) */
  imagem?: string | null
  status: Status
  // categoria de origem, para restaurar quando um item volta do "Não comprar"
  categoria_anterior?: string | null
  // lista de presentes (página pública /presentes)
  na_lista?: boolean
  lista_multiplo?: boolean
  // quantas compras de convidados já foram refletidas no status deste item
  presentes_vistos?: number
  feito_por?: string | null
  feito_em?: Timestamp | null
  atualizado_por?: string | null
  atualizado_em?: Timestamp | null
  criado_em?: Timestamp | null
}

export type ItemDados = Omit<Item, 'id'>

export interface Compra {
  nome: string
  forma: 'link' | 'fora'
  mensagem: string
  quando: Timestamp
}

/** Cópia pública de um item, em /presentes/{itemId}. Só os donos editam; convidados só acrescentam compras. */
export interface Presente {
  id: string
  nome: string
  categoria: string
  ordem_categoria: number
  numero: number
  quantidade: string
  nota: string
  faixa: string
  imagem: string | null
  links: LinkCompra[]
  multiplo: boolean
  visivel: boolean
  compras: Compra[]
}

export interface ConfigLista {
  titulo: string
  mensagem: string
}

export interface Categoria {
  id: string
  nome: string
  ordem: number
}
