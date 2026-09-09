// Reactive State Machine Worker v2 — sequential state transitions
// Each ad cycle follows a strict pipeline: trigger → watch → skip → CTA → cleanup → next

const { chromium } = require('playwright');
const { getCanvasNoiseScript } = require('./canvasNoise');
const { scanDom } = require('./domSniper');
const { humanClick } = require('./bezierMouse');
const { getContextOptions } = require('./identity');
const { getProxyForBot } = require('./proxyManager');

const GAME_URL = process.env.GAME_URL || 'https://gifterly.vercel.app';

/**
 * Wait until a specific selector is visible, or timeout
 */
async function waitForVisible(page, selector, timeoutMs) {
  for (let i = 0; i < timeoutMs / 200; i++) {
    if (page.isClosed()) return false;
    const visible = await page.locator(selector).isVisible({ timeout: 100 }).catch(() => false);
    if (visible) return true;
    await page.waitForTimeout(200).catch(() => {});
  }
  return false;
}

/**
 * Run ONE complete ad cycle:
 * 1. Trigger → 2. Wait for skip → 3. Skip → 4. CTA → 5. Cleanup
 * @returns {boolean} true if ad was consumed
 */
async function runAdCycle(page, botId) {
  // Step 1: Trigger the ad
  await page.goto(GAME_URL, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  if (page.isClosed()) return false;
  await page.waitForTimeout(2000 + Math.random() * 2000).catch(() => {});
  
  const claimBox = await page.locator('#claim-bonus-btn').boundingBox().catch(() => null);
  if (claimBox) {
    // Use page.click for known selectors (works on mobile)
    await page.click('#claim-bonus-btn');
  } else {
    // Fallback
    await page.click('#claim-bonus-btn', { timeout: 2000 }).catch(() => false);
  }
  console.log(`[Bot ${botId}] Ad triggered`);

  // Step 2: Wait for video overlay + skip button (up to 12s)
  const overlayVisible = await waitForVisible(page, '#video-ad-overlay', 5000);
  if (!overlayVisible) {
    console.log(`[Bot ${botId}] Video overlay didn't appear`);
    return false;
  }

  const skipAppeared = await waitForVisible(page, '#skip-ad-btn', 10000);
  if (!skipAppeared || page.isClosed()) {
    console.log(`[Bot ${botId}] Skip button never appeared`);
    return false;
  }
  console.log(`[Bot ${botId}] Skip button appeared`);

  // Step 3: Click skip using known selector
  await page.waitForTimeout(300 + Math.random() * 500).catch(() => {});
  await page.click('#skip-ad-btn', { timeout: 2000 }).catch(() => {
    // Fallback: try DOM coordinates
    const dom = scanDom(page).catch(() => ({ skip: null }));
    if (dom.skip) {
      page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); if (el) el.click(); }, [dom.skip.x, dom.skip.y]);
    }
  });
  console.log(`[Bot ${botId}] Ad skipped`);

  // Step 4: Wait for CTA overlay and click it
  await page.waitForTimeout(1000 + Math.random() * 500).catch(() => {});
  const ctaVisible = await waitForVisible(page, '#cta-overlay', 5000);
  
  if (ctaVisible && !page.isClosed()) {
    console.log(`[Bot ${botId}] CTA appeared`);
    await page.waitForTimeout(500 + Math.random() * 500).catch(() => {});

    const ctaBox = await page.locator('#cta-install-btn').boundingBox().catch(() => null);
    if (ctaBox) {
      await page.click('#cta-install-btn');
      console.log(`[Bot ${botId}] CTA clicked`);

      // Stay on "advertiser page" for 3-5 seconds
      await page.waitForTimeout(3000 + Math.random() * 2000).catch(() => {});
    }
  } else {
    console.log(`[Bot ${botId}] No CTA appeared`);
  }

  // Step 5: Cleanup — close extra tabs, dismiss overlays
  for (const p of page.context().pages()) {
    if (p !== page) {
      await p.close().catch(() => {});
      console.log(`[Bot ${botId}] Closed extra tab`);
    }
  }
  await page.locator('#cta-close-btn').click({ timeout: 1000 }).catch(() => {});

  // Step 6: Navigate back to game
  await page.goto(GAME_URL, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500 + Math.random() * 1000).catch(() => {});

  console.log(`[Bot ${botId}] Ad cycle complete`);
  return true;
}

/**
 * Browse game with random actions (between ad cycles)
 */
async function browseGame(page) {
  const actions = [
    async () => {
      await page.goto(GAME_URL, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
      await page.evaluate(() => window.scrollBy(0, 100 + Math.random() * 200)).catch(() => {});
    },
    async () => {
      await page.goto(GAME_URL + '/trade', { waitUntil: 'load', timeout: 15000 }).catch(() => {});
      await page.locator('button:has-text("BTC")').first().click().catch(() => {});
    },
    async () => {
      await page.goto(GAME_URL + '/portfolio', { waitUntil: 'load', timeout: 15000 }).catch(() => {});
    },
    async () => {
      await page.goto(GAME_URL + '/settings', { waitUntil: 'load', timeout: 15000 }).catch(() => {});
    },
  ];

  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    if (page.isClosed()) break;
    const action = actions[Math.floor(Math.random() * actions.length)];
    await action();
    if (!page.isClosed()) {
      try { await page.waitForTimeout(2000 + Math.random() * 5000); } catch { break; }
    }
  }
  // Return to game dashboard
  if (!page.isClosed()) {
    await page.goto(GAME_URL, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000).catch(() => {});
  }
}

/**
 * Main session
 */
async function runSession(profile, state) {
  const { botId } = profile;
  console.log(`[Bot ${botId}] Starting session`);

  const proxy = getProxyForBot(profile);
  console.log(`[Bot ${botId}] Proxy: ${proxy.server} (${proxy.country})`);

  const browser = await chromium.launch({
    headless: true,
    proxy: { server: proxy.server },
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    ],
  });

  const context = await browser.newContext({ ...getContextOptions(profile) });
  const page = await context.newPage();

  await page.evaluate(() => {
    document.addEventListener('mousemove', e => { window.mouseX = e.screenX; window.mouseY = e.screenY; }, { passive: true });
    window.mouseX = 200; window.mouseY = 400;
  });

  await page.addInitScript(getCanvasNoiseScript(botId));

  const maxAds = parseInt(process.env.MAX_ADS || '3');
  let adsConsumed = 0;

  try {
    await page.goto(GAME_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000 + Math.random() * 2000).catch(() => {});
    console.log(`[Bot ${botId}] Game loaded`);

    // Initial browse
    await browseGame(page);

    // Sequential ad cycles
    for (let round = 0; round < maxAds; round++) {
      if (page.isClosed()) break;
      if (state && state.adsToday >= (state.dailyCap || 20)) break;

      console.log(`[Bot ${botId}] --- Ad cycle ${round + 1}/${maxAds} ---`);
      const consumed = await runAdCycle(page, botId);
      if (consumed) adsConsumed++;

      // Browse between cycles
      if (round < maxAds - 1 && !page.isClosed()) {
        await browseGame(page);
      }
    }

    console.log(`[Bot ${botId}] Session complete — ${adsConsumed}/${maxAds} ads`);
  } catch (err) {
    console.log(`[Bot ${botId}] Error: ${err.message}`);
  } finally {
    if (state) state.adsToday += adsConsumed;
    try { await page.waitForTimeout(300).catch(() => {}); } catch {}
    await browser.close().catch(() => {});
  }
}

module.exports = { runSession };