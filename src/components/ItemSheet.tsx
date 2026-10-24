import { useEffect, useState } from 'react'
import { atualizarItem, criarItem, excluirItem } from '../data/store'
import { dataCurta, formatarBRL, lerPreco, menorPrecoLink, precoParaTexto } from '../lib'
import {
  FAIXA_DESCRICAO,
  FAIXAS,
  FASES,
  NAO_COMPRAR,
  PRIORIDADES,
  TIPOS,
  type Categoria,
  type Item,
  type ItemDados,
  type Status,
  type Tipo,
} from '../types'
import { IconLink, IconLivro, IconLixo, IconMais, IconX, Segmentado, SeloPrioridade, Sheet } from './ui'

interface LinkForm {
  url: string
  loja: string
  preco: string
}

interface Form {
  nome: string
  categoria: string
  tipo: Tipo
  fase: string
  prioridade: string
  faixa_investimento: string
  quantidade: string
  status: Status
  preco_estimado: string
  preco_pago: string
  fonte: string
  nota: string
  links: LinkForm[]
  categoria_anterior: string | null
}

function paraForm(i: Item): Form {
  return {
    nome: i.nome,
    categoria: i.categoria,
    tipo: i.tipo,
    fase: i.fase,
    prioridade: i.prioridade,
    faixa_investimento: i.faixa_investimento,
    quantidade: i.quantidade === '—' ? '' : i.quantidade,
    status: i.status,
    preco_estimado: precoParaTexto(i.preco_estimado),
    preco_pago: precoParaTexto(i.preco_pago),
    fonte: i.fonte,
    nota: i.nota,
    links: i.links.map((l) => ({ url: l.url, loja: l.loja, preco: precoParaTexto(l.preco) })),
    categoria_anterior: i.categoria_anterior ?? null,
  }
}

export function novoForm(base: Partial<Form>): Form {
  return {
    nome: '',
    categoria: '',
    tipo: 'Comprar',
    fase: 'Antes do nascimento',
    prioridade: 'Recomendado',
    faixa_investimento: '$',
    quantidade: '',
    status: 'Pendente',
    preco_estimado: '',
    preco_pago: '',
    fonte: '',
    nota: '',
    links: [],
    categoria_anterior: null,
    ...base,
  }
}

function paraDados(f: Form): ItemDados {
  const naoComprar = f.tipo === NAO_COMPRAR
  const url = (s: string) => {
    const t = s.trim()
    return t && !/^https?:\/\//i.test(t) ? `https://${t}` : t
  }
  return {
    numero: null,
    nome: f.nome.trim(),
    categoria: f.categoria,
    tipo: f.tipo,
    fase: naoComprar ? '—' : f.fase,
    prioridade: naoComprar ? '—' : f.prioridade,
    faixa_investimento: naoComprar ? '—' : f.faixa_investimento,
    quantidade: f.quantidade.trim() || '—',
    status: f.status,
    preco_estimado: lerPreco(f.preco_estimado),
    preco_pago: lerPreco(f.preco_pago),
    fonte: f.fonte.trim(),
    nota: f.nota.trim(),
    links: f.links
      .filter((l) => l.url.trim())
      .map((l) => ({ url: url(l.url), loja: l.loja.trim(), preco: lerPreco(l.preco) })),
    categoria_anterior: f.categoria_anterior,
  }
}

export type Alvo = { tipo: 'existente'; id: string } | { tipo: 'novo'; base: Partial<Form> }

