// Minimal Worker Node test — runs one bot with simple flow
const { chromium } = require('playwright');

const GAME_URL = process.env.GAME_URL || 'https://gifterly.vercel.app';
const { getCanvasNoiseScript } = require('./src/canvasNoise');
const { scanDom } = require('./src/domSniper');
const { humanClick, humanClickSelector } = require('./src/bezierMouse');
const { getContextOptions, generateAllProfiles } = require('./src/identity');
const { generateSessionPlan } = require('./src/chaosEngine');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const profiles = generateAllProfiles();
  const profile = profiles[0];

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ ...getContextOptions(profile) });
  const page = await context.newPage();

  let passed = 0, failed = 0, total = 0;
  function test(name, cond) { total++; if (cond) { passed++; console.log(`  ✅ ${name}`); } else { failed++; console.log(`  ❌ ${name}`); } }

  try {
    await page.addInitScript(getCanvasNoiseScript(1));
    
    // Setup mouse tracking
    await page.evaluate(() => {
      document.addEventListener('mousemove', e => { window.mouseX = e.screenX; window.mouseY = e.screenY; }, { passive: true });
      window.mouseX = 200; window.mouseY = 400;
    });

    // Load game
    await page.goto(GAME_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    test('Game loaded', await page.locator('.game-container').isVisible());

    // ===== FULL AD CYCLE =====
    console.log('\n--- Trigger ad ---');
    const claimBox = await page.locator('#claim-bonus-btn').boundingBox();
    await humanClick(page, claimBox.x + claimBox.width / 2, claimBox.y + claimBox.height / 2);
    await sleep(2000);
    test('Video overlay appears', await page.locator('#video-ad-overlay').isVisible());

    // Wait for skip
    await page.waitForSelector('#skip-ad-btn', { timeout: 10000 });
    console.log('Skip button visible');

    // Skip via DOM
    const domResult = await scanDom(page);
    test('DOM found skip button', domResult.skip !== null);
    if (domResult.skip) {
      await humanClick(page, domResult.skip.x, domResult.skip.y);
      test('Skip clicked', true);
    }

    await sleep(1500);
    console.log('CTA overlay:', await page.locator('#cta-overlay').isVisible().catch(() => false));
    test('CTA overlay visible', await page.locator('#cta-overlay').isVisible().catch(() => false));

    // Click CTA
    const ctaBox = await page.locator('#cta-install-btn').boundingBox();
    if (ctaBox) {
      await humanClick(page, ctaBox.x + ctaBox.width / 2, ctaBox.y + ctaBox.height / 2);
      test('CTA clicked', true);
    }

    await sleep(1500);
    test('Page still open after CTA', !page.isClosed());
    console.log('Pages in context:', context.pages().length);

    // Close extra tabs
    for (const p of context.pages()) {
      if (p !== page) { await p.close(); console.log('Closed extra page'); }
    }
    test('Page still open after closing tabs', !page.isClosed());

    // Back to game
    test('Banner ad visible', await page.locator('#banner-ad').isVisible());

    // ===== NAVIGATION =====
    console.log('\n--- Navigation ---');
    await page.goto(GAME_URL + '/trade', { waitUntil: 'load' });
    test('Trade page', await page.locator('button:has-text("Buy")').first().isVisible());
    await page.goto(GAME_URL + '/portfolio', { waitUntil: 'load' });
    test('Portfolio page', await page.locator('text=My Portfolio').isVisible());
    await page.goto(GAME_URL, { waitUntil: 'load' });
    test('Dashboard back', await page.locator('#claim-bonus-btn').isVisible());

    // ===== SECOND AD CYCLE =====
    console.log('\n--- Second ad cycle ---');
    await humanClickSelector(page, '#claim-bonus-btn');
    await sleep(3000);
    await page.waitForSelector('#skip-ad-btn', { timeout: 10000 });
    const dom2 = await scanDom(page);
    if (dom2.skip) await humanClick(page, dom2.skip.x, dom2.skip.y);
    await sleep(1500);
    test('Second CTA visible', await page.locator('#cta-overlay').isVisible().catch(() => false));
    test('Page still open after 2nd cycle', !page.isClosed());

    console.log(`\n📋 ${passed}/${total} passed`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('Page closed:', page.isClosed());
    failed++;
  } finally {
    await browser.close();
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();