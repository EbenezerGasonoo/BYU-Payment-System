import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    strictPort: false,
    hmr: {
      clientPort: 443 // For tunneling services
    },
    // Allow all hosts for tunneling (ngrok, localtunnel, etc.)
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok.io',
      '.loca.lt',
      'localhost',
      '192.168.100.9'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})

