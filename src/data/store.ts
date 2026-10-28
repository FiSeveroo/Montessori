import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import { NAO_COMPRAR, type Categoria, type Item, type ItemDados, type Status } from '../types'
import seed from './seed.json'

const itensCol = collection(db, 'itens')
const categoriasCol = collection(db, 'categorias')

function quem(): string {
  const u = auth.currentUser
  return u?.displayName?.split(' ')[0] || u?.email || 'alguém'
}

function normalizarItem(id: string, d: DocumentData): Item {
  return {
    id,
    numero: d.numero ?? null,
    nome: d.nome ?? '',
    categoria: d.categoria ?? '',
    tipo: d.tipo ?? 'Comprar',
    fase: d.fase ?? '—',
    prioridade: d.prioridade ?? '—',
    faixa_investimento: d.faixa_investimento ?? '—',
    quantidade: d.quantidade ?? '',
    fonte: d.fonte ?? '',
    nota: d.nota ?? '',
    preco_estimado: d.preco_estimado ?? null,
    preco_pago: d.preco_pago ?? null,
    links: Array.isArray(d.links) ? d.links : [],
    imagem: d.imagem ?? null,
    status: d.status ?? 'Pendente',
    categoria_anterior: d.categoria_anterior ?? null,
    na_lista: d.na_lista ?? false,
    lista_multiplo: d.lista_multiplo ?? false,
    presentes_vistos: d.presentes_vistos ?? 0,
    feito_por: d.feito_por ?? null,
    feito_em: d.feito_em ?? null,
    atualizado_por: d.atualizado_por ?? null,
    atualizado_em: d.atualizado_em ?? null,
    criado_em: d.criado_em ?? null,
  }
}

export interface Dados {
  itens: Item[]
  categorias: Categoria[]
  carregando: boolean
  erro: string | null
}

export function useDados(): Dados {
  const [itens, setItens] = useState<Item[] | null>(null)
  const [categorias, setCategorias] = useState<Categoria[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const onErr = (e: Error) => setErro(e.message)
    const u1 = onSnapshot(itensCol, (s) => setItens(s.docs.map((d) => normalizarItem(d.id, d.data()))), onErr)
    const u2 = onSnapshot(
      categoriasCol,
      (s) =>
        setCategorias(
          s.docs
            .map((d) => ({ id: d.id, nome: d.data().nome as string, ordem: d.data().ordem as number }))
            .sort((a, b) => a.ordem - b.ordem),
        ),
      onErr,
    )
    return () => {
      u1()
      u2()
    }
  }, [])

  return {
    itens: itens ?? [],
    categorias: categorias ?? [],
    carregando: itens === null || categorias === null,
    erro,
  }
}

// ---------- Itens ----------

function camposDeStatus(status: Status): Record<string, unknown> {
  return status === 'Feito'
    ? { feito_por: quem(), feito_em: serverTimestamp() }
    : { feito_por: null, feito_em: null }
}

export async function mudarStatus(item: Item, status: Status) {
  await updateDoc(doc(db, 'itens', item.id), {
    status,
    ...camposDeStatus(status),
    atualizado_por: quem(),
    atualizado_em: serverTimestamp(),
  })
}

export async function atualizarItem(id: string, dados: Partial<ItemDados>, statusAnterior?: Status) {
  const extra = dados.status && dados.status !== statusAnterior ? camposDeStatus(dados.status) : {}
  // campos de auditoria nunca vêm do formulário
  const { feito_em: _a, feito_por: _b, atualizado_em: _c, criado_em: _d, ...resto } = dados
  await updateDoc(doc(db, 'itens', id), {
    ...resto,
    ...extra,
    atualizado_por: quem(),
    atualizado_em: serverTimestamp(),
  })
}

export async function criarItem(dados: ItemDados) {
  const { feito_em: _a, feito_por: _b, atualizado_em: _c, criado_em: _d, ...resto } = dados
  const ref = await addDoc(itensCol, {
    ...resto,
    ...camposDeStatus(dados.status),
    criado_em: serverTimestamp(),
    atualizado_por: quem(),
    atualizado_em: serverTimestamp(),
  })
  return ref.id
}

