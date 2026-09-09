'use client';

interface Props {
  ctaText: string;
  onCtaClick: () => void;
  onClose: () => void;
}

export default function CTABanner({ ctaText, onCtaClick, onClose }: Props) {
  return (
    <div className="ad-overlay" id="cta-overlay" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="ad-container" style={{ padding: 24, textAlign: 'center' }}>
        <div className="ad-badge">SPONSORED</div>
        <div style={{ marginTop: 32, marginBottom: 16 }}>
          <span style={{ fontSize: 48 }}>🚀</span>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>CryptoTrader Pro</h3>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8, lineHeight: 1.4 }}>
            The #1 trading platform. Zero fees, instant deposits, AI-powered signals.
          </p>
        </div>
        <button
          id="cta-install-btn"
          className="ad-cta-btn"
          onClick={onCtaClick}
        >
          {ctaText}
        </button>
        <button
          id="cta-close-btn"
          style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: 8 }}
          onClick={onClose}
        >
          Not interested
        </button>
      </div>
    </div>
  );
}