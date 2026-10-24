import { useEffect, type ReactNode } from 'react'

/** Painel que sobe de baixo (tela cheia no celular, centralizado no computador). */
export function Sheet({
  aberto,
  aoFechar,
  titulo,
  children,
  rodape,
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: ReactNode
  children: ReactNode
  rodape?: ReactNode
}) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', esc)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = overflow
    }
  }, [aberto, aoFechar])

  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/35" onClick={aoFechar} />
      <div className="bg-fundo pt-safe relative flex max-h-[94dvh] w-full max-w-lg flex-col rounded-t-3xl shadow-xl sm:rounded-3xl">
        <div className="border-linha flex items-center gap-2 border-b px-4 py-3">
          <div className="min-w-0 flex-1 text-lg font-bold">{titulo}</div>
          <button onClick={aoFechar} className="text-suave -mr-2 rounded-full p-2" aria-label="Fechar">
            <IconX />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {rodape && <div className="border-linha pb-safe border-t px-4 pt-3 pb-3">{rodape}</div>}
      </div>
    </div>
  )
}

export function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        ativo ? 'border-salvia bg-salvia font-semibold text-white' : 'border-linha bg-cartao text-tinta'
      }`}
    >
      {children}
    </button>
  )
}

export function Segmentado<T extends string>({
  opcoes,
  valor,
  aoMudar,
}: {
  opcoes: readonly T[]
  valor: T
  aoMudar: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <Chip key={o} ativo={o === valor} onClick={() => aoMudar(o)}>
          {o}
        </Chip>
      ))}
    </div>
  )
}

export function Barra({ valor, cor = 'bg-salvia' }: { valor: number; cor?: string }) {
  return (
    <div className="bg-linha h-2 w-full overflow-hidden rounded-full">
      <div className={`${cor} h-full rounded-full transition-all`} style={{ width: `${Math.round(valor * 100)}%` }} />
    </div>
  )
}

const corPrioridade: Record<string, string> = {
  Essencial: 'bg-terracota-claro text-terracota',
  Recomendado: 'bg-ocre-claro text-ocre',
  Opcional: 'bg-linha text-suave',
}

export function SeloPrioridade({ p }: { p: string }) {
  if (!corPrioridade[p]) return null
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${corPrioridade[p]}`}>{p}</span>
}

// ---------- Ícones (traço simples) ----------

type P = { className?: string }
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const IconX = ({ className = 'h-5 w-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const IconCheck = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={3}><path d="M20 6 9 17l-5-5" /></svg>
)
export const IconLista = ({ className = 'h-6 w-6' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>
)
export const IconGrafico = ({ className = 'h-6 w-6' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
)
export const IconProibido = ({ className = 'h-6 w-6' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></svg>
)
export const IconMais = ({ className = 'h-6 w-6' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M12 5v14M5 12h14" /></svg>
)
export const IconFiltro = ({ className = 'h-5 w-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M3 5h18M6 12h12M10 19h4" /></svg>
)
export const IconBusca = ({ className = 'h-5 w-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
)
export const IconLink = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
)
export const IconLivro = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></svg>
)
export const IconLixo = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
)
export const IconSetaCima = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="m18 15-6-6-6 6" /></svg>
)
export const IconSetaBaixo = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="m6 9 6 6 6-6" /></svg>
)
