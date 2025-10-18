import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { register as registerServiceWorker, checkInstallability } from './registerServiceWorker'

// Register service worker for PWA
if (import.meta.env.PROD) {
  registerServiceWorker();
}

// Check if app can be installed
checkInstallability();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

