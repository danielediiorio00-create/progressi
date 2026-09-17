import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Su GitHub Pages il sito vive in https://<utente>.github.io/<repo>/ .
// Quando la build gira dentro GitHub Actions il percorso base viene ricavato
// dal nome del repository; in locale resta "/". Nessuna configurazione manuale.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_ACTIONS && repo && !repo.endsWith('.github.io') ? `/${repo}/` : '/'

// Versione mostrata nelle impostazioni (presa da package.json).
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*'],
      manifest: {
        name: 'Progressi',
        short_name: 'Progressi',
        description: 'Diario personale di corsa, palestra e metriche corporee.',
        lang: 'it',
        theme_color: '#EFE7DF',
        background_color: '#EFE7DF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tutto il necessario viene messo in cache all'installazione: l'app funziona offline.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
      },
    }),
  ],
})
