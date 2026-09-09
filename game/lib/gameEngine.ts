export interface PortfolioEntry {
  coin: string;
  amount: number;
  avgPrice: number;
}

export interface TradeLog {
  type: 'buy' | 'sell';
  coin: string;
  amount: number;
  price: number;
  timestamp: number;
}

let balance = 100000;
let portfolio: PortfolioEntry[] = [];
let tradeLog: TradeLog[] = [];
let level = 1;
let xp = 0;

export function getBalance() { return balance; }
export function getPortfolio() { return [...portfolio]; }
export function getTradeLog() { return [...tradeLog]; }
export function getLevel() { return level; }
export function getXp() { return xp; }

export function buyCoin(coin: string, amount: number, price: number): boolean {
  const cost = amount * price;
  if (cost > balance) return false;
  balance -= cost;
  const existing = portfolio.find(e => e.coin === coin);
  if (existing) {
    existing.avgPrice = ((existing.avgPrice * existing.amount) + (amount * price)) / (existing.amount + amount);
    existing.amount += amount;
  } else {
    portfolio.push({ coin, amount, avgPrice: price });
  }
  tradeLog.push({ type: 'buy', coin, amount, price, timestamp: Date.now() });
  addXp(Math.floor(cost / 100));
  return true;
}

export function sellCoin(coin: string, amount: number, price: number): boolean {
  const existing = portfolio.find(e => e.coin === coin);
  if (!existing || existing.amount < amount) return false;
  existing.amount -= amount;
  balance += amount * price;
  if (existing.amount < 0.00001) portfolio = portfolio.filter(e => e.coin !== coin);
  tradeLog.push({ type: 'sell', coin, amount, price, timestamp: Date.now() });
  addXp(Math.floor((amount * price) / 100));
  return true;
}

export function getPortfolioValue(prices: Record<string, { price: number }>): number {
  let total = balance;
  for (const entry of portfolio) {
    const coinPrice = prices[entry.coin]?.price || 0;
    total += entry.amount * coinPrice;
  }
  return total;
}

export function getTotalInvested(): number {
  let total = 0;
  for (const entry of portfolio) {
    total += entry.amount * entry.avgPrice;
  }
  return total;
}

function addXp(amount: number) {
  xp += amount;
  const needed = level * 100;
  if (xp >= needed) {
    level++;
    xp -= needed;
  }
}

export function getXpForNextLevel() { return level * 100; }

export function resetGame() {
  balance = 100000;
  portfolio = [];
  tradeLog = [];
  level = 1;
  xp = 0;
}