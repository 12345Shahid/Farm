'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from './provider';
import { apiFetch } from '@/lib/api-client';

// ─── Config ──────────────────────────────────────────────────────────────────
const MAX_ADS_PER_NETWORK = 25;
const TOKENS_PER_AD = 2;
const MIN_COOLDOWN_SECONDS = 30;
const MAX_COOLDOWN_SECONDS = 60;

// The two approved ad networks
const NETWORKS = [
  {
    id: 'popads',
    label: 'PopAds',
    icon: '🟠',
    color: 'from-orange-500 to-amber-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    defaultUrl: process.env.NEXT_PUBLIC_POPADS_URL || '',
  },
  {
    id: 'popcash',
    label: 'PopCash',
    icon: '🟣',
    color: 'from-purple-500 to-indigo-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    defaultUrl: process.env.NEXT_PUBLIC_POPCASH_URL || '',
  },
] as const;

type NetworkId = (typeof NETWORKS)[number]['id'];

// ─── Local Storage Daily Tracking ───────────────────────────────────────────
const STORAGE_KEY = 'rivar_adhub_clicks_v2';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function loadClickCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return {};
    return parsed.counts || {};
  } catch {
    return {};
  }
}

function saveClickCounts(counts: Record<string, number>) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: getTodayKey(), counts })
    );
  } catch {}
}

// ─── Helper: Clear PopCash 24h Frequency Cap Cookies ─────────────────────────
function clearPopCashCookies() {
  if (typeof document === 'undefined') return;
  const cookieNames = [
    'popcashpu',
    'popcashpu0',
    'popcashpu1',
    'popcashpu2',
    'popcashpu3',
    'popcashpu4',
    'popcashpu5',
  ];
  const hostname = window.location.hostname;
  cookieNames.forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname};`;
  });
}

// ─── Helper: Compute Direct PopCash Ad Gateway URL ───────────────────────────
function getPopCashAdUrl(customUrl?: string): string {
  if (customUrl && customUrl.startsWith('http')) return customUrl;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://typocoin.vercel.app';
  const encoded = typeof btoa !== 'undefined' ? btoa(origin) : 'aHR0cHM6Ly90eXBvY29pbi52ZXJjZWwuYXBw';
  // Official PopCash ad gateway endpoint for approved uid 505546 & wid 758056
  return `https://p.asdfix.com/go/505546/758056/${encoded}?cb=${Date.now()}`;
}

