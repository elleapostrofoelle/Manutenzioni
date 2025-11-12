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
      // filename: 'manifest.webmanifest', 
      // Rimuovere base qui, è già nel defineConfig
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
            'sw.js' 
        ],
        globIgnores: [
            '**/node_modules/**/*',
            'registerSW.js',       
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