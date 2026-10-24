import { useEffect, useState } from 'react'
import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, configurado, db, googleProvider } from './firebase'
import Shell from './components/Shell'

type Acesso = 'verificando' | 'permitido' | 'negado'

const instalado =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [acesso, setAcesso] = useState<Acesso>('verificando')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!configurado) return
    getRedirectResult(auth).catch((e) => setErro(e.message))
    return onAuthStateChanged(auth, setUser)
  }, [])

  useEffect(() => {
    if (!user?.email) return
    setAcesso('verificando')
    getDoc(doc(db, 'acesso', user.email))
      .then((d) => setAcesso(d.exists() ? 'permitido' : 'negado'))
      .catch(() => setAcesso('negado'))
  }, [user])

  if (!configurado) {
    return (
      <Centro>
        <h1 className="text-xl font-bold">Falta configurar o Firebase</h1>
        <p className="text-suave mt-2 text-sm">
          Preencha o arquivo <code>.env</code> com a configuração web do projeto (veja o README).
        </p>
      </Centro>
    )
  }

  if (user === undefined) return <Centro><Carregando /></Centro>

  if (!user) {
    const entrar = async () => {
      setErro(null)
      try {
        // No app instalado (tela inicial), popup não funciona bem, principalmente no iPhone.
        if (instalado) await signInWithRedirect(auth, googleProvider)
        else await signInWithPopup(auth, googleProvider)
      } catch (e) {
        const code = (e as { code?: string }).code
        if (code === 'auth/popup-blocked') await signInWithRedirect(auth, googleProvider)
        else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request')
          setErro((e as Error).message)
      }
    }
    return (
      <Centro>
        <img src="/favicon.svg" alt="" className="mx-auto h-24 w-24" />
        <h1 className="mt-4 text-2xl font-bold">Enxoval Montessori</h1>
        <p className="text-suave mt-1">Preparando a casa para a nossa bebê</p>
        <button
          onClick={entrar}
          className="bg-cartao border-linha mt-8 inline-flex items-center gap-3 rounded-full border px-6 py-3 font-semibold shadow-sm active:scale-95"
        >
          <GoogleG /> Entrar com Google
        </button>
        {erro && <p className="text-terracota mt-4 text-sm">{erro}</p>}
      </Centro>
    )
  }

  if (acesso === 'verificando') return <Centro><Carregando /></Centro>

  if (acesso === 'negado') {
    return (
      <Centro>
        <h1 className="text-xl font-bold">Sem acesso</h1>
        <p className="text-suave mt-2 text-sm">
          A conta <b>{user.email}</b> ainda não está liberada. Peça para adicioná-la na coleção <code>acesso</code> do
          Firestore.
        </p>
        <button onClick={() => signOut(auth)} className="text-salvia mt-6 font-semibold">
          Entrar com outra conta
        </button>
      </Centro>
    )
  }

  return <Shell user={user} />
}

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-8 text-center">
      <div className="max-w-sm">{children}</div>
    </div>
  )
}

export function Carregando() {
  return <div className="border-linha border-t-salvia mx-auto h-8 w-8 animate-spin rounded-full border-4" />
}

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
