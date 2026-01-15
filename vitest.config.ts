import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@engine': resolve(__dirname, 'src/engine'),
      '@persistence': resolve(__dirname, 'src/persistence'),
      '@ui': resolve(__dirname, 'src/ui'),
    },
  },
  test: {
    // Unit & integration tests
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],

    // Coverage
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/persistence/**'],
    },
  },
})
