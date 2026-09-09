// Urban VPN Popup Screenshot Tool
// Launches Chrome with Urban VPN in headed mode (Xvfb), opens popup, saves screenshot
// You look at the screenshot and tell me what buttons to click

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EXT_PATH = path.join(__dirname, '..', 'extensions', 'urban-vpn');

async function main() {
  console.log('🔍 Finding extension ID...');
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urban-ext-'));
  
  // First launch to register the extension and get its ID
  const ctx1 = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    args: ['--no-sandbox', `--load-extension=${EXT_PATH}`],
  });
  const p1 = await ctx1.newPage();
  await p1.goto('https://gifterly.vercel.app', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  await ctx1.close();

  // Read the extension ID from Chrome's preferences
  const prefsFile = path.join(userDataDir, 'Default', 'Preferences');
  let extId = null;
  if (fs.existsSync(prefsFile)) {
    const prefs = JSON.parse(fs.readFileSync(prefsFile, 'utf8'));
    const settings = prefs?.extensions?.settings;
    if (settings) {
      for (const [id, s] of Object.entries(settings)) {
        if (s.path && s.path.includes('urban-vpn')) {
          extId = id;
          break;
        }
      }
    }
  }
  
  if (!extId) {
    console.log('❌ Could not find extension ID');
    process.exit(1);
  }
  console.log(`✅ Extension ID: ${extId}`);

  // Second launch: headed mode with Xvfb
  console.log('🖥️  Launching headed browser...');
  const ctx2 = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ['--no-sandbox', `--load-extension=${EXT_PATH}`, '--window-size=480,900'],
  });

  const popupPage = await ctx2.newPage();
  const popupUrl = `chrome-extension://${extId}/popup/index.html`;
  
  try {
    await popupPage.goto(popupUrl, { timeout: 10000, waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 3000));
    
    const screenshotPath = '/tmp/urban-popup.png';
    await popupPage.screenshot({ path: screenshotPath });
    console.log(`\n📸 Screenshot saved to: ${screenshotPath}`);
    console.log('   Open it and describe what you see.');
    console.log('   Tell me: where is the "Connect" button?');
    console.log('   Where is the country/region dropdown?');
    console.log('   What text/class names do you see?\n');
    
    // Keep browser open for 60 seconds so user can inspect
    console.log('⏳ Browser will stay open for 60 seconds...');
    await new Promise(r => setTimeout(r, 60000));
    
  } catch (e) {
    console.log(`❌ Popup error: ${e.message}`);
    // Try alternative paths
    for (const alt of ['popup.html', 'index.html', 'html/popup.html']) {
      try {
        await popupPage.goto(`chrome-extension://${extId}/${alt}`, { timeout: 5000 });
        console.log(`✅ Found alternative path: ${alt}`);
        await popupPage.screenshot({ path: '/tmp/urban-popup.png' });
        console.log('📸 Screenshot saved');
        break;
      } catch {}
    }
  }

  await ctx2.close();
  fs.rmSync(userDataDir, { recursive: true });
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});