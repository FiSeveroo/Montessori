import { dataCurta, formatarBRL, precoEstimadoEfetivo } from '../lib'
import type { Item } from '../types'
import { IconCheck, SeloPrioridade } from './ui'

const rotuloTipo: Record<string, string> = {
  'Fazer em casa': 'Fazer em casa',
  'Ajuste da casa': 'Ajuste',
  Tarefa: 'Tarefa',
}

export default function ItemCard({
  item,
  aoAbrir,
  aoMarcar,
}: {
  item: Item
  aoAbrir: () => void
  aoMarcar: () => void
}) {
  const feito = item.status === 'Feito'
  const andamento = item.status === 'Em andamento'
  const estimado = precoEstimadoEfetivo(item)

  return (
    <div className={`bg-cartao border-linha flex items-start gap-3 rounded-2xl border p-3 ${feito ? 'opacity-60' : ''}`}>
      <button
        onClick={aoMarcar}
        aria-label={feito ? 'Desmarcar' : 'Marcar como feito'}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
          feito
            ? 'border-salvia bg-salvia text-white'
            : andamento
              ? 'border-ocre bg-ocre-claro text-ocre'
              : 'border-linha text-transparent'
        }`}
      >
        {feito ? <IconCheck /> : andamento ? <span className="bg-ocre h-2.5 w-2.5 rounded-full" /> : null}
      </button>

      <button onClick={aoAbrir} className="min-w-0 flex-1 text-left">
        <div className={`leading-snug font-semibold ${feito ? 'line-through' : ''}`}>{item.nome}</div>
        <div className="text-suave mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <SeloPrioridade p={item.prioridade} />
          {rotuloTipo[item.tipo] && (
            <span className="bg-salvia-claro text-salvia rounded-full px-2 py-0.5 text-[11px] font-semibold">
              {rotuloTipo[item.tipo]}
            </span>
          )}
          {andamento && <span className="text-ocre font-semibold">Em andamento</span>}
          <span>{item.fase}</span>
          {item.quantidade && item.quantidade !== '—' && <span>· {item.quantidade}</span>}
          {item.faixa_investimento !== '—' && <span>· {item.faixa_investimento}</span>}
          {item.links.length > 0 && <span>· {item.links.length} link{item.links.length > 1 ? 's' : ''}</span>}
        </div>
        {(feito || estimado != null) && (
          <div className="text-suave mt-1 text-xs">
            {feito && (
              <span className="text-salvia font-semibold">
                ✓ {item.feito_por ?? ''} {dataCurta(item.feito_em)}
              </span>
            )}
            {feito && item.preco_pago != null && <span> · pago {formatarBRL(item.preco_pago)}</span>}
            {!(feito && item.preco_pago != null) && estimado != null && (
              <span>
                {feito ? ' · ' : ''}~{formatarBRL(estimado)}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  )
}
