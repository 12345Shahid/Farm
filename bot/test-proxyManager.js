// test-proxyManager.js — Fully automated test suite for proxyManager
//
// Usage:
//   # Unit tests (no browser, no credentials needed):
//   node test-proxyManager.js --mode=unit
//
//   # Webshare integration (requires proxy credentials):
//   node test-proxyManager.js --mode=webshare --proxy-file=../config/proxies.json
//
//   # Urban VPN (requires Xvfb + headed display):
//   PROXY_MODE=urban DISPLAY=:99 node test-proxyManager.js --mode=urban
//
//   # Full suite:
//   node test-proxyManager.js --mode=all --proxy-file=../config/proxies.json
//
//   # Quick proxy pool health check only:
//   node test-proxyManager.js --mode=health --proxy-file=../config/proxies.json

const { chromium } = require('playwright');

// ========================
// Parse CLI args
// ========================

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const eqIdx = args[i].indexOf('=');
    let key, val;
    if (eqIdx > 0) {
      key = args[i].slice(2, eqIdx);
      val = args[i].slice(eqIdx + 1);
    } else {
      key = args[i].slice(2);
      val = (args[i + 1] && !args[i + 1].startsWith('--')) ? args[i + 1] : true;
      if (val !== true) i++;
    }
    flags[key] = val;
  }
}

const TEST_MODE = flags.mode || 'unit';
const PROXY_FILE = flags['proxy-file'] || null;

// ========================
// Test Runner
// ========================

let passed = 0;
let failed = 0;
let total = 0;

function test(name, condition) {
  total++;
  if (condition) { console.log(`  ✅ ${name}`); passed++; }
  else { console.log(`  ❌ ${name}`); failed++; }
}

