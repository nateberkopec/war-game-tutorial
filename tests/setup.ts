import 'vitest-canvas-mock'
import { vi } from 'vitest'

// Mock Three.js WebGLRenderer for any tests that import UI code
vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual,
    WebGLRenderer: vi.fn(() => ({
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      render: vi.fn(),
      setPixelRatio: vi.fn(),
      dispose: vi.fn(),
    })),
  }
})
