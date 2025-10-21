import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 5173,
    proxy: {
      // Inoltra tutte le richieste che iniziano con /api al tuo server backend sulla porta 5000
      '/api': 'http://localhost:5000' 
    }
  }
})