function section(title) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(50)}`);
}

// ========================
// Load proxyManager
// ========================

const pm = require('./src/proxyManager');

// ========================
// TEST: Unit Tests (no browser needed)
// ========================

async function testUnit() {
  section('Unit Tests: Proxy Assignment Logic');

  // Reset state
  pm.setMode('webshare');
  pm.setProxies([]);

  // Test setMode/getMode
  pm.setMode('urban');
  test('setMode("urban") works', pm.getMode() === 'urban');
  pm.setMode('webshare');
  test('setMode("webshare") works', pm.getMode() === 'webshare');

  // Test setProxies with sample data
  const sampleProxies = [
    { ip: '1.2.3.4', port: 8080, username: 'user1', password: 'pass1', country: 'US' },
    { ip: '5.6.7.8', port: 8080, username: 'user2', password: 'pass2', country: 'GB' },
    { ip: '9.10.11.12', port: 3128, username: 'user3', password: 'pass3', country: 'US' },
  ];
  pm.setProxies(sampleProxies);
  test('setProxies stores proxies', pm.getAliveCount() === 3);

  // Test getProxyForBot in webshare mode (no browser needed)
  const profile1 = { botId: 1, vpnRegion: 'United States - New York' };
  const proxy1 = pm.getProxyForBot(profile1);
  test('Webshare mode returns correct type', proxy1.type === 'webshare');
  test('Webshare returns proxy at index 0 for bot 1', proxy1.server.includes('1.2.3.4'));

  const profile2 = { botId: 2, vpnRegion: 'United Kingdom - London' };
  const proxy2 = pm.getProxyForBot(profile2);
  test('Webshare returns proxy at index 1 for bot 2', proxy2.server.includes('5.6.7.8'));

  // Round-robin wraps around
  const profile4 = { botId: 4, vpnRegion: 'United States - Texas' };
  const proxy4 = pm.getProxyForBot(profile4);
  test('Webshare wraps around (bot 4 → index 0)', proxy4.server.includes('1.2.3.4'));

  // Test getProxyForBot in urban mode
  pm.setMode('urban');
  const urbanProfile = { botId: 1, vpnRegion: 'United Kingdom - London' };
  const urbanProxy = pm.getProxyForBot(urbanProfile);
  test('Urban mode returns correct type', urbanProxy.type === 'urban');
  test('Urban mode returns correct country', urbanProxy.country === 'United Kingdom');
  test('Urban mode returns correct label', urbanProxy.label === 'London');
  test('Urban mode returns extensionPath', urbanProxy.extensionPath && urbanProxy.extensionPath.endsWith('urban-vpn'));

  // Test all 7 VPN regions map to something
  for (const region of Object.keys(pm.VPN_REGION_MAP)) {
    const p = { botId: 1, vpnRegion: region };
    const proxy = pm.getProxyForBot(p);
    test(`Region "${region}" maps to countryCode`, proxy.countryCode === pm.VPN_REGION_MAP[region].countryCode);
  }

  // Test getLaunchConfig
  pm.setMode('webshare');
  const wsConfig = pm.getLaunchConfig({
    type: 'webshare',
    server: 'http://1.2.3.4:8080',
    username: 'u',
    password: 'p',
  });
  test('Webshare launch config: headless=true', wsConfig.headless === true);
  test('Webshare launch config: has proxy.server', wsConfig.proxy.server === 'http://1.2.3.4:8080');

  pm.setMode('urban');
  const urbanConfig = pm.getLaunchConfig({
    type: 'urban',
    extensionPath: '/fake/path',
    region: 'US',
  });
  test('Urban launch config: headless=false', urbanConfig.headless === false);
  test('Urban launch config: has --load-extension', urbanConfig.args.some(a => a.includes('--load-extension')));

  // Test markProxyDead and getAliveCount
  pm.setMode('webshare');
  pm.setProxies(sampleProxies);
  pm.markProxyDead(1);
  test('markProxyDead(1) reduces alive count', pm.getAliveCount() === 2);
  pm.setProxies(sampleProxies); // reset
}

// ========================
// TEST: Proxy IP Verification (browser required)
// ========================

async function testIpVerification() {
  section('Integration Test: IP Verification');

  let browser = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const result = await pm.verifyIp(browser);
    test('verifyIp returns result', result !== false);
    if (result) {
      test('verifyIp returns ip string', typeof result.ip === 'string' && result.ip.length > 0);
      test('verifyIp returns location data or graceful fallback', result.location !== false);
      console.log(`  ℹ️  Local IP: ${result.ip}`);
    }
  } catch (err) {
    test(`verifyIp: ${err.message}`, false);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

// ========================
// TEST: Webshare Proxy Health Check
// ========================

async function testWebshare() {
  section('Integration Test: Webshare Proxies');

  if (!PROXY_FILE) {
    console.log('  ⚠️  No --proxy-file provided. Skipping Webshare tests.');
    console.log('  Usage: node test-proxyManager.js --mode=webshare --proxy-file=../config/proxies.json');
    return;
  }

  const proxies = pm.loadProxiesFromFile(PROXY_FILE);
  if (proxies.length === 0) {
    test('Load proxies from file — none found (check file path)', false);
    return;
  }
  test(`Loaded ${proxies.length} proxies from file`, proxies.length > 0);

  // Test proxy assignment consistency
  for (let i = 0; i < Math.min(proxies.length, 5); i++) {
    const profile = { botId: i + 1, vpnRegion: 'United States - New York' };
    const proxy = pm.getProxyForBot(profile);
    test(`Bot ${i + 1} assigned proxy ${proxy.server}`, proxy.server && proxy.server.length > 0);
  }

  // Test first 3 proxies' connections
  const testCount = Math.min(3, proxies.length);
  console.log(`\n  Testing ${testCount} proxies (${proxies.length} total)...`);

  for (let i = 0; i < testCount; i++) {
    const proxy = proxies[i];
    const config = {
      type: 'webshare',
      server: `http://${proxy.ip}:${proxy.port}`,
      username: proxy.username,
      password: proxy.password,
    };

    console.log(`  🔌 Testing proxy ${i + 1}: ${proxy.ip}:${proxy.port}`);
    const result = await pm.testProxyConnection(config);
    test(`Proxy ${i + 1} (${proxy.ip}) is alive`, result.alive === true);
    if (!result.alive) {
      console.log(`     ↳ Error: ${result.error}`);
    }
  }
}

// ========================
// TEST: Full Proxy Pool Health Check
// ========================

async function testHealth() {
  section('Full Proxy Pool Health Check');

  if (!PROXY_FILE) {
    console.log('  ⚠️  No --proxy-file provided. Skipping health check.');
    return;
  }

  const proxies = pm.loadProxiesFromFile(PROXY_FILE);
  if (proxies.length === 0) {
    console.log('  ❌ No proxies loaded.');
    return;
  }

  console.log(`  Testing all ${proxies.length} proxies (concurrency: 5)...`);
  const results = await pm.testAllProxies(5);

  const alive = results.filter(r => r.alive).length;
  const dead = results.filter(r => !r.alive).length;

  section('Health Check Results');
  test(`Total proxies: ${proxies.length}`, results.length === proxies.length);
  test(`Alive: ${alive}`, alive > 0);
  test(`Dead: ${dead}`, dead <= results.length);

  if (dead > 0) {
    console.log(`\n  Dead proxies:`);
    results.filter(r => !r.alive).forEach(r => {
      console.log(`    [${r.index}] ${proxies[r.index]?.ip}:${proxies[r.index]?.port} — ${r.error || 'unknown'}`);
    });
  }
}

// ========================
// TEST: Urban VPN (Headed mode, requires Xvfb)
// ========================

