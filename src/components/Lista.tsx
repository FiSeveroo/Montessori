import { useMemo, useState } from 'react'
import {
  ehAtivo,
  lerLocal,
  ordemFase,
  ordemPrioridade,
  precoParaOrdenar,
  salvarLocal,
  semAcento,
} from '../lib'
import { FAIXA_DESCRICAO, FAIXAS, FASES, PRIORIDADES, TIPOS, type Categoria, type Item } from '../types'
import ItemCard from './ItemCard'
import { Chip, IconBusca, IconFiltro, IconX, Sheet } from './ui'

export type Ordem = 'categoria' | 'preco_asc' | 'preco_desc' | 'prioridade' | 'fase'

const ORDENS: { v: Ordem; rotulo: string }[] = [
  { v: 'categoria', rotulo: 'Categoria' },
  { v: 'prioridade', rotulo: 'Prioridade' },
  { v: 'fase', rotulo: 'Fase' },
  { v: 'preco_asc', rotulo: 'Preço ↑' },
  { v: 'preco_desc', rotulo: 'Preço ↓' },
]

const ordemFaixa = (i: Item) => ({ $: 1, $$: 2, $$$: 3 })[i.faixa_investimento as '$'] ?? 0

const STATUS_ATIVOS =['Pendente', 'Em andamento', 'Feito'] as const
const TIPOS_ATIVOS = TIPOS.filter((t) => t !== 'Não comprar')

interface Filtros {
  categorias: string[]
  tipos: string[]
  status: string[]
  faixas: string[]
  fases: string[]
  prioridades: string[]
  ordem: Ordem
}

const VAZIO: Filtros = {
  categorias: [],
  tipos: [],
  status: [],
  faixas: [],
  fases: [],
  prioridades: [],
  ordem: 'categoria',
}

const CHAVE = 'enxoval.filtros'

type Dimensao = Exclude<keyof Filtros, 'ordem'>

