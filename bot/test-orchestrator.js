// Quick test for Orchestrator with 2 bots
// Run: ORCHESTRATOR_MODE=test node test-orchestrator.js

const { generateAllProfiles } = require('./src/identity');
const { runSession } = require('./src/worker');

const GAME_URL = process.env.GAME_URL || 'https://gifterly.vercel.app';

async function main() {
  console.log('🧪 Testing Orchestrator with 2 bots\n');

  const profiles = generateAllProfiles();
  const state = { adsToday: 0, dailyCap: 50 };

  // Test bot 1
  console.log('--- Bot 1 (Samsung Galaxy S24, New York) ---');
  await runSession(profiles[0], state);
  console.log(`  Ads this session: ${state.adsToday}\n`);

  // Test bot 2
  console.log('--- Bot 2 (iPhone 15 Pro, California) ---');
  await runSession(profiles[1], state);
  console.log(`  Total ads both bots: ${state.adsToday}\n`);

  console.log('✅ Orchestrator test complete');
  process.exit(0);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});