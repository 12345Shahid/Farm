'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import BannerAd from './BannerAd';
import RewardedVideo from './RewardedVideo';
import CTABanner from './CTABanner';
import { getAdState, triggerRewardedAd, skipAd, clickCta, dismissCta } from '@/lib/adManager';

export default function GameShell({ children }: { children: React.ReactNode }) {
  const [adState, setAdState] = useState(getAdState());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const s = getAdState();
      if (s.phase !== adState.phase || s.videoProgress !== adState.videoProgress || s.canSkip !== adState.canSkip) {
        setAdState(s);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [adState]);

  const handleSkip = useCallback(() => {
    skipAd();
    setAdState(getAdState());
    setRefreshKey(k => k + 1);
  }, []);

  const handleCtaClick = useCallback(() => {
    const { url } = clickCta();
    window.open(url, '_blank');
    setTimeout(() => {
      dismissCta();
      setAdState(getAdState());
      setRefreshKey(k => k + 1);
    }, 500);
  }, []);

  const handleClose = useCallback(() => {
    dismissCta();
    setAdState(getAdState());
    setRefreshKey(k => k + 1);
  }, []);

  const handleClaimBonus = useCallback(() => {
    triggerRewardedAd();
    setAdState(getAdState());
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <div className="game-container">
      <Header />
      <div className="game-content" key={refreshKey}>
        {children}
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <button
            id="claim-bonus-btn"
            className="btn btn-gold claim-bonus"
            onClick={handleClaimBonus}
            style={{ width: '100%', maxWidth: 300 }}
          >
            🎁 Claim Bonus Reward
          </button>
        </div>
      </div>
      <BannerAd />
      {(adState.phase === 'video_countdown' || adState.phase === 'video_showing' || adState.phase === 'video_ended') && (
        <RewardedVideo
          progress={adState.videoProgress}
          canSkip={adState.canSkip}
          onSkip={handleSkip}
        />
      )}
      {(adState.phase === 'cta_showing') && (
        <CTABanner
          ctaText={adState.ctaText}
          onCtaClick={handleCtaClick}
          onClose={handleClose}
        />
      )}
    </div>
  );
}