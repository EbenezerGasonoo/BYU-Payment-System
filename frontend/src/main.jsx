import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { register as registerServiceWorker, checkInstallability } from './registerServiceWorker'

// Register service worker for PWA (only in production)
// Disabled in dev to prevent refresh loops
if (import.meta.env.PROD && !import.meta.env.DEV) {
  registerServiceWorker();
}

// Check if app can be installed
checkInstallability();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

