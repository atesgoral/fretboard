import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import DesignLanguagePage from './DesignLanguagePage'
import './index.css'

const isDesignLanguagePage = window.location.pathname === '/design-language'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>{isDesignLanguagePage ? <DesignLanguagePage /> : <App />}</React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('Failed to register service worker:', error)
    })
  })
}