async function testUrban() {
  section('Integration Test: Urban VPN (headed mode)');

  if (!process.env.DISPLAY) {
    console.log('  ⚠️  DISPLAY not set. This test requires Xvfb.');
    console.log('  Usage: DISPLAY=:99 node test-proxyManager.js --mode=urban');
    console.log('  Or start Xvfb first: Xvfb :99 -screen 0 1920x1080x24 &');
    return;
  }

  // Check if extension directory exists
  const fs = require('fs');
  if (!fs.existsSync(pm.EXTENSION_PATH)) {
    test(`Urban VPN extension not found at ${pm.EXTENSION_PATH}`, false);
    return;
  }
  test(`Urban VPN extension exists at ${pm.EXTENSION_PATH}`, true);

  pm.setMode('urban');

  let browser = null;
  try {
    const profile = { botId: 1, vpnRegion: 'United States - New York' };
    const proxyConfig = pm.getProxyForBot(profile);
    const launchConfig = pm.getLaunchConfig(proxyConfig);

    console.log(`\n  Launching browser with Urban VPN extension...`);
    browser = await chromium.launch(launchConfig);

    const context = await browser.newContext({
      viewport: { width: 412, height: 915 },
      isMobile: true,
    });

    test('Browser launched with extension', browser.isConnected());

    // Find extension ID
    const extId = await pm.findExtensionId(context);
    if (extId) {
      test(`Extension ID found: ${extId}`, extId.length === 32);
    } else {
      // Create a page first to trigger extension initialization
      const tempPage = await context.newPage();
      await tempPage.goto('about:blank');
      await tempPage.waitForTimeout(2000);
      const extId2 = await pm.findExtensionId(context);
      test(`Extension ID found after page load: ${extId2}`, extId2 && extId2.length === 32);
      await tempPage.close().catch(() => {});
    }

    // Try connecting Urban VPN
    console.log(`\n  Attempting Urban VPN connection to ${proxyConfig.label}...`);
    const connected = await pm.connectUrbanVpn(browser, proxyConfig);
    test(`Urban VPN connected to ${proxyConfig.label}`, connected === true);

    // Verify IP changed from local
    const ipResult = await pm.verifyIp(browser);
    test(`IP verification succeeded`, ipResult && ipResult.ip);
    if (ipResult && ipResult.location) {
      console.log(`  ℹ️  Connected via: ${ipResult.location.country_name}, ${ipResult.location.city}`);
    }

  } catch (err) {
    test(`Urban VPN test: ${err.message}`, false);
    console.error(`  Error details:`, err.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

// ========================
// TEST: Full Bot Connection (end-to-end)
// ========================

async function testBotConnection() {
  section('End-to-End: Bot Connection Flow');

  const profile = { botId: 1, vpnRegion: 'United States - New York' };

  try {
    const result = await pm.connectBot(profile);
    test(`Bot ${profile.botId} connected`, result.browser && result.browser.isConnected());
    test(`Proxy config type: ${result.proxyConfig.type}`, result.proxyConfig.type === 'webshare' || result.proxyConfig.type === 'urban');
    await result.browser.close().catch(() => {});
  } catch (err) {
    test(`Bot connection flow: ${err.message}`, false);
  }
}

// ========================
// Main
// ========================

async function main() {
  console.log(`\n🧪 ProxyManager Test Suite`);
  console.log(`   Mode: ${TEST_MODE}`);
  if (PROXY_FILE) console.log(`   Proxy file: ${PROXY_FILE}`);
  console.log(`   DISPLAY: ${process.env.DISPLAY || 'not set (headless)'}`);
  console.log(`   PROXY_MODE: ${process.env.PROXY_MODE || 'webshare'}`);
  console.log(`\n${'='.repeat(50)}`);

  const startTime = Date.now();

  try {
    if (TEST_MODE === 'unit' || TEST_MODE === 'all') {
      await testUnit();
    }

    if (TEST_MODE === 'ip' || TEST_MODE === 'all') {
      await testIpVerification();
    }

    if (TEST_MODE === 'webshare' || TEST_MODE === 'all') {
      await testWebshare();
    }

    if (TEST_MODE === 'health') {
      await testHealth();
    }

    if (TEST_MODE === 'urban' || TEST_MODE === 'all') {
      await testUrban();
    }

    if (TEST_MODE === 'e2e' || TEST_MODE === 'all') {
      await testBotConnection();
    }
  } catch (err) {
    console.error(`\n❌ Fatal: ${err.message}`);
    failed++;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  console.log(`  RESULTS: ${passed}/${total} passed (${pct}%) in ${elapsed}s`);
  if (failed > 0) console.log(`  ❌ ${failed} tests FAILED`);
  else console.log(`  🎉 ALL TESTS PASSED`);
  console.log(`${'='.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main();