'use client';

import { useState, useEffect } from 'react';
import GameShell from '@/components/GameShell';
import { getPrices, COIN_LIST } from '@/lib/priceFeed';
import { getBalance, getPortfolio, buyCoin, sellCoin } from '@/lib/gameEngine';

export default function Trade() {
  const [prices, setPrices] = useState(getPrices());
  const [balance, setBalance] = useState(getBalance());
  const [portfolio, setPortfolio] = useState(getPortfolio());
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices({ ...getPrices() });
      setBalance(getBalance());
      setPortfolio([...getPortfolio()]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentPrice = prices[selectedCoin]?.price || 0;
  const maxBuy = balance / currentPrice;
  const holding = portfolio.find(e => e.coin === selectedCoin);
  const maxSell = holding?.amount || 0;

  function handleSubmit() {
    const qty = parseFloat(amount);
    if (!qty || qty <= 0) { setMessage('Enter a valid amount'); return; }

    let success = false;
    if (mode === 'buy') {
      success = buyCoin(selectedCoin, qty, currentPrice);
      setMessage(success ? `Bought ${qty} ${selectedCoin} at $${currentPrice.toFixed(2)}` : 'Insufficient balance');
    } else {
      success = sellCoin(selectedCoin, qty, currentPrice);
      setMessage(success ? `Sold ${qty} ${selectedCoin} at $${currentPrice.toFixed(2)}` : 'Insufficient coins');
    }
    if (success) {
      setBalance(getBalance());
      setPortfolio([...getPortfolio()]);
    }
    setTimeout(() => setMessage(''), 3000);
  }

  return (
    <GameShell>
      <div style={{ padding: '0 16px' }}>
        {/* Quick Balance */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, marginBottom: 12, fontSize: 14 }}>
          <span style={{ color: '#6b7280' }}>Available Balance</span>
          <span style={{ fontWeight: 700 }}>${balance.toFixed(2)}</span>
        </div>

        {/* Coin Selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {COIN_LIST.map(coin => (
            <button
              key={coin}
              onClick={() => setSelectedCoin(coin)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${selectedCoin === coin ? '#1e7aff' : '#1e2a45'}`,
                background: selectedCoin === coin ? '#1e2744' : 'transparent',
                color: selectedCoin === coin ? '#1e7aff' : '#e0e6f0',
                fontWeight: selectedCoin === coin ? 700 : 400,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {coin} ${currentPrice.toFixed(coin === 'ADA' ? 4 : 2)}
            </button>
          ))}
        </div>

        {/* Buy/Sell Tabs */}
        <div className="buy-sell-tab">
          <button className={mode === 'buy' ? 'active-buy' : 'inactive'} onClick={() => setMode('buy')}>Buy</button>
          <button className={mode === 'sell' ? 'active-sell' : 'inactive'} onClick={() => setMode('sell')}>Sell</button>
        </div>

        {/* Amount Input */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            {mode === 'buy' ? `Max buy: ${maxBuy.toFixed(6)} ${selectedCoin}` : `Max sell: ${maxSell.toFixed(6)} ${selectedCoin}`}
          </div>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            step="any"
            style={{
              width: '100%',
              background: '#0a0e17',
              border: '1px solid #1e2a45',
              borderRadius: 8,
              padding: '12px 16px',
              color: 'white',
              fontSize: 20,
              fontWeight: 700,
              fontFamily: 'Courier New, monospace',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {[0.25, 0.5, 0.75, 1].map(f => (
              <button
                key={f}
                onClick={() => {
                  const max = mode === 'buy' ? maxBuy : maxSell;
                  setAmount((max * f).toFixed(6));
                }}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: 4,
                  background: '#1e2a45',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {Math.round(f * 100)}%
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          id={`trade-${mode}-btn`}
          className={`btn ${mode === 'buy' ? 'btn-success' : 'btn-danger'}`}
          onClick={handleSubmit}
          style={{ width: '100%', padding: 14, fontSize: 16 }}
        >
          {mode === 'buy' ? `Buy ${selectedCoin}` : `Sell ${selectedCoin}`}
        </button>

        {/* Message */}
        {message && (
          <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#1a2b1a', fontSize: 13, textAlign: 'center' }}>
            {message}
          </div>
        )}

        {/* Quick Info */}
        <div style={{ marginTop: 12, marginBottom: 16, fontSize: 12, color: '#4a5568', lineHeight: 1.6 }}>
          <div>1 {selectedCoin} = ${currentPrice.toFixed(2)}</div>
          <div>24h change: <span className={prices[selectedCoin].change24h >= 0 ? 'price-up' : 'price-down'}>{prices[selectedCoin].change24h.toFixed(2)}%</span></div>
        </div>
      </div>
    </GameShell>
  );
}