import { FASES, NAO_COMPRAR, PRIORIDADES, type Item } from './types'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarBRL(v: number | null | undefined): string {
  return v == null ? '—' : brl.format(v)
}

/** Aceita "1.234,56", "1234,56", "1234.56", "R$ 89,90". Vazio → null. */
export function lerPreco(texto: string): number | null {
  let t = texto.replace(/[^\d.,]/g, '')
  if (!t) return null
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if (/\.\d{3}$/.test(t)) t = t.replace(/\./g, '')
  const n = Number(t)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

export function precoParaTexto(v: number | null | undefined): string {
  return v == null ? '' : v.toFixed(2).replace('.', ',')
}

export function ehAtivo(item: Item): boolean {
  return item.tipo !== NAO_COMPRAR
}

/** Menor preço entre os links, se houver. */
export function menorPrecoLink(item: Item): number | null {
  const precos = item.links.map((l) => l.preco).filter((p): p is number => p != null)
  return precos.length ? Math.min(...precos) : null
}

/** Estimativa usada nos totais: o campo de preço estimado ou, na falta dele, o link mais barato. */
export function precoEstimadoEfetivo(item: Item): number | null {
  return item.preco_estimado ?? menorPrecoLink(item)
}

/** Preço usado na ordenação: pago (se feito) > estimado > link mais barato. */
export function precoParaOrdenar(item: Item): number | null {
  return item.preco_pago ?? precoEstimadoEfetivo(item)
}

export function indice(lista: readonly string[], v: string): number {
  const i = lista.indexOf(v)
  return i === -1 ? lista.length : i
}

export const ordemFase = (v: string) => indice(FASES, v)
export const ordemPrioridade = (v: string) => indice(PRIORIDADES, v)

export function semAcento(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function lerLocal<T>(chave: string, padrao: T): T {
  try {
    const v = localStorage.getItem(chave)
    return v ? { ...padrao, ...JSON.parse(v) } : padrao
  } catch {
    return padrao
  }
}

export function salvarLocal(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    /* modo privado etc. */
  }
}

export function dataCurta(ts: { toDate(): Date } | null | undefined): string {
  if (!ts) return ''
  return ts.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
