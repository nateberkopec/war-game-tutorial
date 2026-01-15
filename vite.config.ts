import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
  // Set base path for GitHub Pages deployment
  base: command === 'build' ? '/war-game-tutorial/' : '/',
  resolve: {
    alias: {
      '@engine': resolve(__dirname, 'src/engine'),
      '@persistence': resolve(__dirname, 'src/persistence'),
      '@ui': resolve(__dirname, 'src/ui'),
    },
  },
  build: {
    // Single bundle for itch.io distribution
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        debug: resolve(__dirname, 'debug.html'),
      },
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
}))
