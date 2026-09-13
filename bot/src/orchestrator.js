// Orchestrator — master control for 150 bot Worker Nodes
// Runs on Railway, manages shifts, warmup, health monitoring

const { generateAllProfiles } = require('./identity');
const { runSession } = require('./worker');

const GAME_URL = process.env.GAME_URL || 'https://gifterly.vercel.app';
const ORCHESTRATOR_MODE = process.env.ORCHESTRATOR_MODE || 'test'; // test | warmup | full

// ========================
// Warmup Schedule
// ========================
const WARMUP_SCHEDULE = [
  { dayRange: [1, 3], activeBots: 5, clicksPerSession: 0, label: 'Days 1-3: Stealth warmup, no clicks' },
  { dayRange: [4, 7], activeBots: 30, clicksPerSession: 1, label: 'Days 4-7: Gradual introduction' },
  { dayRange: [8, 14], activeBots: 75, clicksPerSession: 3, label: 'Days 8-14: Scale up engagement' },
  { dayRange: [15, Infinity], activeBots: 150, clicksPerSession: 5, label: 'Days 15+: Full capacity' },
];

// ========================
// Shift Definitions (UTC)
// ========================
const SHIFTS = [
  { name: 'Shift A', startHour: 8, endHour: 14, botOffset: 0, botCount: 50 },
  { name: 'Shift B', startHour: 14, endHour: 20, botOffset: 50, botCount: 50 },
  { name: 'Shift C', startHour: 20, endHour: 8, botOffset: 100, botCount: 50 }, // overnight
];

// ========================
// State
// ========================
const botState = new Map(); // botId -> { active, sessions, adsToday, status, pid }
let orchestratorStartDay = 1; // will be set from config or env
let currentWarmupPhase = 0;
let botProfiles = [];

function initProfiles() {
  botProfiles = generateAllProfiles();
  for (const p of botProfiles) {
    botState.set(p.botId, {
      active: false,
      sessions: 0,
      adsToday: 0,
      totalSessions: 0,
      totalAds: 0,
      lastActive: null,
      errors: 0,
    });
  }
  console.log(`[Orchestrator] Generated ${botProfiles.length} profiles`);
}

// ========================
// Warmup Logic
// ========================
function getWarmupPhase() {
  const day = orchestratorStartDay;
  for (let i = 0; i < WARMUP_SCHEDULE.length; i++) {
    const [min, max] = WARMUP_SCHEDULE[i].dayRange;
    if (day >= min && day <= max) return i;
  }
  return WARMUP_SCHEDULE.length - 1;
}

function getActiveBotCount() {
  if (ORCHESTRATOR_MODE === 'test') return 2; // minimal for testing
  if (ORCHESTRATOR_MODE === 'full') return 150;
  const phase = getWarmupPhase();
  return WARMUP_SCHEDULE[phase].activeBots;
}

function getClicksPerSession() {
  if (ORCHESTRATOR_MODE === 'test') return 2;
  if (ORCHESTRATOR_MODE === 'full') return 5;
  const phase = getWarmupPhase();
  return WARMUP_SCHEDULE[phase].clicksPerSession;
}

// ========================
// Shift Logic
// ========================
function getCurrentShift() {
  const now = new Date();
  const hour = now.getUTCHours();

  for (const shift of SHIFTS) {
    if (shift.endHour > shift.startHour) {
      if (hour >= shift.startHour && hour < shift.endHour) return shift;
    } else {
      // overnight shift (e.g., 20:00 - 08:00)
      if (hour >= shift.startHour || hour < shift.endHour) return shift;
    }
  }
  return SHIFTS[0];
}

function getBotsForShift() {
  const shift = getCurrentShift();
  const activeCount = getActiveBotCount();
  const eligible = [];

  for (let i = 0; i < activeCount; i++) {
    const botId = i + 1;
    const state = botState.get(botId);
    if (!state) continue;

    // Check daily session cap (3 per day max during warmup, 5 during full)
    const maxSessions = ORCHESTRATOR_MODE === 'full' ? 5 : 3;
    if (state.sessions >= maxSessions) continue;

    // Check daily ad cap
    const dailyCap = ORCHESTRATOR_MODE === 'test' ? 50 : 20;
    if (state.adsToday >= dailyCap) continue;

    eligible.push(botId);
  }

  // Pick up to botCount from eligible
  const shiftBots = eligible.slice(0, shift.botCount);
  return { shift, bots: shiftBots };
}

