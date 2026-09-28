import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/700.css'
import '@fontsource/poppins/700.css'
import App from './App.jsx'
import './styles.css'

// Vite sets BASE_URL from `base` in vite.config.js: "/" locally, and
// "/<repository-name>/" on GitHub Pages. The router needs the same prefix or
// every link on the deployed site points at the wrong place.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
)
