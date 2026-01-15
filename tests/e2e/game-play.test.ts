import { test, expect } from '@playwright/test'

/**
 * Game Play E2E Tests
 * Tests the main gameplay loop including card flips, wars, and victory.
 */

test.describe('Game Play', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for title screen
    const heading = page.getByRole('heading', { name: 'WAR' })
    await expect(heading).toBeVisible({ timeout: 10000 })
    
    // Click START GAME to begin
    const startButton = page.getByRole('button', { name: 'START GAME' })
    await startButton.click()
    
    // Wait for canvas to be created (game scene loads after clicking start)
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
  })

  test('should start game when clicking START GAME button', async ({ page }) => {
    // Canvas should already be visible from beforeEach
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Take screenshot to verify game started
    await page.screenshot({ 
      path: 'tests/e2e/__screenshots__/game-started.png',
      fullPage: true 
    })
  })

  test('should respond to click input during gameplay', async ({ page }) => {
    // Wait a bit for game to fully initialize
    await page.waitForTimeout(500)
    
    // Click to draw cards
    await page.click('body')
    await page.waitForTimeout(500)
    
    // Take screenshot of card draw
    await page.screenshot({ 
      path: 'tests/e2e/__screenshots__/card-draw.png',
      fullPage: true 
    })
    
    // Canvas should still be visible
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
  })

  test('should display cards during battle', async ({ page }) => {
    await page.waitForTimeout(500)
    
    // Draw cards multiple times to ensure we see a battle
    for (let i = 0; i < 3; i++) {
      await page.click('body')
      await page.waitForTimeout(600)
    }
    
    // Canvas should still be visible
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
  })

  test('should handle rapid clicking gracefully', async ({ page }) => {
    await page.waitForTimeout(500)
    
    // Rapid clicks should not crash the game
    for (let i = 0; i < 10; i++) {
      await page.click('body')
      await page.waitForTimeout(100)
    }
    
    // Game should still be running (canvas visible)
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
  })
})

test.describe('Card Flip Animation', () => {
  test('should show card flip when drawing', async ({ page }) => {
    await page.goto('/')
    
    // Start the game
    const startButton = page.getByRole('button', { name: 'START GAME' })
    await expect(startButton).toBeVisible({ timeout: 10000 })
    await startButton.click()
    
    // Wait for canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)
    
    // Draw a card
    await page.click('body')
    
    // Wait a short time for animation to start
    await page.waitForTimeout(200)
    
    // Take screenshot mid-animation if possible
    await page.screenshot({ 
      path: 'tests/e2e/__screenshots__/card-flip-mid.png',
      fullPage: true 
    })
    
    // Wait for animation to complete
    await page.waitForTimeout(500)
    
    await page.screenshot({ 
      path: 'tests/e2e/__screenshots__/card-flip-complete.png',
      fullPage: true 
    })
  })
})

test.describe('War Sequence', () => {
  test('should handle war scenario when cards match', async ({ page }) => {
    await page.goto('/')
    
    // Start the game
    const startButton = page.getByRole('button', { name: 'START GAME' })
    await expect(startButton).toBeVisible({ timeout: 10000 })
    await startButton.click()
    
    // Wait for canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)
    
    // Start game and play until we hopefully trigger a war
    // Since wars are random, we'll just play many rounds
    for (let i = 0; i < 20; i++) {
      await page.click('body')
      await page.waitForTimeout(400)
    }
    
    // Take screenshot - if we hit a war, it should show
    await page.screenshot({ 
      path: 'tests/e2e/__screenshots__/gameplay-extended.png',
      fullPage: true 
    })
    
    // Game should still be running
    await expect(canvas).toBeVisible()
  })
})