// ========================
// Bot Runner
// ========================
async function runBot(botId) {
  const profile = botProfiles[botId - 1];
  if (!profile) {
    console.error(`[Orchestrator] No profile for bot ${botId}`);
    return;
  }

  const state = botState.get(botId);
  if (!state) return;

  state.active = true;
  state.sessions++;
  state.totalSessions++;
  state.lastActive = new Date().toISOString();

  const adState = {
    adsToday: state.adsToday,
    dailyCap: ORCHESTRATOR_MODE === 'test' ? 30 : 20,
    clicksPerSession: getClicksPerSession(),
  };

  console.log(`[Orchestrator] Starting bot ${botId} (device: ${profile.device}, region: ${profile.vpnRegion})`);

  try {
    const startAds = state.adsToday;
    await runSession(profile, adState);
    state.adsToday = adState.adsToday;
    state.totalAds += adState.adsToday - startAds;
    state.errors = 0;
  } catch (err) {
    state.errors++;
    console.error(`[Orchestrator] Bot ${botId} error: ${err.message}`);
  } finally {
    state.active = false;
  }
}

// ========================
// Health Monitor
// ========================
function printStatus() {
  const now = new Date().toISOString();
  const activeBots = Array.from(botState.values()).filter(s => s.active).length;
  const totalSessions = Array.from(botState.values()).reduce((sum, s) => sum + s.totalSessions, 0);
  const totalAds = Array.from(botState.values()).reduce((sum, s) => sum + s.totalAds, 0);
  const errorBots = Array.from(botState.entries()).filter(([, s]) => s.errors > 3).length;

  const shift = getCurrentShift();
  const phase = getWarmupPhase();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`[Orchestrator] Status @ ${now}`);
  console.log(`  Mode:      ${ORCHESTRATOR_MODE}`);
  console.log(`  Day:       ${orchestratorStartDay}`);
  console.log(`  Phase:     ${WARMUP_SCHEDULE[phase].label}`);
  console.log(`  Shift:     ${shift.name} (${shift.startHour}:00-${shift.endHour}:00 UTC)`);
  console.log(`  Active:    ${activeBots} bots`);
  console.log(`  Sessions:  ${totalSessions} total`);
  console.log(`  Ads:       ${totalAds} total`);
  console.log(`  Errors:    ${errorBots} bots with >3 errors`);
  console.log(`${'='.repeat(50)}\n`);
}

// ========================
// Main Loop
// ========================
async function main() {
  console.log(`\n🚀 Ghost Farm Orchestrator v1.0`);
  console.log(`   Mode: ${ORCHESTRATOR_MODE}`);
  console.log(`   Game: ${GAME_URL}\n`);

  initProfiles();

  // Read day from env or default to 1
  orchestratorStartDay = parseInt(process.env.ORCHESTRATOR_DAY || '1', 10);

  // Print initial status
  printStatus();

  // Main loop
  let cycleCount = 0;
  while (true) {
    cycleCount++;
    const { shift, bots } = getBotsForShift();

    if (bots.length === 0) {
      console.log(`[Orchestrator] No bots eligible this cycle. Sleeping...`);
      await sleep(60000); // 1 minute
      continue;
    }

    console.log(`[Orchestrator] Cycle ${cycleCount}: Running ${bots.length} bots (${shift.name})`);

    // Run bots sequentially with delay
    for (const botId of bots) {
      await runBot(botId);
      await sleep(2000 + Math.random() * 5000);
    }

    // Print status every cycle
    printStatus();

    // Sleep between cycles (5-15 minutes randomized)
    const sleepMs = (5 + Math.floor(Math.random() * 10)) * 60 * 1000;
    console.log(`[Orchestrator] Sleeping ${Math.round(sleepMs/60000)} min until next cycle...\n`);
    await sleep(sleepMs);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Run
main().catch(err => {
  console.error('[Orchestrator] Fatal:', err);
  process.exit(1);
});