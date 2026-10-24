import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // o SDK do Firebase sozinho passa de 500 kB; ~275 kB gzip no total é ok
  build: { chunkSizeWarningLimit: 1200 },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Enxoval Montessori',
        short_name: 'Enxoval',
        description: 'Enxoval e preparação da casa para a chegada da bebê',
        lang: 'pt-BR',
        theme_color: '#f7f3ec',
        background_color: '#f7f3ec',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // As rotas /__/auth/* são do Firebase Auth e não podem cair no fallback do SPA
        navigateFallbackDenylist: [/^\/__\//],
      },
    }),
  ],
})
