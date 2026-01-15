import { test, expect } from '@playwright/test'

/**
 * Title Screen E2E Tests
 * Tests the initial loading and title screen of War Card Game.
 */

test.describe('Title Screen', () => {
  test('should load the game page', async ({ page }) => {
    await page.goto('/')
    
    // Page should have correct title
    await expect(page).toHaveTitle('War Card Game')
  })

  test('should display title screen with WAR heading', async ({ page }) => {
    await page.goto('/')
    
    // The title screen should display the WAR heading
    const heading = page.getByRole('heading', { name: 'WAR' })
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('should show title screen after loading', async ({ page }) => {
    await page.goto('/')
    
    // Wait for title screen to appear
    const heading = page.getByRole('heading', { name: 'WAR' })
    await expect(heading).toBeVisible({ timeout: 10000 })
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'tests/e2e/__screenshots__/title-screen.png',
      fullPage: true 
    })
  })

  test('should have player name input fields on title screen', async ({ page }) => {
    await page.goto('/')
    
    // Wait for title screen
    const heading = page.getByRole('heading', { name: 'WAR' })
    await expect(heading).toBeVisible({ timeout: 10000 })
    
    // The title screen should have input fields for player names
    const player1Input = page.getByRole('textbox', { name: 'Player 1' })
    const player2Input = page.getByRole('textbox', { name: 'Player 2' })
    
    await expect(player1Input).toBeVisible()
    await expect(player2Input).toBeVisible()
  })

  test('should have a START GAME button', async ({ page }) => {
    await page.goto('/')
    
    // Wait for title screen
    const heading = page.getByRole('heading', { name: 'WAR' })
    await expect(heading).toBeVisible({ timeout: 10000 })
    
    // Should have the START GAME button
    const startButton = page.getByRole('button', { name: 'START GAME' })
    await expect(startButton).toBeVisible()
  })

  test('should allow entering player names', async ({ page }) => {
    await page.goto('/')
    
    // Wait for title screen
    const heading = page.getByRole('heading', { name: 'WAR' })
    await expect(heading).toBeVisible({ timeout: 10000 })
    
    // Fill in custom player names
    const player1Input = page.getByRole('textbox', { name: 'Player 1' })
    const player2Input = page.getByRole('textbox', { name: 'Player 2' })
    
    await player1Input.fill('Alice')
    await player2Input.fill('Bob')
    
    // Verify the values
    await expect(player1Input).toHaveValue('Alice')
    await expect(player2Input).toHaveValue('Bob')
  })
})
