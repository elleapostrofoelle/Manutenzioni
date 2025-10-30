import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa'; // Importa VitePWA

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ // Riattivato il plugin PWA
      registerType: 'autoUpdate',
      outDir: 'dist',
      manifest: {
        name: 'Manutenzioni App',
        short_name: 'MaintApp',
        description: 'La tua app per la gestione delle manutenzioni',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Aggiungi queste opzioni per controllare il nome e il percorso del manifest
        fileName: 'manifest.webmanifest', // Nome fisso del file manifest
        base: '/', // Assicura che il percorso sia relativo alla root
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'], // Aggiunto .webmanifest
      },
      devOptions: {
        enabled: true,
      }
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000' 
    }
  }
})