// Stress test: 3 bots, 3 ads each, sequentially
const { runSession } = require('./src/worker');
const { generateAllProfiles } = require('./src/identity');

const profiles = generateAllProfiles();
const state = { adsToday: 0, dailyCap: 50 };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🧪 STRESS TEST — 3 bots × 3 ads each\n');
  let totalAds = 0;

  for (let i = 0; i < 3; i++) {
    const profile = profiles[i];
    const before = state.adsToday;
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Bot ${i+1}: ${profile.device} — ${profile.vpnRegion}`);
    console.log(`${'='.repeat(50)}`);
    const start = Date.now();
    await runSession(profile, state);
    const elapsed = Math.round((Date.now() - start) / 1000);
    const adsThisSession = state.adsToday - before;
    totalAds += adsThisSession;
    console.log(`⏱  ${elapsed}s | Ads this session: ${adsThisSession} | Total: ${state.adsToday}`);
    await sleep(3000);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ STRESS TEST COMPLETE`);
  console.log(`   Total ads across 3 bots: ${totalAds}`);
  console.log(`   Expected: 9 (3 bots × 3 ads each)`);
  console.log(`   Reliability: ${Math.round((totalAds / 9) * 100)}%`);
  console.log(`${'='.repeat(50)}`);
  process.exit(0);
}

main().catch(err => { console.error(err.message); process.exit(1); });