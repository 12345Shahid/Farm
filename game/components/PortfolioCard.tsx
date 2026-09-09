'use client';

import type { PortfolioEntry } from '@/lib/gameEngine';
import { getPrices } from '@/lib/priceFeed';

interface Props {
  portfolio: PortfolioEntry[];
}

export default function PortfolioCard({ portfolio }: Props) {
  const prices = getPrices();

  if (portfolio.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <span style={{ fontSize: 40 }}>📭</span>
        <p style={{ color: '#6b7280', marginTop: 8, fontSize: 14 }}>Empty portfolio</p>
        <p style={{ color: '#4a5568', fontSize: 12, marginTop: 4 }}>Start trading to build your crypto portfolio</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {portfolio.map(entry => {
        const currentPrice = prices[entry.coin]?.price || 0;
        const value = entry.amount * currentPrice;
        const profit = ((currentPrice - entry.avgPrice) / entry.avgPrice) * 100;
        const isUp = profit >= 0;
        return (
          <div key={entry.coin} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{entry.coin}</span>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {entry.amount.toFixed(6)} coins
              </div>
              <div style={{ fontSize: 11, color: '#4a5568' }}>
                Avg: ${entry.avgPrice.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>${value.toFixed(2)}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: isUp ? '#00c853' : '#ff1744' }}>
                {isUp ? '+' : ''}{profit.toFixed(2)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}