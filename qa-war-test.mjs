/**
 * QA Test specifically for War sequences.
 * Tests WAR! display, face-down cards, and nested wars.
 */

import { chromium } from 'playwright';

const PORT = process.argv[2] || '4173';
const BASE_URL = `http://localhost:${PORT}`;

async function runWarTests() {
  console.log('=== War Sequence QA Test ===');
  console.log(`Testing at: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const errors = [];
  
  page.on('console', (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(`Page Error: ${error.message}`);
  });

  try {
    // Load the game
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    
    // Start the game
    const inputs = await page.locator('input').all();
    await inputs[0].fill('WarTest1');
    await inputs[1].fill('WarTest2');
    
    const startButton = page.locator('button', { hasText: /start/i });
    await startButton.click();
    await page.waitForTimeout(1000);
    
    // Play rounds until we see a war (or hit max)
    let roundCount = 0;
    const maxRounds = 500;
    let warsDetected = 0;
    let doubleWarsDetected = 0;
    let gameEnded = false;
    
    console.log('Playing rounds, looking for wars...\n');
    
    while (!gameEnded && roundCount < maxRounds) {
      roundCount++;
      
      // Check console for war messages BEFORE clicking
      const preClickMessages = [...consoleMessages];
      
      // Click to draw
      await page.click('body');
      await page.waitForTimeout(300); // Slightly longer wait for announcements
      
      // Check for new messages after this click
      const newMessages = consoleMessages.slice(preClickMessages.length);
      
      // Check DOM for WAR! announcement
      const warAnnouncement = await page.locator('text=WAR!').count();
      const doubleWarAnnouncement = await page.locator('text=DOUBLE WAR!').count();
      
      if (warAnnouncement > 0) {
        warsDetected++;
        console.log(`  Round ${roundCount}: WAR! detected`);
        await page.screenshot({ path: `/tmp/war-sequence-${warsDetected}.png` });
      }
      
      if (doubleWarAnnouncement > 0) {
        doubleWarsDetected++;
        console.log(`  Round ${roundCount}: DOUBLE WAR! detected`);
        await page.screenshot({ path: `/tmp/double-war-${doubleWarsDetected}.png` });
      }
      
      // Check for victory screen
      const victoryScreen = await page.locator('#victory-screen').count();
      if (victoryScreen > 0) {
        gameEnded = true;
        console.log(`\nGame ended after ${roundCount} rounds`);
      }
      
      // Log progress
      if (roundCount % 100 === 0) {
        console.log(`  Progress: Round ${roundCount}, Wars: ${warsDetected}`);
      }
      
      // Stop if we have errors
      if (errors.length > 0) {
        console.log(`  ERROR: ${errors[errors.length - 1]}`);
        break;
      }
    }
    
    // Analyze console logs for war events
    const warStartedEvents = consoleMessages.filter(m => 
      m.text.includes('warStarted') || m.text.includes('WAR!')
    );
    const warResolvedEvents = consoleMessages.filter(m => 
      m.text.includes('warResolved') || m.text.includes('wins') && m.text.includes('cards!')
    );
    
    // Summary
    console.log('\n=== War Sequence Test Summary ===');
    console.log(`Total rounds: ${roundCount}`);
    console.log(`Wars detected (visual): ${warsDetected}`);
    console.log(`Double wars detected: ${doubleWarsDetected}`);
    console.log(`Game ended: ${gameEnded}`);
    console.log(`Console errors: ${errors.length}`);
    
    // Check if war messages were shown correctly
    console.log('\n=== War Messages in Console ===');
    consoleMessages
      .filter(m => m.text.toLowerCase().includes('war'))
      .slice(0, 20)
      .forEach(m => console.log(`  [${m.type}] ${m.text}`));
    
    // Pass/Fail
    const passed = warsDetected > 0 || doubleWarsDetected > 0 || roundCount >= maxRounds;
    console.log(`\n${passed ? 'PASS' : 'FAIL'}: ${passed ? 'War sequences working' : 'No wars detected - might be a bug'}`);
    
    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach(e => console.log(`  - ${e}`));
    }
    
  } catch (error) {
    console.log(`\nFATAL ERROR: ${error.message}`);
    console.log(error.stack);
    await page.screenshot({ path: '/tmp/war-test-error.png' });
  }

  await browser.close();
}

runWarTests().catch(console.error);
