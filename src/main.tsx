import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ListaPublica from './components/ListaPublica'

// /presentes é a página dos convidados: sem login e sem acesso à lista interna
const publica = window.location.pathname.replace(/\/+$/, '') === '/presentes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{publica ? <ListaPublica /> : <App />}</StrictMode>,
)
