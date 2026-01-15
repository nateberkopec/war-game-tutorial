import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
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
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
