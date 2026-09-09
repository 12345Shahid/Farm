const COINS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
const BASE_PRICES: Record<string, number> = {
  BTC: 67500, ETH: 3400, SOL: 145, ADA: 0.45, DOT: 7.20,
};

// Generate realistic-ish price movements
let prices = { ...BASE_PRICES };
let lastUpdate = Date.now();

function randomWalk(current: number, volatility: number): number {
  const change = (Math.random() - 0.498) * volatility;
  const newPrice = current + change;
  return newPrice > 0 ? newPrice : current * 0.99;
}

export function getPrices(): Record<string, { price: number; change24h: number }> {
  const now = Date.now();
  if (now - lastUpdate > 500) {
    lastUpdate = now;
    for (const coin of COINS) {
      const vol = coin === 'BTC' ? 120 : coin === 'ETH' ? 40 : 3;
      prices[coin] = randomWalk(prices[coin], vol);
    }
  }
  const result: Record<string, { price: number; change24h: number }> = {};
  for (const coin of COINS) {
    const change24h = ((prices[coin] - BASE_PRICES[coin]) / BASE_PRICES[coin]) * 100;
    result[coin] = { price: prices[coin], change24h };
  }
  return result;
}

export function getPrice(coin: string): number {
  return prices[coin] || 0;
}

export const COIN_LIST = COINS;
export function resetPrices() { prices = { ...BASE_PRICES }; }