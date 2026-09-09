'use client';

import GameShell from '@/components/GameShell';
import PriceChart from '@/components/PriceChart';
import { getPrices, COIN_LIST } from '@/lib/priceFeed';
import { getBalance, getPortfolio, getPortfolioValue, getLevel, getXp, getXpForNextLevel } from '@/lib/gameEngine';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [prices, setPrices] = useState(getPrices());
  const [balance, setBalance] = useState(getBalance());
  const [portfolio, setPortfolio] = useState(getPortfolio());
  const [level, setLevel] = useState(getLevel());
  const [xp, setXp] = useState(getXp());

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices({ ...getPrices() });
      setBalance(getBalance());
      setPortfolio([...getPortfolio()]);
      setLevel(getLevel());
      setXp(getXp());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalValue = getPortfolioValue(prices);
  const totalInvested = portfolio.reduce((sum, e) => sum + e.amount * e.avgPrice, 0);
  const totalProfit = totalInvested > 0 ? ((totalValue - balance - totalInvested) / totalInvested) * 100 : 0;

  return (
    <GameShell>
      <div style={{ padding: '0 16px' }}>
        {/* Portfolio Summary */}
        <div className="card" style={{ marginTop: 16, textAlign: 'center', background: 'linear-gradient(135deg, #1a2744, #131a2b)' }}>
          <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Portfolio Value</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {totalInvested > 0 && (
            <div style={{ fontSize: 14, fontWeight: 600, color: totalProfit >= 0 ? '#00c853' : '#ff1744', marginTop: 4 }}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}% all time
            </div>
          )}
          <div style={{ fontSize: 11, color: '#4a5568', marginTop: 4 }}>
            Balance: ${balance.toFixed(2)} · Invested: ${totalInvested.toFixed(2)}
          </div>
        </div>

        {/* Level Progress */}
        <div style={{ marginTop: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
            <span>Level {level}</span>
            <span>{xp} / {getXpForNextLevel()} XP</span>
          </div>
          <div style={{ height: 6, background: '#1e2a45', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (xp / getXpForNextLevel()) * 100)}%`, background: '#1e7aff', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Price Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {COIN_LIST.map(coin => (
            <PriceChart
              key={coin}
              label={coin}
              price={prices[coin].price}
              change={prices[coin].change24h}
            />
          ))}
        </div>

        {/* Recent Trades Preview */}
        <div style={{ marginTop: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#9ca3af' }}>Market Overview</h3>
          <div style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.6 }}>
            BTC dominance: 58.2% · Total market cap: $2.4T · 24h volume: $82.1B
          </div>
        </div>
      </div>
    </GameShell>
  );
}