/** Cria vários itens de uma vez (Firestore aceita até 500 escritas por batch). */
export async function criarItens(lista: ItemDados[]) {
  for (let i = 0; i < lista.length; i += 400) {
    const batch = writeBatch(db)
    for (const dados of lista.slice(i, i + 400)) {
      const { feito_em: _a, feito_por: _b, atualizado_em: _c, criado_em: _d, ...resto } = dados
      batch.set(doc(itensCol), {
        ...resto,
        ...camposDeStatus(dados.status),
        criado_em: serverTimestamp(),
        atualizado_por: quem(),
        atualizado_em: serverTimestamp(),
      })
    }
    await batch.commit()
  }
}

export async function excluirItem(id: string) {
  await deleteDoc(doc(db, 'itens', id))
}

export async function moverParaNaoComprar(item: Item) {
  await atualizarItem(item.id, {
    categoria_anterior: item.categoria !== NAO_COMPRAR ? item.categoria : item.categoria_anterior ?? null,
    categoria: NAO_COMPRAR,
    tipo: 'Não comprar',
    status: 'Decidido',
  }, item.status)
}

export async function moverParaListaAtiva(
  item: Item,
  destino: { categoria: string; tipo: Item['tipo']; fase: string; prioridade: string },
) {
  await atualizarItem(
    item.id,
    {
      ...destino,
      status: 'Pendente',
      categoria_anterior: null,
      faixa_investimento: item.faixa_investimento === '—' && destino.tipo === 'Comprar' ? '$' : item.faixa_investimento,
    },
    item.status,
  )
}

// ---------- Categorias ----------

export async function criarCategoria(nome: string, ordem: number) {
  await addDoc(categoriasCol, { nome: nome.trim(), ordem })
}

/** Renomeia a categoria e atualiza todos os itens que a usam. */
export async function renomearCategoria(cat: Categoria, novoNome: string, itens: Item[]) {
  const nome = novoNome.trim()
  const batch = writeBatch(db)
  batch.update(doc(db, 'categorias', cat.id), { nome })
  for (const it of itens) {
    if (it.categoria === cat.nome) batch.update(doc(db, 'itens', it.id), { categoria: nome })
    if (it.categoria_anterior === cat.nome) batch.update(doc(db, 'itens', it.id), { categoria_anterior: nome })
  }
  await batch.commit()
}

export async function reordenarCategorias(cats: Categoria[]) {
  const batch = writeBatch(db)
  cats.forEach((c, i) => batch.update(doc(db, 'categorias', c.id), { ordem: i }))
  await batch.commit()
}

export async function excluirCategoria(cat: Categoria) {
  await deleteDoc(doc(db, 'categorias', cat.id))
}

// ---------- Carga inicial ----------

type SeedItem = (typeof seed)[number]

export async function carregarSeed() {
  const nomesCategorias: string[] = []
  for (const s of seed as SeedItem[]) if (!nomesCategorias.includes(s.categoria)) nomesCategorias.push(s.categoria)

  // Firestore limita 500 escritas por batch; 100 itens + 12 categorias cabem em um só.
  const batch = writeBatch(db)
  nomesCategorias.forEach((nome, ordem) => batch.set(doc(categoriasCol), { nome, ordem }))
  for (const s of seed as SeedItem[]) {
    batch.set(doc(db, 'itens', String(s.id).padStart(3, '0')), {
      numero: s.id,
      nome: s.nome,
      categoria: s.categoria,
      tipo: s.tipo,
      fase: s.fase,
      prioridade: s.prioridade,
      faixa_investimento: s.faixa_investimento,
      quantidade: s.quantidade,
      fonte: s.fonte,
      nota: s.nota,
      preco_estimado: s.preco_estimado,
      preco_pago: null,
      links: s.links,
      status: s.status,
      categoria_anterior: null,
      feito_por: null,
      feito_em: null,
      criado_em: serverTimestamp(),
      atualizado_por: quem(),
      atualizado_em: serverTimestamp(),
    })
  }
  await batch.commit()
}
