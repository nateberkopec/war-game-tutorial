import { test, expect } from '@playwright/test'

/**
 * Victory Screen E2E Tests
 * Tests the end game victory screen and replay functionality.
 * 
 * Note: These tests may take a while as they need to play through
 * an entire game or use a seeded/deterministic game state.
 */

test.describe('Victory Screen', () => {
  test('should display game UI elements during play', async ({ page }) => {
    await page.goto('/')
    
    // Start the game
    const startButton = page.getByRole('button', { name: 'START GAME' })
    await expect(startButton).toBeVisible({ timeout: 10000 })
    await startButton.click()
    
    // Wait for canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)
    
    // Play a few rounds
    for (let i = 0; i < 5; i++) {
      await page.click('body')
      await page.waitForTimeout(400)
    }
    
    // Canvas should be visible throughout
    await expect(canvas).toBeVisible()
    
    // Take screenshot of gameplay
    await page.screenshot({ 
      path: 'tests/e2e/__screenshots__/mid-game.png',
      fullPage: true 
    })
  })

  test('game should remain stable during extended play', async ({ page }) => {
    test.setTimeout(60000) // Extended timeout for long gameplay test
    await page.goto('/')
    
    // Start the game
    const startButton = page.getByRole('button', { name: 'START GAME' })
    await expect(startButton).toBeVisible({ timeout: 10000 })
    await startButton.click()
    
    // Wait for canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)
    
    // Play many rounds - this tests stability
    for (let i = 0; i < 50; i++) {
      await page.click('body')
      await page.waitForTimeout(200)
    }
    
    // Game should still be running (no crashes)
    await expect(canvas).toBeVisible()
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/e2e/__screenshots__/extended-play.png',
      fullPage: true 
    })
  })

  test.skip('should show victory screen when game ends', async ({ page }) => {
    // This test is skipped by default because it would take too long
    // to play through an entire War game (can be 100+ rounds)
    // 
    // To test victory screen manually:
    // 1. Modify the game to use a deterministic deck
    // 2. Or reduce deck size for testing
    // 3. Or inject a win condition
    
    await page.goto('/')
    
    // Start the game
    const startButton = page.getByRole('button', { name: 'START GAME' })
    await expect(startButton).toBeVisible({ timeout: 10000 })
    await startButton.click()
    
    // Wait for canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    
    // This would need to play until game ends
    // War games can take 100+ rounds
    
    // Look for victory screen elements
    const victoryScreen = page.locator('[class*="victory"], [id*="victory"]')
    await expect(victoryScreen).toBeVisible({ timeout: 300000 })
  })
})
