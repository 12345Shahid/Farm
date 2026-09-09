export type AdPhase = 'idle' | 'banner' | 'video_countdown' | 'video_showing' | 'video_ended' | 'cta_showing' | 'cta_clicked';

export interface AdState {
  phase: AdPhase;
  videoProgress: number;
  canSkip: boolean;
  ctaText: string;
  ctaUrl: string;
}

const CTA_OPTIONS = [
  { text: 'Install Now', url: 'https://play.google.com/store/apps/details?id=com.crypto.trader' },
  { text: 'Download', url: 'https://apps.apple.com/app/crypto-trader' },
  { text: 'Get Started Free', url: 'https://crypto-trader.com/signup' },
  { text: 'Trade Now', url: 'https://example-exchange.com/register' },
  { text: 'Claim Your Bonus', url: 'https://crypto-bonus.com/claim' },
];

let state: AdState = {
  phase: 'banner',
  videoProgress: 0,
  canSkip: false,
  ctaText: CTA_OPTIONS[0].text,
  ctaUrl: CTA_OPTIONS[0].url,
};

let videoTimer: ReturnType<typeof setInterval> | null = null;
let skipTimer: ReturnType<typeof setTimeout> | null = null;

export function getAdState(): AdState {
  return { ...state, videoProgress: state.videoProgress };
}

export function triggerRewardedAd() {
  if (state.phase !== 'banner') return;
  state = { ...state, phase: 'video_countdown', videoProgress: 0, canSkip: false };
  state.ctaText = CTA_OPTIONS[Math.floor(Math.random() * CTA_OPTIONS.length)].text;
  state.ctaUrl = CTA_OPTIONS[Math.floor(Math.random() * CTA_OPTIONS.length)].url;

  // Simulate video progress
  let progress = 0;
  videoTimer = setInterval(() => {
    progress += 2;
    state = { ...state, videoProgress: progress, phase: progress >= 100 ? 'video_ended' : 'video_showing' };
    if (progress >= 100 && videoTimer) {
      clearInterval(videoTimer);
      videoTimer = null;
    }
  }, 100);

  // Allow skip after 3 seconds
  skipTimer = setTimeout(() => {
    state = { ...state, canSkip: true };
  }, 3000);
}

export function skipAd() {
  if (!state.canSkip) return;
  if (videoTimer) { clearInterval(videoTimer); videoTimer = null; }
  if (skipTimer) { clearTimeout(skipTimer); skipTimer = null; }
  state = { ...state, phase: 'cta_showing', videoProgress: 100 };
}

export function clickCta(): { url: string } {
  state = { ...state, phase: 'cta_clicked' };
  return { url: state.ctaUrl };
}

export function dismissCta() {
  if (videoTimer) { clearInterval(videoTimer); videoTimer = null; }
  if (skipTimer) { clearTimeout(skipTimer); skipTimer = null; }
  state = { phase: 'banner', videoProgress: 0, canSkip: false, ctaText: state.ctaText, ctaUrl: state.ctaUrl };
}

export function resetAdState() {
  if (videoTimer) { clearInterval(videoTimer); videoTimer = null; }
  if (skipTimer) { clearTimeout(skipTimer); skipTimer = null; }
  state = { phase: 'banner', videoProgress: 0, canSkip: false, ctaText: CTA_OPTIONS[0].text, ctaUrl: CTA_OPTIONS[0].url };
}