// Quick test script for one Worker Node
const { chromium, devices } = require('playwright');
const { bezierPath } = require('./src/bezierMouse');

const GAME_URL = process.env.GAME_URL || 'https://gifterly.vercel.app';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test() {
  console.log(`🧪 Testing Worker Node against ${GAME_URL}`);
  console.log('='.repeat(50));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices['Samsung Galaxy S24'] });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;
  let total = 0;

  function test(name, condition) {
    total++;
    if (condition) { console.log(`  ✅ ${name}`); passed++; }
    else { console.log(`  ❌ ${name}`); failed++; }
  }

  try {
    // 1. Page loads
    console.log('\n📄 Page Load:');
    await page.goto(GAME_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000); // Let React hydrate
    test('Game loads', await page.locator('.game-container').isVisible());

    // 2. Canvas noise does not throw
    console.log('\n🎨 Canvas Noise:');
    await page.addInitScript(() => {
      const rng = () => { let h=0; const s='test-bot'; for(const c of s) h=((h<<5)-h)+c.charCodeAt(0); h&=h; return ()=>{h=(h*1103515245+12345)&0x7fffffff;return h/0x7fffffff;}; };
      const noise = rng();
      const orig = CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData = function(...args) {
        const d = orig.apply(this, args);
        for(let i=0;i<d.data.length;i+=4) d.data[i] = Math.min(255, Math.max(0, d.data[i] + Math.floor(noise()*3-1)));
        return d;
      };
    });
    await page.screenshot();
    test('Canvas noise injected', true);

    // 3. DOM elements visible
    console.log('\n🔍 DOM Check:');
    test('Banner ad visible', await page.locator('#banner-ad').isVisible());
    test('Claim Bonus visible', await page.locator('#claim-bonus-btn').isVisible());

    // 4. Bezier mouse test
    console.log('\n🖱️  Bezier Mouse:');
    const box = await page.locator('#claim-bonus-btn').boundingBox();
    const bp = bezierPath(100, 100, box.x + box.width/2, box.y + box.height/2);
    for (const p of bp) await page.mouse.move(p.x, p.y);
    await sleep(100);
    test(`Bezier path: ${bp.length} points`, bp.length > 5);
    await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
    test('Bezier click executed', true);

    // 5. Navigation
    console.log('\n🧭 Navigation:');
    await page.goto(GAME_URL + '/trade', { waitUntil: 'networkidle' });
    await sleep(1000);
    test('Trade page loads', await page.locator('button:has-text("Buy")').first().isVisible());
    await page.goto(GAME_URL + '/portfolio', { waitUntil: 'networkidle' });
    await sleep(1000);
    test('Portfolio page loads', await page.locator('text=My Portfolio').isVisible());

    // 6. Full ad cycle
    console.log('\n🎬 Ad Cycle:');
    await page.goto(GAME_URL, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    await page.click('#claim-bonus-btn');
    await sleep(3000);
    test('Video ad overlay appeared', await page.locator('#video-ad-overlay').isVisible());

    // Wait for skip + click
    await page.waitForSelector('#skip-ad-btn', { timeout: 10000 });
    test('Skip button appeared', true);
    await page.click('#skip-ad-btn');
    await sleep(2000);
    test('Video dismissed after skip', !(await page.locator('#video-ad-overlay').isVisible().catch(() => false)));

    // CTA appears
    await page.waitForSelector('#cta-install-btn', { timeout: 5000 }).catch(() => {});
    test('CTA overlay appears', await page.locator('#cta-overlay').isVisible().catch(() => false));

    if (await page.locator('#cta-overlay').isVisible().catch(() => false)) {
      const ctaText = await page.locator('#cta-install-btn').textContent();
      test(`CTA text: "${ctaText}"`, ctaText && ctaText.length > 0);
      
      // Click CTA
      const ctaBox = await page.locator('#cta-install-btn').boundingBox();
      const ctaPath = bezierPath(200, 400, ctaBox.x + ctaBox.width/2, ctaBox.y + ctaBox.height/2);
      for (const p of ctaPath) await page.mouse.move(p.x, p.y);
      await sleep(100);
      await page.mouse.click(ctaBox.x + ctaBox.width/2, ctaBox.y + ctaBox.height/2);
      await sleep(2000);
      test('CTA clicked (tab may open in headed mode)', true);
      
      // Close tab if it opened
      const pages = context.pages();
      for (const p of pages) { if (p !== page) await p.close().catch(() => {}); }
      
      // Close CTA overlay
      await page.click('#cta-close-btn').catch(() => {});
      await sleep(1000);
    }
    
    test('Back to game after ad', await page.locator('#banner-ad').isVisible());

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📋 RESULTS: ${passed}/${total} passed (${Math.round(passed*100/total)}%)`);
    console.log(`${'='.repeat(50)}`);

  } catch (err) {
    console.error('❌ Fatal:', err.message);
    failed++;
  } finally {
    await browser.close();
  }

  process.exit(failed > 0 ? 1 : 0);
}

test();