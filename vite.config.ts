import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa'; // Importa VitePWA

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Abilita l'aggiornamento automatico del Service Worker
      outDir: 'dist', // Assicurati che corrisponda alla tua build output
      manifest: {
        // Queste sono le informazioni base per la tua Progressive Web App (PWA)
        // Personalizzale con i dettagli della tua app
        name: 'Manutenzioni App',
        short_name: 'MaintApp',
        description: 'La tua app per la gestione delle manutenzioni',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png', // Assicurati che questi file icona esistano nella tua cartella 'public'
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png', // Assicurati che questi file icona esistano nella tua cartella 'public'
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Opzioni di Workbox per il Service Worker generato
        clientsClaim: true, // Il nuovo SW prende immediatamente il controllo di tutte le schede
        skipWaiting: true,  // Il nuovo SW si attiva immediatamente
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'], // Quali file mettere in cache
        // Puoi aggiungere una blacklist se hai file che non vuoi che il SW gestisca, es.
        // exclude: ['**/api/**'], // Se il tuo SW deve ignorare le chiamate API
      },
      devOptions: {
        enabled: true, // Abilita il Service Worker in sviluppo per testarlo
        /*
        type: 'module', // Usa questa opzione se il tuo Service Worker è un modulo ES
        navigateFallback: 'index.html', // Per SPA: fallback a index.html per URL non trovati
        */
      },
      // Imposta a false se vuoi disabilitare il Service Worker per le builds di produzione
      // build: { enabled: true } 
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
      // Inoltra tutte le richieste che iniziano con /api al tuo server backend sulla porta 5000
      '/api': 'http://localhost:5000' 
    }
  }
})