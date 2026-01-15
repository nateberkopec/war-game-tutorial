/**
 * Comprehensive QA Test for War Card Game.
 * Plays through multiple games looking for bugs.
 */

import { chromium } from 'playwright';

const PORT = process.argv[2] || '4173';
const BASE_URL = `http://localhost:${PORT}`;

async function runComprehensiveTests() {
  console.log('=== War Card Game Comprehensive QA Test ===');
  console.log(`Testing at: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const warnings = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(`Page Error: ${error.message}`);
  });

  try {
    // Load the game
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    console.log('Test 1: Full game playthrough');
    console.log('---');
    
    // Fill in names and start
    const inputs = await page.locator('input').all();
    await inputs[0].fill('Alice');
    await inputs[1].fill('Bob');
    
    const startButton = page.locator('button', { hasText: /start/i });
    await startButton.click();
    await page.waitForTimeout(1000);
    
    // Play through the game
    let roundCount = 0;
    const maxRounds = 200; // Safety limit
    let gameEnded = false;
    
    while (!gameEnded && roundCount < maxRounds) {
      roundCount++;
      
      // Click to draw
      await page.click('body');
      await page.waitForTimeout(200);
      
      // Check for victory screen
      const victoryScreen = await page.locator('#victory-screen').count();
      if (victoryScreen > 0) {
        gameEnded = true;
        console.log(`Game ended after ${roundCount} rounds!`);
        await page.screenshot({ path: `/tmp/war-victory-${roundCount}.png` });
      }
      
      // Log progress every 20 rounds
      if (roundCount % 20 === 0) {
        console.log(`  Round ${roundCount}...`);
        await page.screenshot({ path: `/tmp/war-round-${roundCount}.png` });
      }
      
      // Check for errors during gameplay
      if (errors.length > 0) {
        console.log(`  ERROR at round ${roundCount}: ${errors[errors.length - 1]}`);
        break;
      }
    }
    
    if (!gameEnded) {
      console.log(`  Game did not end after ${maxRounds} rounds - might be stuck`);
    }
    
    // Test 2: Check victory screen if game ended
    if (gameEnded) {
      console.log('\nTest 2: Victory screen');
      console.log('---');
      
      const winnerText = await page.locator('h1').first().textContent();
      console.log(`  Winner: ${winnerText}`);
      
      // Check for Play Again button
      const playAgainButton = await page.locator('button', { hasText: /play again/i }).count();
      console.log(`  Play Again button: ${playAgainButton > 0 ? 'FOUND' : 'MISSING'}`);
      
      // Try clicking Play Again
      if (playAgainButton > 0) {
        await page.locator('button', { hasText: /play again/i }).click();
        await page.waitForTimeout(1500);
        
        // Check if title screen appears
        const titleScreen = await page.locator('#title-screen').count();
        console.log(`  Title screen after Play Again: ${titleScreen > 0 ? 'FOUND' : 'MISSING'}`);
        await page.screenshot({ path: '/tmp/war-play-again.png' });
      }
    }
    
    // Summary
    console.log('\n=== Summary ===');
    console.log(`Rounds played: ${roundCount}`);
    console.log(`Game ended: ${gameEnded}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
    }
    
  } catch (error) {
    console.log(`\nFATAL ERROR: ${error.message}`);
    await page.screenshot({ path: '/tmp/war-error.png' });
  }

  await browser.close();
}

runComprehensiveTests().catch(console.error);
