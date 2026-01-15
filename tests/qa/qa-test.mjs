/**
 * QA Test Script for War Card Game using Playwright.
 * Run with: npx playwright test qa-test.mjs --headed
 * Or: node qa-test.mjs (requires playwright installed)
 */

import { chromium } from 'playwright';

const PORT = process.argv[2] || '4173';
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('=== War Card Game QA Test ===');
  console.log(`Testing at: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else {
      consoleLogs.push(msg.text());
    }
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  let passed = 0;
  let failed = 0;

  // Helper function for test assertions
  function test(name, condition, details = '') {
    if (condition) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.log(`✗ ${name}${details ? ': ' + details : ''}`);
      failed++;
    }
  }

  try {
    // Test 1: Load the page
    console.log('\n--- Test: Page Load ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/tmp/war-01-loaded.png' });
    test('Page loads successfully', true);

    // Wait a moment for any loading screens
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/war-02-after-wait.png' });

    // Test 2: Title screen appears
    console.log('\n--- Test: Title Screen ---');
    const pageContent = await page.content();
    test('Page has WAR title', pageContent.includes('WAR'));
    
    // Test 3: Find input fields
    const inputs = await page.locator('input').all();
    test('Has player name inputs', inputs.length >= 2, `Found ${inputs.length} inputs`);

    // Test 4: Find start button
    const startButton = page.locator('button', { hasText: /start/i });
    const hasStartButton = await startButton.count() > 0;
    test('Has START button', hasStartButton);

    if (inputs.length >= 2 && hasStartButton) {
      // Test 5: Fill player names
      console.log('\n--- Test: Fill Player Names ---');
      await inputs[0].fill('Test Player 1');
      await inputs[1].fill('Test Player 2');
      await page.screenshot({ path: '/tmp/war-03-names-filled.png' });
      test('Can fill player names', true);

      // Test 6: Click start
      console.log('\n--- Test: Start Game ---');
      await startButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/war-04-game-started.png' });
      
      // Check for canvas (3D rendering)
      const canvases = await page.locator('canvas').all();
      test('Game scene renders (canvas present)', canvases.length > 0, `Found ${canvases.length} canvas elements`);

      // Test 7: Draw some cards
      console.log('\n--- Test: Draw Cards ---');
      try {
        for (let i = 0; i < 3; i++) {
          // Click on the canvas/body to trigger draw
          await page.click('body', { timeout: 5000 });
          await page.waitForTimeout(800);
          await page.screenshot({ path: `/tmp/war-05-draw-${i + 1}.png` });
          console.log(`   Draw ${i + 1} complete`);
        }
        test('Can draw cards (clicks work)', true);
      } catch (err) {
        test('Can draw cards (clicks work)', false, err.message);
      }

      // Check console for game events
      const hasGameEvents = consoleLogs.some(log => 
        log.includes('Round') || log.includes('wins') || log.includes('WAR')
      );
      test('Game emits events to console', hasGameEvents || consoleLogs.length > 0, 
        `Found ${consoleLogs.length} console logs`);
    }

    // Test 8: Check for errors
    console.log('\n--- Test: Error Check ---');
    test('No page errors', pageErrors.length === 0, 
      pageErrors.length > 0 ? pageErrors.join(', ') : '');
    test('No console errors', consoleErrors.length === 0,
      consoleErrors.length > 0 ? consoleErrors.join(', ') : '');

  } catch (error) {
    console.log(`\n✗ Test failed with error: ${error.message}`);
    failed++;
    await page.screenshot({ path: '/tmp/war-error.png' });
  }

  await browser.close();

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Screenshots saved to /tmp/war-*.png`);

  if (consoleErrors.length > 0) {
    console.log('\nConsole Errors:');
    consoleErrors.forEach(e => console.log(`  - ${e}`));
  }

  if (pageErrors.length > 0) {
    console.log('\nPage Errors:');
    pageErrors.forEach(e => console.log(`  - ${e}`));
  }

  return failed === 0;
}

runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
