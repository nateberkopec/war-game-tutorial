import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => ({
  // Set base path based on build target:
  // - GitHub Pages: /war-game-tutorial/
  // - itch.io: ./ (relative)
  // - Development: /
  base: command === 'build' 
    ? (mode === 'itchio' ? './' : '/war-game-tutorial/') 
    : '/',
  resolve: {
    alias: {
      '@engine': resolve(__dirname, 'src/engine'),
      '@persistence': resolve(__dirname, 'src/persistence'),
      '@ui': resolve(__dirname, 'src/ui'),
    },
  },
  build: {
    // Increase warning limit for Three.js bundle (expected to be ~500KB)
    chunkSizeWarningLimit: 600,
    // Single bundle for itch.io distribution
    rollupOptions: {
      output: {
        // Keep as single bundle - required for itch.io HTML5 games
        manualChunks: undefined,
      },
    },
    // Use esbuild for minification (faster than terser, good compression)
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    open: true,
  },
}))
