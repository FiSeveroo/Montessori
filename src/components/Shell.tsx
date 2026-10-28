import { useCallback, useEffect, useState } from 'react'
import { signOut, type User } from 'firebase/auth'
import { auth } from '../firebase'
import { atualizarItem, carregarSeed, mudarStatus, useDados } from '../data/store'
import { sincronizarPresentes, usePresentes } from '../data/presentes'
import { lerPreco } from '../lib'
import { NAO_COMPRAR, type Item } from '../types'
import { Carregando } from '../App'
import AdicionarVarios from './AdicionarVarios'
import Categorias from './Categorias'
import GerenciarLista from './GerenciarLista'
import ItemSheet, { type Alvo } from './ItemSheet'
import Lista from './Lista'
import NaoComprar from './NaoComprar'
import Progresso from './Progresso'
import { IconGrafico, IconLista, IconMais, IconProibido, IconX } from './ui'

type Aba = 'lista' | 'progresso' | 'nao'

export default function Shell({ user }: { user: User }) {
  const { itens, categorias, carregando, erro } = useDados()
  const { presentes, carregando: carregandoPresentes } = usePresentes(false)
  const [aba, setAba] = useState<Aba>('lista')
  const [alvo, setAlvo] = useState<Alvo | null>(null)
  const [menu, setMenu] = useState(false)
  const [cats, setCats] = useState(false)
  const [varios, setVarios] = useState(false)
  const [lista, setLista] = useState(false)

  // Mantém a página pública (/presentes) em dia e traz as compras dos convidados para os itens.
  // As escritas aparecem no cache local na hora, então a próxima rodada já não vê diferença (sem laço).
  useEffect(() => {
    if (carregando || carregandoPresentes) return
    sincronizarPresentes(itens, presentes, categorias).catch((e) => console.error('Sincronização da lista de presentes:', e))
  }, [itens, presentes, categorias, carregando, carregandoPresentes])
  const [pedirPreco, setPedirPreco] = useState<Item | null>(null)
  const [semeando, setSemeando] = useState(false)

  const fechar = useCallback(() => setAlvo(null), [])
  const abrir = useCallback((i: Item) => setAlvo({ tipo: 'existente', id: i.id }), [])

  const marcar = (i: Item) => {
    const novo = i.status === 'Feito' ? 'Pendente' : 'Feito'
    mudarStatus(i, novo).catch((e) => alert(`Não foi possível salvar: ${e.message}`))
    if (novo === 'Feito' && i.preco_pago == null && i.faixa_investimento !== '—' && i.tipo !== 'Tarefa') setPedirPreco(i)
    else if (pedirPreco?.id === i.id) setPedirPreco(null)
  }

  const semear = async () => {
    setSemeando(true)
    try {
      await carregarSeed()
    } catch (e) {
      alert(`Erro ao carregar: ${(e as Error).message}`)
    } finally {
      setSemeando(false)
    }
  }

  const titulo = { lista: 'Enxoval', progresso: 'Progresso', nao: 'Não comprar' }[aba]
  const itemAberto = alvo?.tipo === 'existente' ? (itens.find((i) => i.id === alvo.id) ?? null) : null

  let conteudo: React.ReactNode
  if (erro) {
    conteudo = <p className="text-terracota py-12 text-center">Erro ao carregar dados: {erro}</p>
  } else if (carregando) {
    conteudo = <div className="py-20"><Carregando /></div>
  } else if (itens.length === 0 && categorias.length === 0) {
    conteudo = (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold">A lista está vazia</p>
        <p className="text-suave mt-1 text-sm">Carregar os 100 itens iniciais do enxoval Montessori?</p>
        <button
          onClick={semear}
          disabled={semeando}
          className="bg-salvia mt-6 rounded-full px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {semeando ? 'Carregando…' : 'Carregar itens iniciais'}
        </button>
      </div>
    )
  } else if (aba === 'lista') {
    conteudo = <Lista itens={itens} categorias={categorias} aoAbrir={abrir} aoMarcar={marcar} />
  } else if (aba === 'progresso') {
    conteudo = <Progresso itens={itens} categorias={categorias} />
  } else {
    conteudo = <NaoComprar itens={itens} categorias={categorias} aoAbrir={abrir} />
  }

  const novo = () =>
    setAlvo({
      tipo: 'novo',
      base: aba === 'nao' ? { tipo: 'Não comprar', categoria: NAO_COMPRAR, status: 'Decidido', faixa_investimento: '—' } : {},
    })

  return (
    <div className="mx-auto min-h-dvh max-w-2xl">
      <header className="pt-safe flex items-center justify-between px-4 pt-3">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <div className="relative">
          <button onClick={() => setMenu(!menu)} className="block rounded-full" aria-label="Menu">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="border-linha h-9 w-9 rounded-full border" referrerPolicy="no-referrer" />
            ) : (
              <span className="bg-salvia flex h-9 w-9 items-center justify-center rounded-full font-bold text-white">
                {(user.displayName ?? user.email ?? '?')[0]}
              </span>
            )}
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
              <div className="bg-cartao border-linha absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border shadow-lg">
                <div className="border-linha text-suave border-b px-4 py-3 text-xs">{user.email}</div>
                <button
                  onClick={() => {
                    setMenu(false)
                    setLista(true)
                  }}
                  className="w-full px-4 py-3 text-left font-semibold"
                >
                  🎁 Lista de presentes
                </button>
                <button
                  onClick={() => {
                    setMenu(false)
                    setVarios(true)
                  }}
                  className="w-full px-4 py-3 text-left"
                >
                  Adicionar vários itens
                </button>
                <button
                  onClick={() => {
                    setMenu(false)
                    setCats(true)
                  }}
                  className="w-full px-4 py-3 text-left"
                >
                  Editar categorias
                </button>
                <button onClick={() => signOut(auth)} className="text-terracota w-full px-4 py-3 text-left">
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="px-4 pb-32">{conteudo}</main>

      {!carregando && itens.length > 0 && aba !== 'progresso' && (
        <button
          onClick={novo}
          className="bg-terracota fixed right-5 bottom-24 z-20 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg active:scale-95"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Novo item"
        >
          <IconMais />
        </button>
      )}

      {pedirPreco && (
        <PrecoPago
          key={pedirPreco.id}
          item={pedirPreco}
          aoFechar={() => setPedirPreco(null)}
        />
      )}

      <nav className="bg-cartao/95 border-linha pb-safe fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          <BotaoAba ativo={aba === 'lista'} onClick={() => setAba('lista')} icone={<IconLista />} rotulo="Lista" />
          <BotaoAba ativo={aba === 'progresso'} onClick={() => setAba('progresso')} icone={<IconGrafico />} rotulo="Progresso" />
          <BotaoAba ativo={aba === 'nao'} onClick={() => setAba('nao')} icone={<IconProibido />} rotulo="Não comprar" />
        </div>
      </nav>

      {alvo && (
        <ItemSheet
          key={alvo.tipo === 'existente' ? alvo.id : 'novo'}
          alvo={alvo}
          item={itemAberto}
          presente={presentes.find((p) => p.id === itemAberto?.id)}
          categorias={categorias}
          aoFechar={fechar}
        />
      )}
      <GerenciarLista aberto={lista} aoFechar={() => setLista(false)} itens={itens} categorias={categorias} presentes={presentes} />
      <AdicionarVarios aberto={varios} aoFechar={() => setVarios(false)} categorias={categorias} itens={itens} />
      <Categorias aberto={cats} aoFechar={() => setCats(false)} categorias={categorias} itens={itens} />
    </div>
  )
}

