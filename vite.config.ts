import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Esta linha injeta a variável de ambiente do servidor de build (Netlify)
    // no código do cliente, permitindo que a API do Gemini seja inicializada corretamente.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})
