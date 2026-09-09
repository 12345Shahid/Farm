'use client';

export default function BannerAd() {
  return (
    <div
      id="banner-ad"
      className="banner-ad"
      aria-label="Advertisement"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
        <span style={{ background: '#ffd700', color: '#000', fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 2 }}>AD</span>
        <span style={{ fontSize: 11 }}>Sponsored · CryptoTrader Pro</span>
        <span style={{ fontSize: 11, color: '#1e7aff', fontWeight: 600 }}>Learn More ›</span>
      </div>
    </div>
  );
}