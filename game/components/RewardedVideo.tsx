'use client';

interface Props {
  progress: number;
  canSkip: boolean;
  onSkip: () => void;
}

export default function RewardedVideo({ progress, canSkip, onSkip }: Props) {
  return (
    <div className="ad-overlay" id="video-ad-overlay">
      <div className="ad-container">
        <div className="ad-badge">AD</div>
        {canSkip && (
          <button
            id="skip-ad-btn"
            className="ad-skip-btn"
            onClick={onSkip}
          >
            Skip Ad
          </button>
        )}
        <div className="ad-video-placeholder">
          <span style={{ fontSize: 40, opacity: 0.3 }}>▶</span>
          <span style={{ fontSize: 13, opacity: 0.5 }}>CryptoTrader Pro - Advanced Trading Platform</span>
          <span style={{ fontSize: 11, opacity: 0.3 }}>{Math.floor(progress / 10)}s / 10s</span>
          <div style={{ width: '80%', height: 4, background: '#333', borderRadius: 2, marginTop: 8 }}>
            <div className="ad-progress" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {/* CTAs rendered separately after video ends */}
      </div>
    </div>
  );
}