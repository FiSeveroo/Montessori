import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Categoria, Compra, ConfigLista, Item, Presente } from '../types'

const presentesCol = collection(db, 'presentes')
const configRef = doc(db, 'config', 'lista')

export const CONFIG_PADRAO: ConfigLista = {
  titulo: 'Lista de presentes da nossa bebê',
  mensagem:
    'Obrigado por fazer parte deste momento! Aqui estão as coisas de que precisamos. Quando comprar algo, marque na lista para ninguém repetir.',
}

function normalizar(id: string, d: DocumentData): Presente {
  return {
    id,
    nome: d.nome ?? '',
    categoria: d.categoria ?? '',
    ordem_categoria: d.ordem_categoria ?? 999,
    numero: d.numero ?? 9999,
    quantidade: d.quantidade ?? '',
    nota: d.nota ?? '',
    faixa: d.faixa ?? '—',
    imagem: d.imagem ?? null,
    links: Array.isArray(d.links) ? d.links : [],
    multiplo: d.multiplo ?? false,
    visivel: d.visivel ?? false,
    compras: Array.isArray(d.compras) ? d.compras : [],
  }
}

/** Todos os presentes (donos) ou só os visíveis (página pública). */
export function usePresentes(soVisiveis: boolean) {
  const [presentes, setPresentes] = useState<Presente[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => {
    const q = soVisiveis ? query(presentesCol, where('visivel', '==', true)) : presentesCol
    return onSnapshot(
      q,
      (s) => setPresentes(s.docs.map((d) => normalizar(d.id, d.data()))),
      (e) => setErro(e.message),
    )
  }, [soVisiveis])
  return { presentes: presentes ?? [], carregando: presentes === null, erro }
}

export function useConfigLista() {
  const [config, setConfig] = useState<ConfigLista | null>(null)
  useEffect(
    () =>
      onSnapshot(
        configRef,
        (d) => setConfig({ ...CONFIG_PADRAO, ...(d.data() as Partial<ConfigLista> | undefined) }),
        () => setConfig(CONFIG_PADRAO),
      ),
    [],
  )
  return config
}

export async function salvarConfigLista(c: ConfigLista) {
  await setDoc(configRef, { titulo: c.titulo.trim(), mensagem: c.mensagem.trim() })
}

export const esgotado = (p: Presente) => !p.multiplo && p.compras.length > 0

/**
 * Convidado marca que comprou. Em transação: se outra pessoa marcou um item de compra única
 * segundos antes, falha com mensagem clara em vez de duplicar.
 */
export async function registrarCompra(id: string, compra: Omit<Compra, 'quando'>) {
  const ref = doc(db, 'presentes', id)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Este item não está mais na lista.')
    const p = normalizar(snap.id, snap.data())
    if (!p.visivel) throw new Error('Este item não está mais na lista.')
    if (esgotado(p)) throw new Error('Alguém acabou de marcar este item como comprado.')
    tx.update(ref, { compras: [...p.compras, { ...compra, quando: Timestamp.now() }] })
  })
}

/** Donos: desfaz uma marcação feita por engano. */
export async function removerCompra(p: Presente, indice: number) {
  await updateDoc(doc(db, 'presentes', p.id), { compras: p.compras.filter((_, i) => i !== indice) })
}

// ---------- Sincronização (roda no app dos donos) ----------

type Projecao = Omit<Presente, 'id' | 'compras'>

function projetar(item: Item, ordemCategoria: number): Projecao {
  return {
    nome: item.nome,
    categoria: item.categoria,
    ordem_categoria: ordemCategoria,
    numero: item.numero ?? 9999,
    quantidade: item.quantidade === '—' ? '' : item.quantidade,
    nota: item.nota,
    faixa: item.faixa_investimento,
    imagem: item.imagem ?? null,
    links: item.links,
    multiplo: item.lista_multiplo ?? false,
    visivel: true,
  }
}

// Comparação independente da ordem das chaves (o Firestore não garante a ordem dos campos de um map)
function estavel(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(estavel)
  if (v && typeof v === 'object')
    return Object.fromEntries(
      Object.keys(v)
        .sort()
        .map((k) => [k, estavel((v as Record<string, unknown>)[k])]),
    )
  return v
}
const igual = (a: unknown, b: unknown) => JSON.stringify(estavel(a)) === JSON.stringify(estavel(b))

/**
 * Mantém /presentes igual aos itens marcados "na lista" e traz as compras dos convidados de volta:
 * - item na lista → cria/atualiza a cópia pública (sem tocar nas compras);
 * - item fora da lista ou excluído → cópia fica invisível (as compras registradas ficam guardadas);
 * - nova compra de convidado num item de compra única → marca o item como Feito ("🎁 Nome").
 * Só escreve o que mudou, então pode rodar a cada atualização sem gerar laço.
 */
export async function sincronizarPresentes(itens: Item[], presentes: Presente[], categorias: Categoria[]) {
  const ordem = new Map(categorias.map((c) => [c.nome, c.ordem]))
  const porId = new Map(presentes.map((p) => [p.id, p]))
  const batch = writeBatch(db)
  let escritas = 0

  for (const item of itens) {
    const atual = porId.get(item.id)
    if (item.na_lista && item.tipo !== 'Não comprar') {
      const proj = projetar(item, ordem.get(item.categoria) ?? 999)
      if (!atual) {
        batch.set(doc(db, 'presentes', item.id), { ...proj, compras: [] })
        escritas++
      } else {
        const { id: _i, compras: _c, ...existente } = atual
        if (!igual(existente, proj)) {
          batch.set(doc(db, 'presentes', item.id), proj, { merge: true })
          escritas++
        }
      }
    } else if (atual?.visivel) {
      batch.update(doc(db, 'presentes', item.id), { visivel: false })
      escritas++
    }

    // compras novas → status do item
    const n = atual?.compras.length ?? 0
    if (atual && n > (item.presentes_vistos ?? 0)) {
      const ultima = atual.compras[n - 1]
      const marcarFeito = !atual.multiplo && item.status !== 'Feito'
      batch.update(doc(db, 'itens', item.id), {
        presentes_vistos: n,
        ...(marcarFeito
          ? { status: 'Feito', feito_por: `🎁 ${ultima.nome}`, feito_em: serverTimestamp(), atualizado_por: `🎁 ${ultima.nome}`, atualizado_em: serverTimestamp() }
          : {}),
      })
      escritas++
    } else if (atual && n < (item.presentes_vistos ?? 0)) {
      // uma marcação foi desfeita pelos donos
      batch.update(doc(db, 'itens', item.id), { presentes_vistos: n })
      escritas++
    }
  }

  // presentes cujo item foi excluído
  const ids = new Set(itens.map((i) => i.id))
  for (const p of presentes) {
    if (!ids.has(p.id) && p.visivel) {
      batch.update(doc(db, 'presentes', p.id), { visivel: false })
      escritas++
    }
  }

  if (escritas > 0) await batch.commit()
}
