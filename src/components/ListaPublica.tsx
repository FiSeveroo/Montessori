import { useEffect, useMemo, useState } from 'react'
import { esgotado, registrarCompra, useConfigLista, usePresentes } from '../data/presentes'
import { formatarBRL, lerLocal, salvarLocal, semAcento } from '../lib'
import type { Presente } from '../types'
import { Carregando } from '../App'
import { FotoItem } from './Imagem'
import { Chip, IconBusca, IconCheck, IconLink, IconX, Sheet } from './ui'

const CHAVE_NOME = 'enxoval.convidado'

// Faixas de investimento como o convidado entende (o preço exato só aparece ao abrir o item)
const FAIXA_PUBLICA: Record<string, string> = {
  $: 'Até R$ 100',
  $$: 'R$ 100 a 500',
  $$$: 'Acima de R$ 500',
}
const ORDEM_FAIXA: Record<string, number> = { $: 1, $$: 2, $$$: 3 }

type Ordem = 'categoria' | 'menor' | 'maior'

/** Página aberta pelos convidados (sem login). Só lê /presentes e /config/lista. */
export default function ListaPublica() {
  const { presentes, carregando, erro } = usePresentes(true)
  const config = useConfigLista()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [faixas, setFaixas] = useState<string[]>([])
  const [ordem, setOrdem] = useState<Ordem>('categoria')
  const [mostrarComprados, setMostrarComprados] = useState(false)
  const [aberto, setAberto] = useState<string | null>(null)
  const [comprando, setComprando] = useState<Presente | null>(null)
  const [obrigado, setObrigado] = useState<string | null>(null)

  useEffect(() => {
    if (config?.titulo) document.title = config.titulo
  }, [config?.titulo])

  const categorias = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of presentes) m.set(p.categoria, p.ordem_categoria)
    return [...m.entries()].sort((a, b) => a[1] - b[1]).map(([c]) => c)
  }, [presentes])

  const faixasExistentes = useMemo(
    () => Object.keys(FAIXA_PUBLICA).filter((f) => presentes.some((p) => p.faixa === f)),
    [presentes],
  )

  const visiveis = useMemo(() => {
    const q = semAcento(busca.trim())
    const porCategoria = (a: Presente, b: Presente) =>
      a.ordem_categoria - b.ordem_categoria || a.categoria.localeCompare(b.categoria) || a.numero - b.numero
    const faixa = (p: Presente) => ORDEM_FAIXA[p.faixa] ?? 0
    return presentes
      .filter(
        (p) =>
          (mostrarComprados || !esgotado(p)) &&
          (!categoria || p.categoria === categoria) &&
          (faixas.length === 0 || faixas.includes(p.faixa)) &&
          (!q || semAcento(`${p.nome} ${p.nota}`).includes(q)),
      )
      .sort(
        (a, b) =>
          Number(esgotado(a)) - Number(esgotado(b)) ||
          (ordem === 'menor' ? faixa(a) - faixa(b) : ordem === 'maior' ? faixa(b) - faixa(a) : 0) ||
          porCategoria(a, b),
      )
  }, [presentes, busca, categoria, faixas, ordem, mostrarComprados])

  // Por categoria: seções; por preço: uma grade só
  const secoes = useMemo(() => {
    if (ordem !== 'categoria') return [{ titulo: '', itens: visiveis }]
    const s: { titulo: string; itens: Presente[] }[] = []
    for (const p of visiveis) {
      const titulo = esgotado(p) ? 'Já presenteados' : p.categoria
      const ultimo = s[s.length - 1]
      if (ultimo?.titulo === titulo) ultimo.itens.push(p)
      else s.push({ titulo, itens: [p] })
    }
    return s
  }, [visiveis, ordem])

  const disponiveis = presentes.filter((p) => !esgotado(p)).length
  const comprados = presentes.length - disponiveis
  const filtrando = busca || categoria || faixas.length > 0
  const presenteAberto = presentes.find((p) => p.id === aberto) ?? null

  const alternarFaixa = (f: string) => setFaixas(faixas.includes(f) ? faixas.filter((x) => x !== f) : [...faixas, f])

  return (
    <div className="mx-auto min-h-dvh max-w-4xl pb-16">
      <header className="pt-safe px-4 pt-8 pb-5 text-center">
        <img src="/favicon.svg" alt="" className="mx-auto h-16 w-16" />
        <h1 className="mt-3 text-2xl font-bold">{config?.titulo}</h1>
        {config?.mensagem && (
          <p className="text-suave mx-auto mt-2 max-w-md leading-relaxed whitespace-pre-line">{config.mensagem}</p>
        )}
      </header>

      {erro && <p className="text-terracota py-8 text-center">Não foi possível carregar a lista. Tente de novo em instantes.</p>}
      {carregando && !erro && <div className="py-16"><Carregando /></div>}

      {!carregando && !erro && presentes.length === 0 && (
        <p className="text-suave py-12 text-center">A lista ainda está sendo montada.</p>
      )}

      {!carregando && !erro && presentes.length > 0 && (
        <>
          {/* Filtros */}
          <div className="bg-fundo/95 sticky top-0 z-10 px-4 pt-2 pb-3 backdrop-blur">
            <label className="bg-cartao border-linha flex items-center gap-2 rounded-full border px-3">
              <IconBusca className="text-suave h-4 w-4" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar presente"
                className="w-full bg-transparent py-2 outline-none"
              />
              {busca && (
                <button onClick={() => setBusca('')} aria-label="Limpar busca" className="text-suave">
                  <IconX className="h-4 w-4" />
                </button>
              )}
            </label>

            <div className="sem-barra -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
              <Chip ativo={!categoria} onClick={() => setCategoria(null)}>
                Todas
              </Chip>
              {categorias.map((c) => (
                <span key={c} className="shrink-0">
                  <Chip ativo={categoria === c} onClick={() => setCategoria(categoria === c ? null : c)}>
                    {c}
                  </Chip>
                </span>
              ))}
            </div>

            <div className="sem-barra -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
              {faixasExistentes.map((f) => (
                <span key={f} className="shrink-0">
                  <Chip ativo={faixas.includes(f)} onClick={() => alternarFaixa(f)}>
                    {FAIXA_PUBLICA[f]}
                  </Chip>
                </span>
              ))}
              {comprados > 0 && (
                <span className="shrink-0">
                  <Chip ativo={mostrarComprados} onClick={() => setMostrarComprados(!mostrarComprados)}>
                    Ver presenteados
                  </Chip>
                </span>
              )}
            </div>
          </div>

          <div className="text-suave flex items-center justify-between gap-2 px-4 pb-3 text-sm">
            <span>
              {filtrando ? `${visiveis.length} encontrados · ` : ''}
              {disponiveis} disponíveis · {comprados} presenteados
            </span>
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as Ordem)}
              className="text-tinta shrink-0 bg-transparent font-semibold outline-none"
              aria-label="Ordenar"
            >
              <option value="categoria">Por categoria</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
            </select>
          </div>

          <div className="px-4">
            {secoes.map((s) => (
              <section key={s.titulo || 'todos'} className="mb-6">
                {s.titulo && <h2 className="text-suave mb-2 text-sm font-bold tracking-wide uppercase">{s.titulo}</h2>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {s.itens.map((p) => (
                    <CartaoPresente key={p.id} p={p} aoAbrir={() => setAberto(p.id)} />
                  ))}
                </div>
              </section>
            ))}

            {visiveis.length === 0 && (
              <p className="text-suave py-12 text-center">
                {filtrando ? 'Nenhum presente com esses filtros.' : 'Todos os itens já foram presenteados. Obrigado! 💛'}
              </p>
            )}

            <p className="text-suave mt-10 text-center text-xs leading-relaxed">
              Alguns links podem ser de afiliado: comprando por eles, a loja nos repassa uma pequena comissão, sem custo
              extra para você.
            </p>
          </div>
        </>
      )}

      {presenteAberto && !comprando && (
        <DetalhePresente
          p={presenteAberto}
          aoFechar={() => setAberto(null)}
          aoComprar={() => setComprando(presenteAberto)}
        />
      )}

      {comprando && (
        <ConfirmarCompra
          p={comprando}
          aoFechar={() => setComprando(null)}
          aoConfirmar={(nome) => {
            setComprando(null)
            setAberto(null)
            setObrigado(nome)
          }}
        />
      )}

      {obrigado && (
        <div className="fixed inset-x-3 bottom-6 z-50 mx-auto max-w-md" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="bg-salvia flex items-center gap-3 rounded-2xl p-4 text-white shadow-xl">
            <span className="text-2xl">💛</span>
            <p className="flex-1 text-sm">
              <b>Obrigado, {obrigado}!</b> Já avisamos os pais.
            </p>
            <button onClick={() => setObrigado(null)} className="text-sm font-semibold underline">
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SeloStatus({ p }: { p: Presente }) {
  if (esgotado(p))
    return (
      <span className="bg-salvia flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow">
        <IconCheck className="h-3 w-3" /> Presenteado
      </span>
    )
  if (p.multiplo && p.compras.length > 0)
    return (
      <span className="bg-cartao text-salvia rounded-full px-2 py-0.5 text-[11px] font-semibold shadow">
        {p.compras.length} já {p.compras.length === 1 ? 'deu' : 'deram'}
      </span>
    )
  return null
}

function CartaoPresente({ p, aoAbrir }: { p: Presente; aoAbrir: () => void }) {
  const fechado = esgotado(p)
  return (
    <button
      onClick={aoAbrir}
      className={`bg-cartao border-linha flex flex-col overflow-hidden rounded-2xl border text-left transition active:scale-[0.98] ${
        fechado ? 'opacity-55' : ''
      }`}
    >
      <div className="relative">
        <FotoItem src={p.imagem} alt={p.nome} className="aspect-square w-full" />
        <div className="absolute top-2 left-2">
          <SeloStatus p={p} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className={`line-clamp-3 text-sm leading-snug font-semibold ${fechado ? 'line-through' : ''}`}>{p.nome}</div>
        <div className="mt-auto pt-2">
          {FAIXA_PUBLICA[p.faixa] && <span className="text-suave text-xs">{FAIXA_PUBLICA[p.faixa]}</span>}
        </div>
      </div>
    </button>
  )
}

function DetalhePresente({ p, aoFechar, aoComprar }: { p: Presente; aoFechar: () => void; aoComprar: () => void }) {
  const fechado = esgotado(p)
  return (
    <Sheet
      aberto
      aoFechar={aoFechar}
      titulo={<span className="line-clamp-2">{p.nome}</span>}
      rodape={
        fechado ? (
          <p className="text-salvia py-2 text-center font-semibold">Este presente já foi dado 💛</p>
        ) : (
          <button onClick={aoComprar} className="bg-salvia w-full rounded-full py-3 font-semibold text-white">
            Já comprei este presente
          </button>
        )
      }
    >
      <div className="relative mb-4">
        <FotoItem src={p.imagem} alt={p.nome} className="aspect-[4/3] w-full rounded-2xl" />
        <div className="absolute top-3 left-3">
          <SeloStatus p={p} />
        </div>
      </div>

      <div className="text-suave mb-3 flex flex-wrap gap-x-2 text-sm">
        <span>{p.categoria}</span>
        {FAIXA_PUBLICA[p.faixa] && <span>· {FAIXA_PUBLICA[p.faixa]}</span>}
        {p.quantidade && <span>· Quantidade sugerida: {p.quantidade}</span>}
      </div>

      {p.nota && <p className="mb-4 leading-relaxed">{p.nota}</p>}

      {p.multiplo && (
        <p className="bg-salvia-claro text-salvia mb-4 rounded-xl px-3 py-2 text-sm font-semibold">
          Várias pessoas podem dar este presente
          {p.compras.length > 0 && ` — ${p.compras.length} já ${p.compras.length === 1 ? 'deu' : 'deram'}`}.
        </p>
      )}

      {!fechado && p.links.length > 0 && (
        <>
          <div className="rotulo">Onde comprar</div>
          <div className="flex flex-col gap-2">
            {p.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="bg-cartao border-linha flex items-center gap-3 rounded-2xl border p-3"
              >
                <IconLink className="text-salvia h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-semibold">{l.loja || 'Ver na loja'}</span>
                {l.preco != null && <span className="font-bold">{formatarBRL(l.preco)}</span>}
              </a>
            ))}
          </div>
          <p className="text-suave mt-2 text-xs">Preços consultados pelos pais; podem mudar na loja.</p>
        </>
      )}
      {!fechado && p.links.length === 0 && (
        <p className="text-suave text-sm">Pode comprar onde preferir. Depois é só marcar aqui que já comprou.</p>
      )}
    </Sheet>
  )
}

