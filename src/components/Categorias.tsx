import { useState } from 'react'
import { criarCategoria, excluirCategoria, renomearCategoria, reordenarCategorias } from '../data/store'
import { NAO_COMPRAR, type Categoria, type Item } from '../types'
import { IconLixo, IconMais, IconSetaBaixo, IconSetaCima, Sheet } from './ui'

export default function Categorias({
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
  const [nova, setNova] = useState('')
  const editaveis = categorias.filter((c) => c.nome !== NAO_COMPRAR)
  const falha = (e: Error) => alert(e.message)

  const mover = (idx: number, dir: -1 | 1) => {
    const lista = [...categorias]
    const a = categorias.indexOf(editaveis[idx])
    const b = categorias.indexOf(editaveis[idx + dir])
    if (b < 0) return
    ;[lista[a], lista[b]] = [lista[b], lista[a]]
    reordenarCategorias(lista).catch(falha)
  }

  const renomear = (c: Categoria) => {
    const nome = prompt('Novo nome da categoria', c.nome)?.trim()
    if (!nome || nome === c.nome) return
    if (categorias.some((x) => x.nome === nome)) return alert('Já existe uma categoria com esse nome.')
    renomearCategoria(c, nome, itens).catch(falha)
  }

  const excluir = (c: Categoria, qtd: number) => {
    if (qtd > 0) return alert(`"${c.nome}" tem ${qtd} itens. Mova ou exclua os itens antes.`)
    if (confirm(`Excluir a categoria "${c.nome}"?`)) excluirCategoria(c).catch(falha)
  }

  const adicionar = () => {
    const nome = nova.trim()
    if (!nome) return
    if (categorias.some((x) => x.nome === nome)) return alert('Já existe uma categoria com esse nome.')
    criarCategoria(nome, categorias.length ? Math.max(...categorias.map((c) => c.ordem)) + 1 : 0).catch(falha)
    setNova('')
  }

  return (
    <Sheet aberto={aberto} aoFechar={aoFechar} titulo="Categorias">
      <div className="bg-cartao border-linha divide-linha divide-y rounded-2xl border">
        {editaveis.map((c, i) => {
          const qtd = itens.filter((it) => it.categoria === c.nome).length
          return (
            <div key={c.id} className="flex items-center gap-1 py-1 pr-1 pl-3">
              <button onClick={() => renomear(c)} className="min-w-0 flex-1 py-2 text-left">
                <span className="font-semibold">{c.nome}</span> <span className="text-suave text-xs">· {qtd}</span>
              </button>
              <button onClick={() => mover(i, -1)} disabled={i === 0} className="text-suave p-2 disabled:opacity-30" aria-label="Subir">
                <IconSetaCima />
              </button>
              <button
                onClick={() => mover(i, 1)}
                disabled={i === editaveis.length - 1}
                className="text-suave p-2 disabled:opacity-30"
                aria-label="Descer"
              >
                <IconSetaBaixo />
              </button>
              <button onClick={() => excluir(c, qtd)} className="text-terracota p-2" aria-label="Excluir">
                <IconLixo />
              </button>
            </div>
          )
        })}
      </div>
      <p className="text-suave mt-2 text-xs">Toque no nome para renomear. Os itens são atualizados junto.</p>

      <div className="mt-5 flex gap-2">
        <input
          className="campo"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          placeholder="Nova categoria"
        />
        <button onClick={adicionar} className="bg-salvia shrink-0 rounded-xl px-4 text-white" aria-label="Adicionar">
          <IconMais className="h-5 w-5" />
        </button>
      </div>
    </Sheet>
  )
}
