import { useMemo, useState } from 'react'
import { criarItens } from '../data/store'
import { FAIXA_DESCRICAO, FAIXAS, FASES, NAO_COMPRAR, PRIORIDADES, TIPOS, type Categoria, type Item, type Tipo } from '../types'
import { Segmentado, Sheet } from './ui'

/**
 * Uma linha por item. O que vem depois do primeiro ". " vira nota:
 * "Kit marmita vegetariana. Dica: Sabor Caseiro" → nome "Kit marmita vegetariana", nota "Dica: Sabor Caseiro".
 * Marcadores de lista (*, •, -, 1.) e caracteres invisíveis colados de apps de mensagem são ignorados.
 */
export function lerLinhas(texto: string): { nome: string; nota: string }[] {
  return texto
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/[⁠​‌‍﻿]/g, '')
        .replace(/^\s*(?:[*•\-–]|\d+[.)])\s*/, '')
        .trim(),
    )
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.+?)\.\s+(.+)$/)
      return m ? { nome: m[1].trim(), nota: m[2].trim() } : { nome: l.replace(/\.$/, ''), nota: '' }
    })
}

export default function AdicionarVarios({
  aberto,
  aoFechar,
  categorias,
  itens,
}: {
  aberto: boolean
  aoFechar: () => void
  categorias: Categoria[]
  itens: Item[]
}) {
  const ativas = categorias.filter((c) => c.nome !== NAO_COMPRAR)
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [tipo, setTipo] = useState<Tipo>('Comprar')
  const [fase, setFase] = useState<string>('Antes do nascimento')
  const [prioridade, setPrioridade] = useState<string>('Recomendado')
  const [faixa, setFaixa] = useState<string>('$')
  const [fonte, setFonte] = useState('')
  const [salvando, setSalvando] = useState(false)

  const linhas = useMemo(() => lerLinhas(texto), [texto])
  const naoComprar = tipo === NAO_COMPRAR
  const cat = naoComprar ? NAO_COMPRAR : categoria || ativas[0]?.nome || ''

  const adicionar = async () => {
    if (!linhas.length || !cat) return
    setSalvando(true)
    const proximo = Math.max(0, ...itens.map((i) => i.numero ?? 0)) + 1
    try {
      await criarItens(
        linhas.map((l, i) => ({
          numero: proximo + i,
          nome: l.nome,
          nota: l.nota,
          categoria: cat,
          tipo,
          fase: naoComprar ? '—' : fase,
          prioridade: naoComprar ? '—' : prioridade,
          faixa_investimento: naoComprar ? '—' : faixa,
          quantidade: '—',
          fonte: fonte.trim(),
          preco_estimado: null,
          preco_pago: null,
          links: [],
          status: naoComprar ? 'Decidido' : 'Pendente',
          categoria_anterior: null,
        })),
      )
      setTexto('')
      aoFechar()
    } catch (e) {
      alert(`Não foi possível adicionar: ${(e as Error).message}`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Sheet
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Adicionar vários itens"
      rodape={
        <button
          onClick={adicionar}
          disabled={!linhas.length || salvando}
          className="bg-salvia w-full rounded-full py-3 font-semibold text-white disabled:opacity-50"
        >
          {salvando ? 'Adicionando…' : `Adicionar ${linhas.length} ${linhas.length === 1 ? 'item' : 'itens'}`}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <label>
          <span className="rotulo">Um item por linha (o que vier depois do primeiro ponto vira nota)</span>
          <textarea
            className="campo"
            rows={7}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={'Absorventes de seio\nRoupas de amamentação. Tamanho G'}
          />
        </label>

        <div>
          <div className="rotulo">Tipo (para todos)</div>
          <Segmentado opcoes={TIPOS} valor={tipo} aoMudar={setTipo} />
        </div>

        {!naoComprar && (
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2">
              <span className="rotulo">Categoria</span>
              <select className="campo" value={cat} onChange={(e) => setCategoria(e.target.value)}>
                {ativas.map((c) => (
                  <option key={c.id}>{c.nome}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="rotulo">Fase</span>
              <select className="campo" value={fase} onChange={(e) => setFase(e.target.value)}>
                {FASES.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="rotulo">Prioridade</span>
              <select className="campo" value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                {PRIORIDADES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="rotulo">Faixa</span>
              <select className="campo" value={faixa} onChange={(e) => setFaixa(e.target.value)}>
                {FAIXAS.map((f) => (
                  <option key={f} value={f}>
                    {f} {FAIXA_DESCRICAO[f]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="rotulo">Fonte</span>
              <input className="campo" value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="opcional" />
            </label>
          </div>
        )}

        {linhas.length > 0 && (
          <div>
            <div className="rotulo">Prévia</div>
            <ul className="bg-cartao border-linha divide-linha divide-y rounded-2xl border">
              {linhas.map((l, i) => (
                <li key={i} className="px-3 py-2">
                  <div className="font-semibold">{l.nome}</div>
                  {l.nota && <div className="text-suave text-sm">{l.nota}</div>}
                </li>
              ))}
            </ul>
            <p className="text-suave mt-2 text-xs">Depois dá para ajustar cada item (prioridade, preço, links) individualmente.</p>
          </div>
        )}
      </div>
    </Sheet>
  )
}
