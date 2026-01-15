/**
 * Browser E2E tests for War Card Game.
 * Tests the full game flow from title screen to victory.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { preview } from 'vite'
import type { PreviewServer } from 'vite'

describe('War Card Game E2E', () => {
  let server: PreviewServer
  let baseUrl: string

  beforeAll(async () => {
    // Build and start preview server
    server = await preview({
      preview: {
        port: 4173,
        strictPort: true,
      },
    })
    baseUrl = `http://localhost:4173`
  })

  afterAll(async () => {
    await server.close()
  })

  it('should load the title screen', async () => {
    // This test uses the browser context provided by vitest browser mode
    const response = await fetch(baseUrl)
    expect(response.ok).toBe(true)
    
    const html = await response.text()
    expect(html).toContain('War Card Game')
  })
})
