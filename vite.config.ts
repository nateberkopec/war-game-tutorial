import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => ({
  // Set base path based on build target:
  // - GitHub Pages (ghpages mode): /war-game-tutorial/
  // - itch.io (itchio mode): ./ (relative paths required)
  // - Development/local preview: /
  base: command === 'build'
    ? (mode === 'itchio' ? './' : mode === 'ghpages' ? '/war-game-tutorial/' : '/')
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
      input: {
        main: resolve(__dirname, 'index.html'),
        debug: resolve(__dirname, 'debug.html'),
      },
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
