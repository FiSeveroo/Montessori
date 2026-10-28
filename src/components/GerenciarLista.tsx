import { useEffect, useMemo, useState } from 'react'
import { atualizarItem } from '../data/store'
import { CONFIG_PADRAO, esgotado, removerCompra, salvarConfigLista, useConfigLista } from '../data/presentes'
import { dataCurta } from '../lib'
import type { Categoria, Item, Presente } from '../types'
import { Sheet } from './ui'

export const LINK_LISTA = `${window.location.origin}/presentes`

export default function GerenciarLista({
  aberto,
  aoFechar,
  itens,
  categorias,
  presentes,
}: {
  aberto: boolean
  aoFechar: () => void
  itens: Item[]
  categorias: Categoria[]
  presentes: Presente[]
}) {
  const config = useConfigLista()
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [soNaLista, setSoNaLista] = useState(false)

  useEffect(() => {
    if (config && aberto) {
      setTitulo(config.titulo)
      setMensagem(config.mensagem)
    }
  }, [config, aberto])

  const porId = useMemo(() => new Map(presentes.map((p) => [p.id, p])), [presentes])
  const falha = (e: Error) => alert(e.message)

  // Só itens de compra entram na lista de presentes
  const candidatos = itens.filter((i) => i.tipo === 'Comprar')
  const grupos = categorias
    .map((c) => ({
      cat: c.nome,
      itens: candidatos
        .filter((i) => i.categoria === c.nome && (!soNaLista || i.na_lista))
        .sort((a, b) => (a.numero ?? 9999) - (b.numero ?? 9999)),
    }))
    .filter((g) => g.itens.length)

  const naLista = candidatos.filter((i) => i.na_lista)
  const presenteados = naLista.filter((i) => {
    const p = porId.get(i.id)
    return p && (p.multiplo ? p.compras.length > 0 : esgotado(p))
  }).length
  const semLink = naLista.filter((i) => i.links.length === 0).length

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(LINK_LISTA)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      prompt('Copie o link:', LINK_LISTA)
    }
  }
  const compartilhar = () =>
    navigator.share?.({ title: titulo || CONFIG_PADRAO.titulo, text: 'Nossa lista de presentes 💛', url: LINK_LISTA }).catch(() => {})

  const alternar = (i: Item) => atualizarItem(i.id, { na_lista: !i.na_lista }).catch(falha)
  const alternarMultiplo = (i: Item) => atualizarItem(i.id, { lista_multiplo: !i.lista_multiplo }).catch(falha)
  const marcarCategoria = (lista: Item[], valor: boolean) =>
    Promise.all(lista.filter((i) => !!i.na_lista !== valor).map((i) => atualizarItem(i.id, { na_lista: valor }))).catch(falha)

  return (
    <Sheet aberto={aberto} aoFechar={aoFechar} titulo="Lista de presentes">
      <div className="bg-salvia-claro mb-5 rounded-2xl p-4">
        <div className="text-salvia text-sm font-bold">Link para família e amigos</div>
        <div className="mt-1 truncate font-mono text-sm">{LINK_LISTA}</div>
        <div className="mt-3 flex gap-2">
          <button onClick={copiar} className="bg-salvia flex-1 rounded-full py-2 font-semibold text-white">
            {copiado ? 'Copiado!' : 'Copiar link'}
          </button>
          {'share' in navigator && (
            <button onClick={compartilhar} className="border-salvia text-salvia flex-1 rounded-full border py-2 font-semibold">
              Compartilhar
            </button>
          )}
          <a href={LINK_LISTA} target="_blank" rel="noopener" className="border-salvia text-salvia rounded-full border px-4 py-2 font-semibold">
            Ver
          </a>
        </div>
        <p className="text-suave mt-3 text-xs leading-relaxed">
          Quem abrir o link vê só os itens marcados abaixo, sem login e sem acesso à lista de vocês.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3">
        <label>
          <span className="rotulo">Título da página</span>
          <input className="campo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>
        <label>
          <span className="rotulo">Mensagem para os convidados</span>
          <textarea className="campo" rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        </label>
        {config && (titulo !== config.titulo || mensagem !== config.mensagem) && (
          <button
            onClick={() => salvarConfigLista({ titulo, mensagem }).catch(falha)}
            className="bg-salvia rounded-full py-2.5 font-semibold text-white"
          >
            Salvar título e mensagem
          </button>
        )}
      </div>

      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <div className="font-bold">
            {naLista.length} itens na lista · {presenteados} presenteados
          </div>
          {semLink > 0 && <div className="text-ocre text-xs">{semLink} sem link de compra ainda</div>}
        </div>
        <button onClick={() => setSoNaLista(!soNaLista)} className="text-salvia shrink-0 text-sm font-semibold">
          {soNaLista ? 'Ver todos' : 'Só os da lista'}
        </button>
      </div>

      {grupos.map((g) => {
        const todos = g.itens.every((i) => i.na_lista)
        return (
          <section key={g.cat} className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-suave text-sm font-bold tracking-wide uppercase">{g.cat}</h3>
              <button onClick={() => marcarCategoria(g.itens, !todos)} className="text-salvia text-xs font-semibold">
                {todos ? 'Tirar todos' : 'Incluir todos'}
              </button>
            </div>
            <div className="bg-cartao border-linha divide-linha divide-y rounded-2xl border">
              {g.itens.map((i) => (
                <Linha
                  key={i.id}
                  item={i}
                  presente={porId.get(i.id)}
                  aoAlternar={() => alternar(i)}
                  aoAlternarMultiplo={() => alternarMultiplo(i)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </Sheet>
  )
}

function Linha({
  item,
  presente,
  aoAlternar,
  aoAlternarMultiplo,
}: {
  item: Item
  presente?: Presente
  aoAlternar: () => void
  aoAlternarMultiplo: () => void
}) {
  const compras = presente?.compras ?? []
  return (
    <div className="px-3 py-2.5">
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={!!item.na_lista} onChange={aoAlternar} className="accent-salvia mt-1 h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className={`font-semibold ${item.status === 'Feito' && !compras.length ? 'text-suave line-through' : ''}`}>
            {item.nome}
          </span>
          {item.na_lista && item.links.length === 0 && <span className="text-ocre ml-1 text-xs">· sem link</span>}
        </span>
      </label>
      {item.na_lista && (
        <label className="text-suave mt-1 ml-8 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={!!item.lista_multiplo} onChange={aoAlternarMultiplo} className="accent-salvia" />
          Várias pessoas podem dar (ex.: fraldas)
        </label>
      )}
      {presente && compras.length > 0 && <Compras presente={presente} />}
    </div>
  )
}

/** Quem comprou, com opção de desfazer marcação feita por engano. */
export function Compras({ presente, recuo = true }: { presente: Presente; recuo?: boolean }) {
  return (
    <ul className={`mt-2 flex flex-col gap-1.5 ${recuo ? 'ml-8' : ''}`}>
      {presente.compras.map((c, idx) => (
        <li key={idx} className="bg-salvia-claro rounded-xl px-3 py-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="min-w-0 flex-1">
              🎁 <b>{c.nome}</b> <span className="text-suave">· {c.forma === 'link' ? 'pelo link' : 'em outra loja'} · {dataCurta(c.quando)}</span>
            </span>
            <button
              onClick={() => {
                if (confirm(`Desfazer a marcação de ${c.nome}? O item volta a ficar disponível na lista.`))
                  removerCompra(presente, idx).catch((e) => alert(e.message))
              }}
              className="text-terracota shrink-0 text-xs font-semibold"
            >
              Desfazer
            </button>
          </div>
          {c.mensagem && <p className="mt-1 italic">“{c.mensagem}”</p>}
        </li>
      ))}
    </ul>
  )
}
