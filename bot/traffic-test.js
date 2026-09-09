// Traffic generator — runs multiple bots quickly to generate analytics data
// Each bot loads the game, browses pages, triggers an ad

const { chromium } = require('playwright');
const { generateAllProfiles, getContextOptions } = require('./src/identity');

const GAME_URL = process.env.GAME_URL || 'https://gifterly.vercel.app';
const NUM_BOTS = parseInt(process.env.NUM_BOTS || '3', 10);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runOneBot(profile) {
  let browser;
  try {
    const { botId } = profile;
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ ...getContextOptions(profile) });
    const page = await context.newPage();

    // Browse multiple pages to generate page views
    const pages = [
      GAME_URL,
      GAME_URL + '/trade',
      GAME_URL + '/portfolio',
      GAME_URL + '/settings',
      GAME_URL,
    ];

    for (const url of pages) {
      if (page.isClosed()) break;
      await page.goto(url, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
      await sleep(1000 + Math.random() * 2000);
    }

    // Trigger and interact with an ad
    if (!page.isClosed()) {
      await page.goto(GAME_URL, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
      await sleep(1500);
      const claimBox = await page.locator('#claim-bonus-btn').boundingBox().catch(() => null);
      if (claimBox) {
        await page.mouse.click(claimBox.x + claimBox.width / 2, claimBox.y + claimBox.height / 2);
        await sleep(5000);
        // Try to skip
        const skipBox = await page.locator('#skip-ad-btn').boundingBox().catch(() => null);
        if (skipBox) {
          await page.mouse.click(skipBox.x + skipBox.width / 2, skipBox.y + skipBox.height / 2);
          await sleep(1500);
          const ctaBox = await page.locator('#cta-install-btn').boundingBox().catch(() => null);
          if (ctaBox) {
            await page.mouse.click(ctaBox.x + ctaBox.width / 2, ctaBox.y + ctaBox.height / 2);
            await sleep(3000);
          }
          // Close overlay
          await page.click('#cta-close-btn').catch(() => {});
        }
      }
    }

    console.log(`  ✅ Bot ${botId}: ${profile.device} (${profile.vpnRegion}) — done`);
  } catch (err) {
    console.log(`  ❌ Bot ${profile.botId}: ${err.message}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function main() {
  console.log(`🚀 Generating traffic with ${NUM_BOTS} bots\n`);
  const profiles = generateAllProfiles();

  for (let i = 0; i < NUM_BOTS; i++) {
    const profile = profiles[i];
    console.log(`\nBot ${i + 1}/${NUM_BOTS}: ${profile.device} — ${profile.vpnRegion}`);
    await runOneBot(profile);
    // Delay between bots so analytics sees distinct sessions
    await sleep(2000 + Math.random() * 3000);
  }

  console.log(`\n✅ Traffic generation complete — ${NUM_BOTS} bots finished`);
  process.exit(0);
}

main().catch(err => { console.error(err.message); process.exit(1); });