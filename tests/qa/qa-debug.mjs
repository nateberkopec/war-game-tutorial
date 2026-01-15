/**
 * Debug QA Test - logs all console output to understand game state.
 */

import { chromium } from 'playwright';

const PORT = process.argv[2] || '4173';
const BASE_URL = `http://localhost:${PORT}`;

async function runDebugTest() {
  console.log('=== War Card Game Debug Test ===');
  console.log(`Testing at: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log ALL console messages
  page.on('console', (msg) => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // Fill in names and start
    const inputs = await page.locator('input').all();
    await inputs[0].fill('Alice');
    await inputs[1].fill('Bob');
    
    const startButton = page.locator('button', { hasText: /start/i });
    await startButton.click();
    await page.waitForTimeout(1000);
    
    console.log('\n--- Starting gameplay ---\n');
    
    // Play 30 rounds
    for (let i = 0; i < 30; i++) {
      console.log(`\n=== Click ${i + 1} ===`);
      await page.click('body');
      await page.waitForTimeout(500);
      
      // Check card counts via page evaluation
      const counts = await page.evaluate(() => {
        const texts = Array.from(document.querySelectorAll('div')).map(d => d.textContent);
        return texts.filter(t => t && t.includes('Cards:')).join(', ');
      });
      console.log(`Card counts: ${counts}`);
    }
    
  } catch (error) {
    console.log(`ERROR: ${error.message}`);
  }

  await browser.close();
}

runDebugTest().catch(console.error);
