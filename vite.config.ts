import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      outDir: 'dist',
      filename: 'manifest.webmanifest', 
      base: '/', 
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
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: [
            '**/*.{js,css,html,ico,png,svg,json}', 
            'manifest.webmanifest',                
            'pwa-*.png',                           
            'sw.js' // <-- QUESTA RIGA DEVE ESSERE 'sw.js', È IL TUO SERVICE WORKER REALE.
        ],
        // globIgnores deve ignorare 'registerSW.js', non il manifest.
        globIgnores: [
            '**/node_modules/**/*',
            'registerSW.js',       // <-- AGGIUNTO: Ignora registerSW.js
            'workbox-*.js'         
        ],
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