'use client';

import GameShell from '@/components/GameShell';
import { resetGame } from '@/lib/gameEngine';
import { resetPrices } from '@/lib/priceFeed';
import { resetAdState } from '@/lib/adManager';
import { useState } from 'react';

export default function Settings() {
  const [resetMsg, setResetMsg] = useState('');

  function handleReset() {
    resetGame();
    resetPrices();
    resetAdState();
    setResetMsg('Game reset successfully!');
    setTimeout(() => setResetMsg(''), 3000);
  }

  return (
    <GameShell>
      <div style={{ padding: '0 16px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 16, marginBottom: 16 }}>Settings</h2>

        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Account</div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>
            <div>Username: Trader_001</div>
            <div>Member since: March 2025</div>
            <div>Total trades: View on Portfolio page</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Notifications</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#1e7aff' }} />
              Price alerts
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#1e7aff' }} />
              Trade confirmations
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#1e7aff' }} />
              Bonus rewards
            </label>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>About</div>
          <div style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.6 }}>
            <div>Crypto Trader Tycoon v1.3.2</div>
            <div>Built with Next.js · Portfolio simulator for educational purposes</div>
            <div style={{ marginTop: 8 }}>
              Keywords: Bitcoin, Crypto, Trading, Invest, Portfolio, Ethereum, Blockchain, Finance, Stock Market, Margin Trading
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#ff1744' }}>Danger Zone</div>
          <button
            id="reset-game-btn"
            className="btn btn-danger"
            onClick={handleReset}
            style={{ width: '100%' }}
          >
            Reset Game
          </button>
          {resetMsg && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#00c853', textAlign: 'center' }}>{resetMsg}</div>
          )}
        </div>
      </div>
    </GameShell>
  );
}