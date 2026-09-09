// Chaos Engine — behavioral randomization to avoid pattern detection

// Game interaction templates
const GAME_ACTIONS = [
  { action: 'viewDashboard', duration: [30, 180], weight: 3 },
  { action: 'viewPrices', duration: [10, 60], weight: 2 },
  { action: 'openTrade', duration: [20, 120], weight: 2 },
  { action: 'buyCoin', duration: [15, 45], weight: 1 },
  { action: 'sellCoin', duration: [15, 45], weight: 1 },
  { action: 'viewPortfolio', duration: [15, 90], weight: 2 },
  { action: 'viewSettings', duration: [5, 30], weight: 0.3 },
  { action: 'clickClaimBonus', duration: [2, 8], weight: 0 }, // triggers ad
];

const AD_ACTIONS = [
  { action: 'watchAd', duration: [5, 12], weight: 1 },
  { action: 'skipAd', duration: [3, 8], weight: 2 },
  { action: 'clickCta', duration: [3, 10], weight: 2 },
  { action: 'browseAdPage', duration: [5, 15], weight: 1 },
  { action: 'closeAdPage', duration: [1, 3], weight: 0 },
];

/**
 * Chaos Engine — picks the next action based on weighted probability
 * @param {Array} actions - list of action templates    
 * @returns {object} - selected action with randomized duration
 */
function pickAction(actions) {
  const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const action of actions) {
    roll -= action.weight;
    if (roll <= 0) {
      const [min, max] = action.duration;
      const duration = Math.floor(Math.random() * (max - min + 1)) + min;
      return { ...action, duration };
    }
  }
  return { ...actions[0], duration: actions[0].duration[0] };
}

/**
 * Generate a non-linear game session plan
 * @param {number} seed - bot personality seed
 * @returns {Array<object>} - sequence of actions
 */
function generateSessionPlan(seed) {
  const rng = seededRandom(seed);
  const plan = [];
  const sessionLength = Math.floor(rng() * 8 + 4); // 4-12 actions per session
  let adCount = 0;
  const maxAds = Math.floor(rng() * 5 + 2); // 2-6 ads per session

  for (let i = 0; i < sessionLength; i++) {
    // Decide: game action or ad trigger?
    if (adCount < maxAds && (rng() < 0.35 || i === sessionLength - 1)) {
      plan.push({ type: 'game', action: 'clickClaimBonus', duration: 2 + Math.floor(rng() * 6) });
      adCount++;
      // Add ad interaction sub-actions
      plan.push({ type: 'ad', action: 'watchAd', duration: 5 + Math.floor(rng() * 7) });
      if (rng() > 0.2) plan.push({ type: 'ad', action: 'skipAd', duration: 3 + Math.floor(rng() * 5) });
      if (rng() > 0.4) {
        plan.push({ type: 'ad', action: 'clickCta', duration: 3 + Math.floor(rng() * 7) });
        plan.push({ type: 'ad', action: 'browseAdPage', duration: 5 + Math.floor(rng() * 10) });
        plan.push({ type: 'ad', action: 'closeAdPage', duration: 1 + Math.floor(rng() * 2) });
      }
    } else {
      const gameAction = pickAction(GAME_ACTIONS);
      plan.push({ type: 'game', ...gameAction });
    }
  }

  return plan;
}

function seededRandom(seed) {
  let hash = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash = hash & hash;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

module.exports = { generateSessionPlan, pickAction, seededRandom };