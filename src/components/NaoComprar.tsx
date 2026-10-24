import { useState } from 'react'
import { moverParaListaAtiva } from '../data/store'
import { FASES, PRIORIDADES, TIPOS, type Categoria, type Item, type Tipo } from '../types'
import { IconLivro, Sheet } from './ui'

export default function NaoComprar({
  itens,
  categorias,
  aoAbrir,
}: {
  itens: Item[]
  categorias: Categoria[]
  aoAbrir: (i: Item) => void
}) {
  const lista = itens.filter((i) => i.tipo === 'Não comprar').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const [movendo, setMovendo] = useState<Item | null>(null)

  return (
    <div className="pt-2">
      <p className="text-suave mb-4 text-sm leading-relaxed">
        Coisas que decidimos <b>não</b> comprar, com o motivo. Útil para responder a presentes e sugestões. Ficam fora
        do progresso e dos gastos.
      </p>
      <div className="flex flex-col gap-2">
        {lista.map((i) => (
          <div key={i.id} className="bg-cartao border-linha rounded-2xl border p-3">
            <button onClick={() => aoAbrir(i)} className="w-full text-left">
              <div className="font-semibold">{i.nome}</div>
              {i.nota && <p className="mt-1 text-sm leading-snug">{i.nota}</p>}
              {i.fonte && (
                <p className="text-suave mt-1.5 flex items-center gap-1 text-xs italic">
                  <IconLivro className="h-3.5 w-3.5" /> {i.fonte}
                </p>
              )}
            </button>
            <div className="mt-2 flex justify-end">
              <button onClick={() => setMovendo(i)} className="text-salvia text-sm font-semibold">
                Mudamos de ideia → lista ativa
              </button>
            </div>
          </div>
        ))}
        {lista.length === 0 && <p className="text-suave py-12 text-center">Nada aqui ainda.</p>}
      </div>

      {movendo && <MoverSheet item={movendo} categorias={categorias} aoFechar={() => setMovendo(null)} />}
    </div>
  )
}

function MoverSheet({ item, categorias, aoFechar }: { item: Item; categorias: Categoria[]; aoFechar: () => void }) {
  const ativas = categorias.filter((c) => c.nome !== 'Não comprar')
  const [categoria, setCategoria] = useState(
    item.categoria_anterior && ativas.some((c) => c.nome === item.categoria_anterior)
      ? item.categoria_anterior
      : (ativas[0]?.nome ?? ''),
  )
  const [tipo, setTipo] = useState<Tipo>('Comprar')
  const [fase, setFase] = useState<string>('Antes do nascimento')
  const [prioridade, setPrioridade] = useState<string>('Recomendado')

  const mover = () => {
    moverParaListaAtiva(item, { categoria, tipo, fase, prioridade }).catch((e) => alert(e.message))
    aoFechar()
  }

  return (
    <Sheet
      aberto
      aoFechar={aoFechar}
      titulo="Mover para a lista ativa"
      rodape={
        <button onClick={mover} className="bg-salvia w-full rounded-full py-3 font-semibold text-white">
          Mover
        </button>
      }
    >
      <p className="mb-4 font-semibold">{item.nome}</p>
      <div className="flex flex-col gap-3">
        <Campo rotulo="Categoria" valor={categoria} opcoes={ativas.map((c) => c.nome)} aoMudar={setCategoria} />
        <Campo
          rotulo="Tipo"
          valor={tipo}
          opcoes={TIPOS.filter((t) => t !== 'Não comprar')}
          aoMudar={(v) => setTipo(v as Tipo)}
        />
        <Campo rotulo="Fase" valor={fase} opcoes={FASES} aoMudar={setFase} />
        <Campo rotulo="Prioridade" valor={prioridade} opcoes={PRIORIDADES} aoMudar={setPrioridade} />
      </div>
    </Sheet>
  )
}

function Campo({
  rotulo,
  valor,
  opcoes,
  aoMudar,
}: {
  rotulo: string
  valor: string
  opcoes: readonly string[]
  aoMudar: (v: string) => void
}) {
  return (
    <div>
      <label className="rotulo">{rotulo}</label>
      <select className="campo" value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {opcoes.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
