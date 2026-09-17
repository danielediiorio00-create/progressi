import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
// Font geometrico self-hosted: nessuna richiesta a server esterni.
import '@fontsource-variable/outfit'
import './styles/theme.css'
import './styles/global.css'
import App from './App'

// HashRouter (URL tipo /#/corsa): funziona su GitHub Pages senza
// configurazioni lato server e mantiene la pagina anche ricaricando.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
