import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*', 'model/*'],
      manifest: {
        name: 'Root Facts React',
        short_name: 'RootFacts',
        description: 'Vegetable detection and fun facts',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,bin,wasm}'],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024
      }
    })
  ],
  server: {
    port: 3001,
    host: true
  }
});
