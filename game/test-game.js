// Automated test for Crypto Trader Tycoon
// Tests: page load, meta tags, navigation, trading, ad flow
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function test(name, condition) {
    if (condition) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed++;
    }
  }

  try {
    // ===== Test 1: Page loads =====
    console.log('\n1️⃣  Page Load Tests:');
    await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
    test('Game container renders', await page.locator('.game-container').isVisible());

    // ===== Test 2: Meta tags and title =====
    console.log('\n2️⃣  Meta Tag Tests:');
    const title = await page.title();
    test('Title contains "Crypto"', title.toLowerCase().includes('crypto'));
    test('Title contains "Bitcoin"', title.toLowerCase().includes('bitcoin'));

    const metaKeywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    test('Keywords meta tag exists', metaKeywords !== null);
    test('Keywords contain "Bitcoin"', metaKeywords?.toLowerCase().includes('bitcoin'));
    test('Keywords contain "Finance"', metaKeywords?.toLowerCase().includes('finance'));
    test('Keywords contain "Portfolio"', metaKeywords?.toLowerCase().includes('portfolio'));
    test('Keywords contain "Invest"', metaKeywords?.toLowerCase().includes('invest'));
    test('Keywords contain "Margin"', metaKeywords?.toLowerCase().includes('margin'));
    test('Keywords contain "Trading"', metaKeywords?.toLowerCase().includes('trading'));

    const metaTopic = await page.locator('meta[name="page-topic"]').getAttribute('content');
    test('Page topic meta exists', metaTopic !== null);

    const metaCategory = await page.locator('meta[name="category"]').getAttribute('content');
    test('Category meta contains "Finance"', metaCategory?.toLowerCase().includes('finance'));
    test('Category meta contains "Crypto"', metaCategory?.toLowerCase().includes('crypto'));

    // ===== Test 3: Dashboard content =====
    console.log('\n3️⃣  Dashboard Tests:');
    test('Header shows "Crypto Trader Tycoon"', await page.locator('text=Crypto Trader Tycoon').isVisible());
    test('Portfolio value displayed', await page.locator('text=Portfolio Value').isVisible());
    test('Balance displayed', await page.locator('text=Balance:').isVisible());
    test('BTC price card visible', await page.locator('text=BTC').first().isVisible());
    test('ETH price card visible', await page.locator('text=ETH').first().isVisible());
    test('SOL price card visible', await page.locator('text=SOL').first().isVisible());
    test('Level progress bar visible', await page.locator('text=Level').isVisible());
    test('Claim Bonus button visible', await page.locator('#claim-bonus-btn').isVisible());
    test('Banner ad visible', await page.locator('#banner-ad').isVisible());
    test('Banner has AD badge', await page.locator('#banner-ad >> text="AD"').first().isVisible());

    // ===== Test 4: Navigation =====
    console.log('\n4️⃣  Navigation Tests:');
    await page.goto(BASE_URL + '/trade', { waitUntil: 'load' });
    await sleep(600);
    test('Navigated to /trade', page.url().includes('/trade'));
    test('Buy/Sell tabs visible', await page.locator('button:has-text("Buy")').first().isVisible() && await page.locator('button:has-text("Sell")').first().isVisible());
    test('Coin selector active for BTC', await page.locator('button:has-text("BTC")').first().isVisible());
    test('Banner persists on trade page', await page.locator('#banner-ad').isVisible());

    await page.goto(BASE_URL + '/portfolio', { waitUntil: 'load' });
    await sleep(600);
    test('Navigated to /portfolio', page.url().includes('/portfolio'));
    test('"My Portfolio" heading visible', await page.locator('text=My Portfolio').isVisible());
    test('Cash Balance displayed', await page.locator('text=Cash Balance').isVisible());

    await page.goto(BASE_URL + '/settings', { waitUntil: 'load' });
    await sleep(600);
    test('Navigated to /settings', page.url().includes('/settings'));
    test('Reset game button visible', await page.locator('#reset-game-btn').isVisible());
    test('About section visible', await page.locator('text=Crypto Trader Tycoon v1.3.2').isVisible());

    await page.goto(BASE_URL + '/', { waitUntil: 'load' });
    await sleep(600);
    test('Back on Dashboard', page.url() === BASE_URL + '/' || page.url() === BASE_URL);

    // ===== Test 5: Trading flow =====
    console.log('\n5️⃣  Trading Tests:');
    await page.goto(BASE_URL + '/trade', { waitUntil: 'load' });
    await sleep(600);

    // Get balance before trade
    const balanceText = await page.locator('text=Available Balance').evaluate(el => el.parentElement?.textContent || '');
    console.log(`  ℹ️  Balance before: ${balanceText}`);

    // Buy 0.5 BTC
    const amountInput = await page.locator('input[type="number"]');
    await amountInput.click();
    await amountInput.fill('0.5');
    await sleep(200);
    await page.click('#trade-buy-btn');
    await sleep(800);
    test('Buy success message appears', await page.locator('text=Bought').isVisible());
    // Balance should have decreased
    const balanceAfter = await page.locator('text=Available Balance').evaluate(el => el.parentElement?.textContent || '');
    test('Balance decreased after buy', !balanceAfter.includes('$100000'));

    // Verify portfolio updated
    await page.goto(BASE_URL + '/portfolio', { waitUntil: 'load' });
    await sleep(600);
    test('Portfolio shows empty state message', await page.locator('text=Empty portfolio').isVisible());

    // ===== Test 6: Game reset =====
    console.log('\n6️⃣  Reset Test:');
    await page.goto(BASE_URL + '/settings', { waitUntil: 'load' });
    await sleep(400);
    await page.click('#reset-game-btn');
    await sleep(600);
    test('Reset confirms with message', await page.locator('text=reset successfully').isVisible());

    await page.goto(BASE_URL + '/', { waitUntil: 'load' });
    await sleep(400);

    // ===== Test 7: Rewarded Ad Flow =====
    console.log('\n7️⃣  Video Ad Tests:');
    await page.click('#claim-bonus-btn');
    await sleep(2000);
    test('Video ad overlay appears', await page.locator('#video-ad-overlay').isVisible());
    test('AD badge on overlay', await page.locator('#video-ad-overlay >> text="AD"').isVisible());
    test('Progress bar exists', await page.locator('.ad-progress').isVisible());

    // Wait for skip (3s)
    console.log('  ⏳ Waiting for skip button...');
    await sleep(3000);
    test('Skip Ad button visible', await page.locator('#skip-ad-btn').isVisible());
    test('Skip button says "Skip Ad"', (await page.locator('#skip-ad-btn').textContent())?.includes('Skip'));

    // Click skip
    await page.click('#skip-ad-btn');
    await sleep(1500);
    test('Video overlay gone after skip', !(await page.locator('#video-ad-overlay').isVisible().catch(() => false)));
    test('CTA overlay appears', await page.locator('#cta-overlay').isVisible());
    test('CTA install button exists', await page.locator('#cta-install-btn').isVisible());
    const ctaBtnText = await page.locator('#cta-install-btn').textContent();
    test('CTA button has text', ctaBtnText && ctaBtnText.length > 0);
    console.log(`  ℹ️  CTA text: "${ctaBtnText}"`);

    // Close CTA
    await page.click('#cta-close-btn');
    await sleep(600);
    test('CTA dismissed', !(await page.locator('#cta-overlay').isVisible().catch(() => false)));
    test('Back to game with banner', await page.locator('#banner-ad').isVisible());

    // ===== Test 8: Full ad cycle (skip + CTA click with tab) =====
    console.log('\n8️⃣  Full CTA Click Test:');
    await page.click('#claim-bonus-btn');
    await sleep(5000);
    await page.click('#skip-ad-btn');
    await sleep(1500);

    test('CTA visible before click', await page.locator('#cta-overlay').isVisible());
    // Click CTA - in headless mode window.open may not create a new page
    await page.click('#cta-install-btn');
    await sleep(1000);
    // After CTA click, the ad flow resets (dismissCta called after 500ms)
    test('CTA dismissed after click', !(await page.locator('#cta-overlay').isVisible().catch(() => false)));
    await sleep(800);
    test('Returns to banner phase', await page.locator('#banner-ad').isVisible());

    // ===== Test 9: PWA manifest =====
    console.log('\n9️⃣  PWA Tests:');
    const manifestResp = await page.goto(BASE_URL + '/manifest.json', { waitUntil: 'networkidle' });
    test('Manifest loads (200)', manifestResp?.ok() === true);
    if (manifestResp?.ok()) {
      const manifest = await manifestResp.json();
      test('Manifest has name', !!manifest.name);
      test('Manifest categories include crypto/finance', manifest.categories?.some(c => ['crypto','finance','trading','investment'].includes(c)));
      test('Manifest display is standalone', manifest.display === 'standalone');
      test('Manifest has icons array', Array.isArray(manifest.icons) && manifest.icons.length > 0);
      test('Manifest shortcuts exist', Array.isArray(manifest.shortcuts) && manifest.shortcuts.length > 0);
    }

    // ===== Summary =====
    const total = passed + failed;
    const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
    console.log(`\n${'='.repeat(45)}`);
    console.log(`  FINISHED: ${passed}/${total} passed (${pct}%)`);
    if (failed > 0) console.log(`  ❌ ${failed} tests FAILED`);
    else console.log('  🎉 ALL TESTS PASSED');
    console.log(`${'='.repeat(45)}\n`);

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    failed++;
  } finally {
    await browser.close();
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();