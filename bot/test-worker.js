const { runSession } = require('./src/worker');
const { generateAllProfiles } = require('./src/identity');

const profiles = generateAllProfiles();
const state = { adsToday: 0, dailyCap: 50 };

async function main() {
  console.log('=== Bot 1 ===');
  await runSession(profiles[0], state);
  console.log(`Ads: ${state.adsToday}`);

  await new Promise(r => setTimeout(r, 5000));

  console.log('\n=== Bot 2 ===');
  await runSession(profiles[1], state);
  console.log(`Ads: ${state.adsToday}`);

  console.log('\n✅ Done');
}

main().catch(err => { console.error(err.message); process.exit(1); })
  .then(() => process.exit(0));