// ─── Helper: Open Link in Telegram or Browser ───────────────────────────────
function launchAdUrl(url: string) {
  if (!url) return;
  const tgWebApp = (window as any).Telegram?.WebApp;
  if (tgWebApp && typeof tgWebApp.openLink === 'function') {
    tgWebApp.openLink(url);
  } else if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdPanel() {
  const { refresh } = useApp();

  // Daily click counts (persists across refreshes, resets daily)
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  // Active cooldown state
  const [activeNetwork, setActiveNetwork] = useState<NetworkId | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [totalCooldown, setTotalCooldown] = useState(30);

  // Server-side logged counts
  const [serverCounts, setServerCounts] = useState<Record<string, number>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load counts on mount
  useEffect(() => {
    setClickCounts(loadClickCounts());
    fetchServerLog();
  }, []);

  // Fetch server log for database alignment
  async function fetchServerLog() {
    try {
      const res = await apiFetch('/api/ads/log');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, number> = {};
        data.forEach((d: { network: string; ads_watched_today: number }) => {
          map[d.network] = d.ads_watched_today;
        });
        setServerCounts(map);
      }
    } catch {
      // Non-fatal
    }
  }

  // Credit tokens after cooldown completes
  const creditTokens = useCallback(
    async (networkId: NetworkId) => {
      try {
        const res = await apiFetch('/api/ads/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ network: networkId, tokens: TOKENS_PER_AD }),
        });
        if (res.ok) {
          await refresh();
          await fetchServerLog();
        }
      } catch {
        // Silently handled
      }
    },
    [refresh]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Watch Ad Handler ──────────────────────────────────────────────────────
  function handleWatchAd(network: (typeof NETWORKS)[number]) {
    const currentCount = clickCounts[network.id] || 0;
    if (currentCount >= MAX_ADS_PER_NETWORK) return;
    if (activeNetwork) return; // cooldown in progress

    // 1. TRIGGER THE AD IMMEDIATELY
    if (network.id === 'popcash') {
      // Clear any 24h frequency cookies so an ad displays every single time
      clearPopCashCookies();

      // Configure PopCash frequency cap in window object
      if (typeof window !== 'undefined') {
        (window as any).uid = '505546';
        (window as any).wid = '758056';
        (window as any).pop_fcap = 50;
      }

      // Open the ad immediately
      const adUrl = getPopCashAdUrl(network.defaultUrl);
      launchAdUrl(adUrl);
    } else if (network.id === 'popads') {
      // If a custom direct link exists, open it directly
      if (network.defaultUrl && network.defaultUrl.startsWith('http')) {
        launchAdUrl(network.defaultUrl);
      } else {
        // Trigger PopAds JavaScript popunder listener via synthetic click
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          document.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          // If Telegram WebApp is active, also trigger fallback popunder opener
          launchAdUrl('https://p.asdfix.com/go/505546/758056/aHR0cHM6Ly90eXBvY29pbi52ZXJjZWwuYXBw');
        }
      }
    }

    // 2. INCREMENT DAILY CLICK COUNT
    const newCounts = { ...clickCounts, [network.id]: currentCount + 1 };
    setClickCounts(newCounts);
    saveClickCounts(newCounts);

    // 3. START RANDOMIZED 30-60 SECOND COOLDOWN TIMER
    const randomizedSeconds =
      Math.floor(Math.random() * (MAX_COOLDOWN_SECONDS - MIN_COOLDOWN_SECONDS + 1)) +
      MIN_COOLDOWN_SECONDS;

    setActiveNetwork(network.id);
    setCountdown(randomizedSeconds);
    setTotalCooldown(randomizedSeconds);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setActiveNetwork(null);
          creditTokens(network.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Notice Banner */}
      <div className="rounded-xl p-3 bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <span className="text-xl mt-0.5">📺</span>
        <p className="text-xs text-tg-hint leading-relaxed">
          Tapping <strong className="text-tg-text">Watch Ad</strong> opens the advertisement. Keep the app open while the 30–60s timer runs to receive{' '}
          <strong className="text-tg-text">+{TOKENS_PER_AD} tokens</strong>.
        </p>
      </div>

      {NETWORKS.map((network) => {
        const localCount = clickCounts[network.id] || 0;
        const watched = Math.max(localCount, serverCounts[network.id] || 0);
        const remaining = MAX_ADS_PER_NETWORK - watched;
        const isDone = remaining <= 0;
        const isCoolingDown = activeNetwork === network.id;
        const isOtherCooling = activeNetwork !== null && activeNetwork !== network.id;
        const isDisabled = isDone || isCoolingDown || isOtherCooling;

        const progressPct = Math.min(100, (watched / MAX_ADS_PER_NETWORK) * 100);

        return (
          <div
            key={network.id}
            className={`rounded-2xl border p-5 transition-all ${network.bgColor} ${network.borderColor}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{network.icon}</span>
                <div>
                  <h3 className="font-bold text-tg-text">{network.label}</h3>
                  <p className="text-xs text-tg-hint">+{TOKENS_PER_AD} tokens per ad</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-bold ${
                    isDone ? 'text-green-400' : 'text-tg-text'
                  }`}
                >
                  {watched}
                  <span className="text-tg-hint font-normal">/{MAX_ADS_PER_NETWORK}</span>
                </span>
                <p className="text-xs text-tg-hint">today</p>
              </div>
            </div>

            {/* Daily Progress Bar */}
            <div className="w-full h-2 bg-white/10 rounded-full mb-4 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${network.color} transition-all duration-700`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Cooldown Timer Bar (Only shown during active countdown) */}
            {isCoolingDown && (
              <div className="mb-4">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all duration-1000"
                    style={{
                      width: `${((totalCooldown - countdown) / totalCooldown) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Watch Ad Button */}
            <button
              id={`adhub-btn-${network.id}`}
              onClick={() => handleWatchAd(network)}
              disabled={isDisabled}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-95 select-none ${
                isDone
                  ? 'bg-white/10 text-tg-hint cursor-not-allowed border border-white/10'
                  : isCoolingDown
                  ? 'bg-blue-500/20 text-blue-300 cursor-not-allowed border border-blue-400/30'
                  : isOtherCooling
                  ? 'bg-white/5 text-tg-hint cursor-not-allowed'
                  : `bg-gradient-to-r ${network.color} text-white shadow-lg cursor-pointer hover:opacity-90`
              }`}
            >
              {isDone ? (
                network.id === 'popads' ? (
                  '✅ Cap Reached — Use PopCash Below 👇'
                ) : (
                  '✅ 25/25 All Ads Completed Today'
                )
              ) : isCoolingDown ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                  Reward processing... {countdown}s
                </span>
              ) : isOtherCooling ? (
                'Wait for current ad to finish...'
              ) : (
                `▶ Watch Ad (+${TOKENS_PER_AD} Tokens)`
              )}
            </button>

            {/* Helper Guidance Text */}
            {isDone ? (
              <p className="text-xs text-center mt-2 font-medium">
                {network.id === 'popads' ? (
                  <span className="text-amber-400">
                    25/25 PopAds watched! Click <strong>PopCash</strong> below to keep earning today.
                  </span>
                ) : (
                  <span className="text-emerald-400">
                    25/25 PopCash watched! All daily rewards completed. Check back tomorrow!
                  </span>
                )}
              </p>
            ) : !isCoolingDown ? (
              <p className="text-xs text-center text-tg-hint mt-2">
                {remaining} ad{remaining !== 1 ? 's' : ''} remaining today
              </p>
            ) : null}
          </div>
        );
      })}

      <p className="text-xs text-center text-tg-hint px-4">
        Ads display in your device browser. Return to the app to collect your tokens once the countdown finishes.
      </p>
    </div>
  );
}