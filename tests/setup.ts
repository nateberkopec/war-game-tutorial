import 'vitest-canvas-mock'
import { vi } from 'vitest'

// Mock localStorage for persistence tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

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
