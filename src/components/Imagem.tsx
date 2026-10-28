import { useRef, useState } from 'react'

const LADO_MAX = 640

/**
 * Reduz a foto para no máximo 640px e devolve um data URL leve (~20–60 kB), que cabe no próprio
 * documento do Firestore — assim não precisamos do Firebase Storage (que exige plano pago).
 * Safari não gera WebP pelo canvas; nesse caso cai para JPEG.
 */
export async function comprimirImagem(arquivo: File): Promise<string> {
  const bitmap = await createImageBitmap(arquivo)
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff' // PNG transparente vira fundo branco em vez de preto no JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const webp = canvas.toDataURL('image/webp', 0.75)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.8)
}

/** Foto do item, com um quadro neutro quando não há imagem ou o link quebra. */
export function FotoItem({ src, alt, className = '' }: { src?: string | null; alt: string; className?: string }) {
  const [falhou, setFalhou] = useState(false)
  if (!src || falhou) {
    return (
      <div className={`bg-linha/60 text-suave flex items-center justify-center ${className}`} aria-hidden>
        <svg viewBox="0 0 24 24" className="h-1/3 w-1/3 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="8" width="18" height="13" rx="2" />
          <path d="M12 8v13M3 12h18M12 8c-1.5-3-5-3-5-1s3 1 5 1zm0 0c1.5-3 5-3 5-1s-3 1-5 1z" />
        </svg>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFalhou(true)}
      className={`bg-white object-contain ${className}`}
    />
  )
}

/** Campo do formulário: escolher foto da galeria/câmera ou colar o link da imagem da loja. */
export function CampoImagem({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const ehLink = /^https?:\/\//i.test(valor)

  const escolher = async (f: File | undefined) => {
    if (!f) return
    setProcessando(true)
    setErro(null)
    try {
      aoMudar(await comprimirImagem(f))
    } catch {
      setErro('Não foi possível ler essa imagem.')
    } finally {
      setProcessando(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
      <div className="rotulo">Imagem</div>
      <div className="flex gap-3">
        <FotoItem src={valor} alt="" className="border-linha h-24 w-24 shrink-0 rounded-xl border" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={processando}
            className="border-linha bg-cartao text-salvia rounded-xl border py-2 text-sm font-semibold"
          >
            {processando ? 'Processando…' : valor ? 'Trocar foto' : 'Escolher foto'}
          </button>
          <input
            className="campo text-sm!"
            value={ehLink ? valor : ''}
            onChange={(e) => aoMudar(e.target.value.trim())}
            placeholder="ou cole o link da imagem"
            inputMode="url"
          />
          {valor && (
            <button type="button" onClick={() => aoMudar('')} className="text-terracota self-start text-xs font-semibold">
              Remover imagem
            </button>
          )}
        </div>
      </div>
      {erro && <p className="text-terracota mt-1 text-xs">{erro}</p>}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => escolher(e.target.files?.[0])} />
      <p className="text-suave mt-1 text-xs">
        Dica: na página da loja, toque e segure na foto do produto → "Copiar endereço da imagem" e cole aqui.
      </p>
    </div>
  )
}