function ConfirmarCompra({
  p,
  aoFechar,
  aoConfirmar,
}: {
  p: Presente
  aoFechar: () => void
  aoConfirmar: (nome: string) => void
}) {
  const [nome, setNome] = useState(() => lerLocal(CHAVE_NOME, { nome: '' }).nome)
  const [forma, setForma] = useState<'link' | 'fora' | null>(p.links.length ? null : 'fora')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const pronto = nome.trim().length > 0 && forma !== null

  const confirmar = async () => {
    if (!pronto || !forma) return
    setEnviando(true)
    setErro(null)
    try {
      await registrarCompra(p.id, { nome: nome.trim().slice(0, 60), forma, mensagem: mensagem.trim().slice(0, 300) })
      salvarLocal(CHAVE_NOME, { nome: nome.trim() })
      aoConfirmar(nome.trim().split(' ')[0])
    } catch (e) {
      setErro((e as Error).message.includes('permission') ? 'Este item acabou de ser marcado por outra pessoa.' : (e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Sheet
      aberto
      aoFechar={aoFechar}
      titulo="Confirmar presente"
      rodape={
        <button
          onClick={confirmar}
          disabled={!pronto || enviando}
          className="bg-salvia w-full rounded-full py-3 font-semibold text-white disabled:opacity-50"
        >
          {enviando ? 'Confirmando…' : 'Sim, eu comprei'}
        </button>
      }
    >
      <div className="bg-cartao border-linha mb-4 flex items-center gap-3 rounded-2xl border p-3">
        <FotoItem src={p.imagem} alt="" className="h-14 w-14 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="text-suave text-xs">Você está confirmando que comprou</p>
          <p className="font-semibold">{p.nome}</p>
        </div>
      </div>
      <p className="text-suave mb-4 text-sm leading-relaxed">
        {p.multiplo
          ? 'Os pais vão ver que você presenteou este item. Outras pessoas ainda poderão comprar também.'
          : 'O item vai aparecer como "presenteado" para todo mundo, para ninguém comprar repetido. Só confirme depois de finalizar a compra.'}
      </p>

      <div className="flex flex-col gap-4">
        <label>
          <span className="rotulo">Seu nome</span>
          <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Tia Maria" maxLength={60} />
        </label>

        {p.links.length > 0 && (
          <div>
            <div className="rotulo">Onde você comprou?</div>
            <div className="flex flex-col gap-2">
              <Opcao ativo={forma === 'link'} onClick={() => setForma('link')} texto="Por um dos links da lista" />
              <Opcao ativo={forma === 'fora'} onClick={() => setForma('fora')} texto="Em outra loja" />
            </div>
          </div>
        )}

        <label>
          <span className="rotulo">Recado para os pais (opcional)</span>
          <textarea className="campo" rows={3} value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={300} />
        </label>

        {erro && <p className="text-terracota text-sm font-semibold">{erro}</p>}
      </div>
    </Sheet>
  )
}

function Opcao({ ativo, onClick, texto }: { ativo: boolean; onClick: () => void; texto: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left ${ativo ? 'border-salvia bg-salvia-claro' : 'border-linha bg-cartao'}`}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${ativo ? 'border-salvia' : 'border-linha'}`}>
        {ativo && <span className="bg-salvia h-2.5 w-2.5 rounded-full" />}
      </span>
      {texto}
    </button>
  )
}
