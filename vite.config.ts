import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
// import { VitePWA } from 'vite-plugin-pwa'; // Rimosso temporaneamente

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({ // Rimosso temporaneamente il plugin PWA
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     clientsClaim: true,
    //     skipWaiting: true,
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    //   },
    //   devOptions: {
    //     enabled: true,
    //   },
    // }),
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