export default function Lista({
  itens,
  categorias,
  aoAbrir,
  aoMarcar,
}: {
  itens: Item[]
  categorias: Categoria[]
  aoAbrir: (i: Item) => void
  aoMarcar: (i: Item) => void
}) {
  const [filtros, setFiltrosState] = useState<Filtros>(() => lerLocal(CHAVE, VAZIO))
  const [busca, setBusca] = useState('')
  const [painel, setPainel] = useState(false)

  const setFiltros = (f: Filtros) => {
    setFiltrosState(f)
    salvarLocal(CHAVE, f)
  }

  const alternar = (dim: Dimensao, v: string) => {
    const atual = filtros[dim]
    setFiltros({ ...filtros, [dim]: atual.includes(v) ? atual.filter((x) => x !== v) : [...atual, v] })
  }

  const ordemCategoria = useMemo(() => {
    const m = new Map(categorias.map((c) => [c.nome, c.ordem]))
    return (nome: string) => m.get(nome) ?? 999
  }, [categorias])

  const visiveis = useMemo(() => {
    const q = semAcento(busca.trim())
    const passa = (lista: string[], v: string) => lista.length === 0 || lista.includes(v)
    const r = itens.filter(
      (i) =>
        ehAtivo(i) &&
        passa(filtros.categorias, i.categoria) &&
        passa(filtros.tipos, i.tipo) &&
        passa(filtros.status, i.status) &&
        passa(filtros.faixas, i.faixa_investimento) &&
        passa(filtros.fases, i.fase) &&
        passa(filtros.prioridades, i.prioridade) &&
        (!q || semAcento(`${i.nome} ${i.nota} ${i.fonte}`).includes(q)),
    )

    const porPreco = (dir: 1 | -1) => (a: Item, b: Item) => {
      const pa = precoParaOrdenar(a)
      const pb = precoParaOrdenar(b)
      // sem preço nenhum: usa a faixa de investimento ($$$ > $$ > $) como aproximação
      if (pa == null && pb == null) return (ordemFaixa(a) - ordemFaixa(b)) * dir
      if (pa == null) return 1 // sem preço sempre no fim
      if (pb == null) return -1
      return (pa - pb) * dir
    }
    const desempate = (a: Item, b: Item) =>
      ordemPrioridade(a.prioridade) - ordemPrioridade(b.prioridade) ||
      ordemFase(a.fase) - ordemFase(b.fase) ||
      (a.numero ?? 9999) - (b.numero ?? 9999)

    const cmp: Record<Ordem, (a: Item, b: Item) => number> = {
      categoria: (a, b) =>
        ordemCategoria(a.categoria) - ordemCategoria(b.categoria) ||
        a.categoria.localeCompare(b.categoria) ||
        (a.numero ?? 9999) - (b.numero ?? 9999),
      prioridade: (a, b) => ordemPrioridade(a.prioridade) - ordemPrioridade(b.prioridade) || ordemFase(a.fase) - ordemFase(b.fase),
      fase: (a, b) => ordemFase(a.fase) - ordemFase(b.fase) || ordemPrioridade(a.prioridade) - ordemPrioridade(b.prioridade),
      preco_asc: (a, b) => porPreco(1)(a, b) || desempate(a, b),
      preco_desc: (a, b) => porPreco(-1)(a, b) || desempate(a, b),
    }
    return r.sort(cmp[filtros.ordem])
  }, [itens, filtros, busca, ordemCategoria])

  // Agrupa pela dimensão da ordenação (categoria, prioridade ou fase); preço fica em lista única.
  const grupos = useMemo(() => {
    const chave =
      filtros.ordem === 'categoria'
        ? (i: Item) => i.categoria
        : filtros.ordem === 'prioridade'
          ? (i: Item) => i.prioridade
          : filtros.ordem === 'fase'
            ? (i: Item) => i.fase
            : null
    if (!chave) return [{ titulo: '', itens: visiveis }]
    const g: { titulo: string; itens: Item[] }[] = []
    for (const i of visiveis) {
      const k = chave(i)
      const ultimo = g[g.length - 1]
      if (ultimo?.titulo === k) ultimo.itens.push(i)
      else g.push({ titulo: k, itens: [i] })
    }
    return g
  }, [visiveis, filtros.ordem])

  const ativos: { dim: Dimensao; v: string }[] = (
    ['categorias', 'tipos', 'status', 'faixas', 'fases', 'prioridades'] as Dimensao[]
  ).flatMap((dim) => filtros[dim].map((v) => ({ dim, v })))

  const categoriasAtivas = categorias.filter((c) => c.nome !== 'Não comprar')

  return (
    <div>
      <div className="bg-fundo/95 sticky top-0 z-10 -mx-4 px-4 pt-2 pb-3 backdrop-blur">
        <div className="flex gap-2">
          <label className="bg-cartao border-linha flex flex-1 items-center gap-2 rounded-full border px-3">
            <IconBusca className="text-suave h-4 w-4" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar"
              className="w-full bg-transparent py-2 outline-none"
            />
            {busca && (
              <button onClick={() => setBusca('')} aria-label="Limpar busca" className="text-suave">
                <IconX className="h-4 w-4" />
              </button>
            )}
          </label>
          <button
            onClick={() => setPainel(true)}
            className={`flex items-center gap-1.5 rounded-full border px-4 font-semibold ${
              ativos.length || filtros.ordem !== 'categoria'
                ? 'border-salvia bg-salvia text-white'
                : 'border-linha bg-cartao'
            }`}
          >
            <IconFiltro className="h-4 w-4" />
            {ativos.length ? ativos.length : 'Filtros'}
          </button>
        </div>
        {(ativos.length > 0 || filtros.ordem !== 'categoria') && (
          <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
            {filtros.ordem !== 'categoria' && (
              <span className="text-suave shrink-0 self-center text-xs">
                Ordem: {ORDENS.find((o) => o.v === filtros.ordem)?.rotulo}
              </span>
            )}
            {ativos.map(({ dim, v }) => (
              <button
                key={dim + v}
                onClick={() => alternar(dim, v)}
                className="bg-salvia-claro text-salvia flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
              >
                {v} <IconX className="h-3 w-3" />
              </button>
            ))}
            {ativos.length > 0 && (
              <button
                onClick={() => setFiltros({ ...VAZIO, ordem: filtros.ordem })}
                className="text-terracota shrink-0 px-2 text-xs font-semibold"
              >
                Limpar
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-suave mb-2 text-xs">
        {visiveis.length} {visiveis.length === 1 ? 'item' : 'itens'} · {visiveis.filter((i) => i.status === 'Feito').length}{' '}
        feitos
      </p>

      {grupos.map((g) => (
        <section key={g.titulo || 'todos'} className="mb-5">
          {g.titulo && (
            <h2 className="text-suave mb-2 text-sm font-bold tracking-wide uppercase">
              {g.titulo}{' '}
              <span className="font-normal normal-case">
                · {g.itens.filter((i) => i.status === 'Feito').length}/{g.itens.length}
              </span>
            </h2>
          )}
          <div className="flex flex-col gap-2">
            {g.itens.map((i) => (
              <ItemCard key={i.id} item={i} aoAbrir={() => aoAbrir(i)} aoMarcar={() => aoMarcar(i)} />
            ))}
          </div>
        </section>
      ))}

      {visiveis.length === 0 && <p className="text-suave py-12 text-center">Nenhum item com esses filtros.</p>}

      <Sheet
        aberto={painel}
        aoFechar={() => setPainel(false)}
        titulo="Filtros e ordem"
        rodape={
          <div className="flex gap-2">
            <button
              onClick={() => setFiltros(VAZIO)}
              className="border-linha bg-cartao flex-1 rounded-full border py-3 font-semibold"
            >
              Limpar tudo
            </button>
            <button onClick={() => setPainel(false)} className="bg-salvia flex-1 rounded-full py-3 font-semibold text-white">
              Ver {visiveis.length}
            </button>
          </div>
        }
      >
        <Grupo titulo="Ordenar por">
          {ORDENS.map((o) => (
            <Chip key={o.v} ativo={filtros.ordem === o.v} onClick={() => setFiltros({ ...filtros, ordem: o.v })}>
              {o.rotulo}
            </Chip>
          ))}
        </Grupo>
        <Grupo titulo="Status">
          {STATUS_ATIVOS.map((v) => (
            <Chip key={v} ativo={filtros.status.includes(v)} onClick={() => alternar('status', v)}>
              {v}
            </Chip>
          ))}
        </Grupo>
        <Grupo titulo="Prioridade">
          {PRIORIDADES.map((v) => (
            <Chip key={v} ativo={filtros.prioridades.includes(v)} onClick={() => alternar('prioridades', v)}>
              {v}
            </Chip>
          ))}
        </Grupo>
        <Grupo titulo="Fase">
          {FASES.map((v) => (
            <Chip key={v} ativo={filtros.fases.includes(v)} onClick={() => alternar('fases', v)}>
              {v}
            </Chip>
          ))}
        </Grupo>
        <Grupo titulo="Tipo">
          {TIPOS_ATIVOS.map((v) => (
            <Chip key={v} ativo={filtros.tipos.includes(v)} onClick={() => alternar('tipos', v)}>
              {v}
            </Chip>
          ))}
        </Grupo>
        <Grupo titulo="Faixa de investimento">
          {FAIXAS.map((v) => (
            <Chip key={v} ativo={filtros.faixas.includes(v)} onClick={() => alternar('faixas', v)}>
              {v} <span className="text-xs opacity-75">{FAIXA_DESCRICAO[v]}</span>
            </Chip>
          ))}
        </Grupo>
        <Grupo titulo="Categoria">
          {categoriasAtivas.map((c) => (
            <Chip key={c.id} ativo={filtros.categorias.includes(c.nome)} onClick={() => alternar('categorias', c.nome)}>
              {c.nome}
            </Chip>
          ))}
        </Grupo>
      </Sheet>
    </div>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="rotulo">{titulo}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
