import { ehAtivo, formatarBRL, precoEstimadoEfetivo } from '../lib'
import { FASES, type Categoria, type Item } from '../types'
import { Barra } from './ui'

interface Resumo {
  total: number
  feitos: number
  andamento: number
  estimado: number
  pago: number
  semPreco: number
}

function resumir(itens: Item[]): Resumo {
  const r: Resumo = { total: 0, feitos: 0, andamento: 0, estimado: 0, pago: 0, semPreco: 0 }
  for (const i of itens) {
    r.total++
    if (i.status === 'Feito') r.feitos++
    if (i.status === 'Em andamento') r.andamento++
    // sem estimativa, o valor pago serve de estimativa (senão o gasto passaria do estimado à toa)
    const est = precoEstimadoEfetivo(i) ?? i.preco_pago
    if (est != null) r.estimado += est
    else if (i.faixa_investimento !== '—') r.semPreco++
    if (i.status === 'Feito' && i.preco_pago != null) r.pago += i.preco_pago
  }
  return r
}

const pct = (r: Resumo) => (r.total ? r.feitos / r.total : 0)

export default function Progresso({ itens, categorias }: { itens: Item[]; categorias: Categoria[] }) {
  // "Não comprar" fica fora do progresso e dos gastos
  const ativos = itens.filter(ehAtivo)
  const geral = resumir(ativos)

  const porCategoria = categorias
    .map((c) => ({ nome: c.nome, r: resumir(ativos.filter((i) => i.categoria === c.nome)) }))
    .filter((x) => x.r.total > 0)
  const porFase = FASES.map((f) => ({ nome: f, r: resumir(ativos.filter((i) => i.fase === f)) })).filter((x) => x.r.total > 0)
  const essenciais = resumir(ativos.filter((i) => i.prioridade === 'Essencial' && i.fase === 'Antes do nascimento'))

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="bg-cartao border-linha rounded-3xl border p-5">
        <div className="text-suave text-sm font-semibold">Concluído</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl font-bold">{Math.round(pct(geral) * 100)}%</span>
          <span className="text-suave">
            {geral.feitos} de {geral.total} itens
          </span>
        </div>
        <div className="mt-3">
          <Barra valor={pct(geral)} />
        </div>
        {geral.andamento > 0 && <p className="text-ocre mt-2 text-sm">{geral.andamento} em andamento</p>}
      </div>

      <div className="bg-terracota-claro rounded-3xl p-4">
        <div className="text-terracota text-sm font-bold">Essenciais antes do nascimento</div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-2xl font-bold">
            {essenciais.feitos}/{essenciais.total}
          </span>
          <span className="text-terracota text-sm">faltam {essenciais.total - essenciais.feitos}</span>
        </div>
        <div className="mt-2">
          <Barra valor={pct(essenciais)} cor="bg-terracota" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-cartao border-linha rounded-3xl border p-4">
          <div className="text-suave text-sm font-semibold">Gasto</div>
          <div className="mt-1 text-xl font-bold">{formatarBRL(geral.pago)}</div>
        </div>
        <div className="bg-cartao border-linha rounded-3xl border p-4">
          <div className="text-suave text-sm font-semibold">Estimado</div>
          <div className="mt-1 text-xl font-bold">{formatarBRL(geral.estimado)}</div>
        </div>
      </div>
      {geral.semPreco > 0 && (
        <p className="text-suave -mt-2 px-1 text-xs">
          {geral.semPreco} itens com custo ainda não têm preço estimado nem link com preço — o total estimado vai
          crescer conforme vocês preencherem.
        </p>
      )}

      <Tabela titulo="Por categoria" linhas={porCategoria} />
      <Tabela titulo="Por fase" linhas={porFase} />
    </div>
  )
}

function Tabela({ titulo, linhas }: { titulo: string; linhas: { nome: string; r: Resumo }[] }) {
  return (
    <section>
      <h2 className="text-suave mb-2 text-sm font-bold tracking-wide uppercase">{titulo}</h2>
      <div className="bg-cartao border-linha divide-linha divide-y rounded-3xl border">
        {linhas.map(({ nome, r }) => (
          <div key={nome} className="p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{nome}</span>
              <span className="text-suave shrink-0 text-sm">
                {r.feitos}/{r.total} · {Math.round(pct(r) * 100)}%
              </span>
            </div>
            <div className="mt-2">
              <Barra valor={pct(r)} />
            </div>
            {(r.pago > 0 || r.estimado > 0) && (
              <div className="text-suave mt-1.5 text-xs">
                gasto {formatarBRL(r.pago)} · estimado {formatarBRL(r.estimado)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
