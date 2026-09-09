'use client';

import { useState, useEffect } from 'react';
import GameShell from '@/components/GameShell';
import PortfolioCard from '@/components/PortfolioCard';
import { getPortfolio, getBalance, getTradeLog } from '@/lib/gameEngine';
import { getPrices } from '@/lib/priceFeed';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(getPortfolio());
  const [balance, setBalance] = useState(getBalance());
  const [tradeLog, setTradeLog] = useState(getTradeLog());
  const [prices, setPrices] = useState(getPrices());

  useEffect(() => {
    const interval = setInterval(() => {
      setPortfolio([...getPortfolio()]);
      setBalance(getBalance());
      setTradeLog([...getTradeLog()]);
      setPrices({ ...getPrices() });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GameShell>
      <div style={{ padding: '0 16px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 16, marginBottom: 12 }}>My Portfolio</h2>
        <PortfolioCard portfolio={portfolio} />

        {/* Balance Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '12px 16px', background: '#131a2b', borderRadius: 8 }}>
          <span style={{ color: '#6b7280', fontSize: 13 }}>Cash Balance</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>${balance.toFixed(2)}</span>
        </div>

        {/* Trade History */}
        <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8, color: '#9ca3af' }}>Trade History</h3>
        <div style={{ marginBottom: 16 }}>
          {tradeLog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#4a5568', fontSize: 13 }}>
              No trades yet. Start trading!
            </div>
          ) : (
            tradeLog.slice(-10).reverse().map((log, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #1e2a45', fontSize: 13 }}>
                <div>
                  <span style={{ color: log.type === 'buy' ? '#00c853' : '#ff1744', fontWeight: 600 }}>
                    {log.type === 'buy' ? 'BUY' : 'SELL'}
                  </span>
                  <span style={{ color: '#6b7280', marginLeft: 4 }}>{log.coin}</span>
                </div>
                <div>
                  <span>{log.amount.toFixed(4)} @ ${log.price.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </GameShell>
  );
}