function BotaoAba({
  ativo,
  onClick,
  icone,
  rotulo,
}: {
  ativo: boolean
  onClick: () => void
  icone: React.ReactNode
  rotulo: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${ativo ? 'text-salvia' : 'text-suave'}`}
    >
      {icone}
      {rotulo}
    </button>
  )
}

/** Depois de marcar uma compra como feita, pergunta quanto custou (para o total gasto). */
function PrecoPago({ item, aoFechar }: { item: Item; aoFechar: () => void }) {
  const [valor, setValor] = useState('')
  const salvar = () => {
    const v = lerPreco(valor)
    if (v != null) atualizarItem(item.id, { preco_pago: v }).catch((e) => alert(e.message))
    aoFechar()
  }
  return (
    <div className="fixed inset-x-3 bottom-20 z-30 mx-auto max-w-md" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="bg-cartao border-linha rounded-2xl border p-3 shadow-xl">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 text-sm">
            <b>Feito!</b> Quanto custou <span className="text-suave">{item.nome}</span>?
          </p>
          <button onClick={aoFechar} className="text-suave" aria-label="Pular">
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          <input
            className="campo"
            inputMode="decimal"
            placeholder="R$ 0,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && salvar()}
          />
          <button onClick={salvar} className="bg-salvia shrink-0 rounded-xl px-4 font-semibold text-white">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