/** Montado com `key` diferente para cada item aberto, então o estado inicial vem das props. */
export default function ItemSheet({
  alvo,
  item,
  categorias,
  aoFechar,
}: {
  alvo: Alvo
  /** versão ao vivo do item (null ao criar) */
  item: Item | null
  categorias: Categoria[]
  aoFechar: () => void
}) {
  const [editando, setEditando] = useState(alvo.tipo === 'novo')
  const [form, setForm] = useState<Form>(() =>
    item
      ? paraForm(item)
      : novoForm({
          categoria: categorias.find((c) => c.nome !== NAO_COMPRAR)?.nome ?? '',
          ...(alvo.tipo === 'novo' ? alvo.base : {}),
        }),
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Mantém a visualização em dia se a outra pessoa alterar o item enquanto está aberto
  useEffect(() => {
    if (item && !editando) setForm(paraForm(item))
  }, [item, editando])

  // Item excluído pela outra pessoa enquanto estava aberto
  useEffect(() => {
    if (alvo.tipo === 'existente' && !item) aoFechar()
  }, [alvo, item, aoFechar])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v })

  // Trocar o tipo para/de "Não comprar" move o item entre as listas
  const mudarTipo = (tipo: Tipo) => {
    if (tipo === form.tipo) return
    if (tipo === NAO_COMPRAR) {
      setForm({
        ...form,
        tipo,
        categoria_anterior: form.categoria !== NAO_COMPRAR ? form.categoria : form.categoria_anterior,
        categoria: NAO_COMPRAR,
        status: 'Decidido',
      })
    } else if (form.tipo === NAO_COMPRAR) {
      setForm({
        ...form,
        tipo,
        categoria:
          form.categoria_anterior && categorias.some((c) => c.nome === form.categoria_anterior)
            ? form.categoria_anterior
            : (categorias.find((c) => c.nome !== NAO_COMPRAR)?.nome ?? ''),
        categoria_anterior: null,
        status: 'Pendente',
        fase: FASES.includes(form.fase as never) ? form.fase : 'Antes do nascimento',
        prioridade: PRIORIDADES.includes(form.prioridade as never) ? form.prioridade : 'Recomendado',
        faixa_investimento: form.faixa_investimento === '—' ? '$' : form.faixa_investimento,
      })
    } else {
      setForm({ ...form, tipo })
    }
  }

  const salvar = async () => {
    if (!form.nome.trim()) return setErro('Dê um nome ao item.')
    if (!form.categoria) return setErro('Escolha uma categoria.')
    setSalvando(true)
    setErro(null)
    try {
      const dados = paraDados(form)
      if (item) {
        const { numero: _n, ...semNumero } = dados
        // não espera o servidor: com o cache local a mudança aparece na hora e sincroniza depois
        atualizarItem(item.id, semNumero, item.status).catch((e) => alert(`Não foi possível salvar: ${e.message}`))
      } else {
        criarItem(dados).catch((e) => alert(`Não foi possível criar: ${e.message}`))
      }
      aoFechar()
    } finally {
      setSalvando(false)
    }
  }

  const excluir = () => {
    if (!item || !confirm(`Excluir "${item.nome}"? Não dá para desfazer.`)) return
    excluirItem(item.id).catch((e) => alert(e.message))
    aoFechar()
  }

  const naoComprar = form.tipo === NAO_COMPRAR
  const categoriasOpcoes = naoComprar
    ? categorias.filter((c) => c.nome === NAO_COMPRAR)
    : categorias.filter((c) => c.nome !== NAO_COMPRAR)
  const statusOpcoes: Status[] = naoComprar ? ['Decidido'] : ['Pendente', 'Em andamento', 'Feito']

  // ---------- Visualização ----------
  if (!editando && item) {
    const menor = menorPrecoLink(item)
    return (
      <Sheet
        aberto
        aoFechar={aoFechar}
        titulo={<span className="line-clamp-2">{item.nome}</span>}
        rodape={
          <button onClick={() => setEditando(true)} className="bg-salvia w-full rounded-full py-3 font-semibold text-white">
            Editar
          </button>
        }
      >
        <div className="text-suave mb-4 flex flex-wrap items-center gap-2 text-sm">
          <SeloPrioridade p={item.prioridade} />
          <span>{item.categoria}</span>·<span>{item.tipo}</span>
          {item.fase !== '—' && <>·<span>{item.fase}</span></>}
        </div>

        {!naoComprar && (
          <div className="mb-4">
            <div className="rotulo">Status</div>
            <Segmentado
              opcoes={statusOpcoes}
              valor={item.status}
              aoMudar={(s) => atualizarItem(item.id, { status: s }, item.status).catch((e) => alert(e.message))}
            />
            {item.status === 'Feito' && item.feito_por && (
              <p className="text-salvia mt-2 text-sm font-semibold">
                ✓ Feito por {item.feito_por} {item.feito_em && `em ${dataCurta(item.feito_em)}`}
              </p>
            )}
          </div>
        )}

        {(item.nota || item.fonte) && (
          <div className="bg-cartao border-linha mb-4 rounded-2xl border p-3">
            {item.nota && <p className="leading-relaxed">{item.nota}</p>}
            {item.fonte && (
              <p className="text-suave mt-2 flex items-center gap-1.5 text-sm italic">
                <IconLivro /> {item.fonte}
              </p>
            )}
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <Info rotulo="Quantidade" valor={item.quantidade} />
          <Info
            rotulo="Faixa"
            valor={item.faixa_investimento === '—' ? '—' : `${item.faixa_investimento} (${FAIXA_DESCRICAO[item.faixa_investimento]})`}
          />
          <Info rotulo="Preço estimado" valor={formatarBRL(item.preco_estimado ?? menor)} />
          <Info rotulo="Preço pago" valor={formatarBRL(item.preco_pago)} />
        </div>

        <div className="rotulo">Onde comprar</div>
        {item.links.length === 0 && <p className="text-suave text-sm">Nenhum link ainda. Toque em Editar para adicionar.</p>}
        <div className="flex flex-col gap-2">
          {item.links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-cartao border-linha flex items-center gap-3 rounded-2xl border p-3"
            >
              <IconLink className="text-salvia h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{l.loja || dominio(l.url)}</span>
              {l.preco != null && <span className="font-semibold">{formatarBRL(l.preco)}</span>}
            </a>
          ))}
        </div>

        {item.atualizado_por && (
          <p className="text-suave mt-6 text-center text-xs">
            Última alteração por {item.atualizado_por} {dataCurta(item.atualizado_em)}
          </p>
        )}
      </Sheet>
    )
  }

  // ---------- Edição / criação ----------
  return (
    <Sheet
      aberto
      aoFechar={item ? () => setEditando(false) : aoFechar}
      titulo={item ? 'Editar item' : naoComprar ? 'Novo item (não comprar)' : 'Novo item'}
      rodape={
        <div className="flex gap-2">
          {item && (
            <button
              onClick={excluir}
              className="border-linha text-terracota bg-cartao flex items-center gap-1 rounded-full border px-4 font-semibold"
            >
              <IconLixo /> Excluir
            </button>
          )}
          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-salvia flex-1 rounded-full py-3 font-semibold text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {erro && <p className="text-terracota text-sm font-semibold">{erro}</p>}
        <div>
          <label className="rotulo">Nome</label>
          <input className="campo" value={form.nome} onChange={(e) => set('nome', e.target.value)} autoFocus={!item} />
        </div>

        <div>
          <div className="rotulo">Tipo</div>
          <Segmentado opcoes={TIPOS} valor={form.tipo} aoMudar={mudarTipo} />
          {item && (
            <p className="text-suave mt-1 text-xs">
              {naoComprar
                ? 'Escolha outro tipo para voltar este item à lista ativa.'
                : 'Escolha "Não comprar" para mover o item para essa lista.'}
            </p>
          )}
        </div>

        <div>
          <label className="rotulo">Categoria</label>
          <select className="campo" value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
            {!categoriasOpcoes.some((c) => c.nome === form.categoria) && <option value={form.categoria}>{form.categoria || '—'}</option>}
            {categoriasOpcoes.map((c) => (
              <option key={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {!naoComprar && (
          <>
            <div>
              <div className="rotulo">Status</div>
              <Segmentado opcoes={statusOpcoes} valor={form.status} aoMudar={(s) => set('status', s)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="rotulo">Fase</label>
                <select className="campo" value={form.fase} onChange={(e) => set('fase', e.target.value)}>
                  {FASES.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="rotulo">Prioridade</label>
                <select className="campo" value={form.prioridade} onChange={(e) => set('prioridade', e.target.value)}>
                  {PRIORIDADES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="rotulo">Faixa</label>
                <select
                  className="campo"
                  value={form.faixa_investimento}
                  onChange={(e) => set('faixa_investimento', e.target.value)}
                >
                  {FAIXAS.map((f) => (
                    <option key={f} value={f}>
                      {f} {FAIXA_DESCRICAO[f]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="rotulo">Quantidade</label>
                <input className="campo" value={form.quantidade} onChange={(e) => set('quantidade', e.target.value)} placeholder="ex.: 4–6" />
              </div>
              <div>
                <label className="rotulo">Preço estimado (R$)</label>
                <input
                  className="campo"
                  inputMode="decimal"
                  value={form.preco_estimado}
                  onChange={(e) => set('preco_estimado', e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="rotulo">Preço pago (R$)</label>
                <input
                  className="campo"
                  inputMode="decimal"
                  value={form.preco_pago}
                  onChange={(e) => set('preco_pago', e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <div className="rotulo">Links de compra</div>
              <div className="flex flex-col gap-2">
                {form.links.map((l, i) => {
                  const mudar = (campo: keyof LinkForm, v: string) =>
                    set(
                      'links',
                      form.links.map((x, j) => (j === i ? { ...x, [campo]: v } : x)),
                    )
                  return (
                    <div key={i} className="bg-cartao border-linha rounded-2xl border p-2">
                      <div className="flex gap-2">
                        <input
                          className="campo"
                          value={l.url}
                          onChange={(e) => mudar('url', e.target.value)}
                          placeholder="https://…"
                          inputMode="url"
                        />
                        <button
                          onClick={() => set('links', form.links.filter((_, j) => j !== i))}
                          className="text-suave px-1"
                          aria-label="Remover link"
                        >
                          <IconX />
                        </button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input className="campo" value={l.loja} onChange={(e) => mudar('loja', e.target.value)} placeholder="Loja" />
                        <input
                          className="campo w-32!"
                          value={l.preco}
                          onChange={(e) => mudar('preco', e.target.value)}
                          placeholder="R$"
                          inputMode="decimal"
                        />
                      </div>
                    </div>
                  )
                })}
                <button
                  onClick={() => set('links', [...form.links, { url: '', loja: '', preco: '' }])}
                  className="border-linha text-salvia flex items-center justify-center gap-1 rounded-2xl border border-dashed py-2.5 font-semibold"
                >
                  <IconMais className="h-4 w-4" /> Adicionar link
                </button>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="rotulo">Nota</label>
          <textarea className="campo" rows={3} value={form.nota} onChange={(e) => set('nota', e.target.value)} />
        </div>
        <div>
          <label className="rotulo">Fonte</label>
          <input
            className="campo"
            value={form.fonte}
            onChange={(e) => set('fonte', e.target.value)}
            placeholder="ex.: O Bebê Montessori, p. 75"
          />
        </div>
      </div>
    </Sheet>
  )
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="bg-cartao border-linha rounded-2xl border p-3">
      <div className="text-suave text-xs">{rotulo}</div>
      <div className="font-semibold">{valor || '—'}</div>
    </div>
  )
}

function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
