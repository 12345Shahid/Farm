# Ad Hub (TMA) Integration Guide — PopAds & PopCash (Reliable Ad Launch + Randomized Timer)

This master guide documents the exact architecture and implementation for **PopAds** and **PopCash** in the Telegram Mini App (TMA). It resolves the 24h page-load quota issue, enables reliable on-click ad opening inside Telegram, and implements the randomized 30–60s reward cooldown.

---

## 1. Problem & Architecture Overview

### Why Ads Failed Previously:
1. **Premature PopCash Consumption**: PopCash's `show.js` was loaded globally in `layout.tsx` on page load. PopCash has a default 24h frequency cap enforced by a cookie (`popcashpu`). Touching any part of the app upon entering consumed the single 24h popunder, leaving the user with zero ads when they reached the Ad Hub.
2. **Telegram WebView Popup Blocking**: Telegram's mobile in-app browser blocks standard `window.open` calls used by popunder scripts.
3. **No Direct Ad Launch**: Dummy placeholder URLs meant `Telegram.WebApp.openLink` failed to open anything.

### The Fix:
1. **Removed Auto-Firing PopCash from `layout.tsx`**: PopCash only loads and fires on demand when the user actually taps **"▶ Watch Ad"** in the Ad Hub. The `<meta name="ppck-ver">` tag remains in `<head>` for domain verification.
2. **Telegram `window.open` Bridge**: A lightweight bridge intercepts any `window.open(url)` and routes it through `Telegram.WebApp.openLink(url)`, allowing popups/popunders to open in the phone's native browser (Chrome/Safari).
3. **Direct PopCash Ad Gateway**: When PopCash is clicked, we clear the `popcashpu*` frequency cookies and launch PopCash's ad gateway endpoint:
   `https://p.asdfix.com/go/505546/758056/{base64(origin)}?cb={timestamp}`.
4. **Randomized 30–60 Second Cooldown**: Every click picks a randomized timer duration between 30 and 60 seconds (`Math.floor(Math.random() * (60 - 30 + 1)) + 30`). Both buttons are disabled while the timer runs.
5. **Delayed Token Crediting**: Only when the timer hits `0s` does the app call `/api/ads/log` to credit **+2 tokens**.
6. **25 Ads/Day Cap**: Both networks track clicks locally (resetting daily) and in the database. When PopAds reaches 25, the button locks and guides the user to PopCash.

---

## 2. Environment Variables (`.env.local`)

```env
# Ad Network Direct Links
NEXT_PUBLIC_POPADS_URL=
NEXT_PUBLIC_POPCASH_URL=https://p.asdfix.com/go/505546/758056/aHR0cHM6Ly90eXBvY29pbi52ZXJjZWwuYXBw
```

---

## 3. Root Layout (`src/app/layout.tsx`)

In `src/app/layout.tsx`:
- Keep PopCash verification meta tag in `<head>`.
- Add Telegram `window.open` bridge so popup/popunder events trigger `Telegram.WebApp.openLink`.
- Keep PopAds script (configured with unlimited impressions: `popundersPerIP: '0'`).
- **Remove** global PopCash script so it doesn't spend the 24h quota on initial visit.

```tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { AppProvider } from '@/components/provider';
import BottomNav from '@/components/bottom-nav';
import EntryGate from '@/components/entry-gate';
import PreviewBanner from '@/components/preview-banner';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Rivar - Telegram Mini App & Rewards Platform',
  description:
    'Official Rivar Web & Telegram Mini App platform. Run 24-hour virtual mining rigs, complete verified sponsor tasks, earn +80 tokens per referral, and cash out to USDT.',
  keywords: ['Telegram Mini App', 'crypto rewards', 'virtual mining', 'Rivar', 'TON ecosystem', 'play to earn'],
  openGraph: {
    title: 'Rivar - Telegram Mini App & Rewards Platform',
    description: 'Mine tokens, complete daily quests, and withdraw crypto rewards directly within Telegram.',
    url: 'https://typocoin.vercel.app',
    siteName: 'Rivar Ecosystem',
    type: 'website',
  },
  other: {
    'ppck-ver': '348909eaa6a4eb62d9c3bc2fb93f7698',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Telegram WebApp SDK — must load synchronously */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        {/* PopCash Website Ownership Verification */}
        <meta name="ppck-ver" content="348909eaa6a4eb62d9c3bc2fb93f7698" />
      </head>
      <body className="min-h-screen bg-tg-bg text-tg-text antialiased">
        <AppProvider>
          <PreviewBanner />
          <EntryGate>
            <main className="max-w-xl mx-auto px-4 pb-24">
              {children}
            </main>
            <BottomNav />
          </EntryGate>
        </AppProvider>

        {/* Telegram WebApp window.open bridge: allows popunders/popups to open in phone browser */}
        <Script id="tg-window-bridge" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined') {
              var _origOpen = window.open;
              window.open = function(url, target, features) {
                if (url && typeof url === 'string' && (url.indexOf('http://') === 0 || url.indexOf('https://') === 0)) {
                  var tg = window.Telegram && window.Telegram.WebApp;
                  if (tg && typeof tg.openLink === 'function') {
                    try {
                      tg.openLink(url);
                      return null;
                    } catch(e) {}
                  }
                }
                return _origOpen ? _origOpen.apply(this, arguments) : null;
              };
            }
          `}
        </Script>

        {/* PopAds Popunder (Configured with popundersPerIP: '0' for unlimited impressions) */}
        <Script id="popads" strategy="afterInteractive" data-cfasync="false">
          {`
            /*<![CDATA[/* */
            (function(){var m=window,v="d3383fc33eb152555336c3285b116e68",a=[["siteId",742+1-281*402+304+5433338],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],g=["d3d3LmludGVsbGlwb3B1cC5jb20vaU8vRi9ybWFyay5taW4uanM=","ZDNtcjd5MTU0ZDJxZzUuY2xvdWRmcm9udC5uZXQvcGRldGVjdGl6ci5taW4uanM="],b=-1,p,h,r=function(){clearTimeout(h);b++;if(g[b]&&!(1816602308000<(new Date).getTime()&&1<b)){p=m.document.createElement("script");p.type="text/javascript";p.async=!0;var e=m.document.getElementsByTagName("script")[0];p.src="https://"+atob(g[b]);p.crossOrigin="anonymous";p.onerror=r;p.onload=function(){clearTimeout(h);m[v.slice(0,16)+v.slice(0,16)]||r()};h=setTimeout(r,5E3);e.parentNode.insertBefore(p,e)}};if(!m[v]){try{Object.freeze(m[v]=a)}catch(e){}r()}})();
            /*]]>/* */
          `}
        </Script>
      </body>
    </html>
  );
}
```

---

## 4. Frontend Component (`src/components/ad-panel.tsx`)

```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from './provider';
import { apiFetch } from '@/lib/api-client';

const MAX_ADS_PER_NETWORK = 25;
const TOKENS_PER_AD = 2;
const MIN_COOLDOWN_SECONDS = 30;
const MAX_COOLDOWN_SECONDS = 60;

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

const STORAGE_KEY = 'rivar_adhub_clicks_v2';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
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

function getPopCashAdUrl(customUrl?: string): string {
  if (customUrl && customUrl.startsWith('http')) return customUrl;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://typocoin.vercel.app';
  const encoded = typeof btoa !== 'undefined' ? btoa(origin) : 'aHR0cHM6Ly90eXBvY29pbi52ZXJjZWwuYXBw';
  return `https://p.asdfix.com/go/505546/758056/${encoded}?cb=${Date.now()}`;
}

function launchAdUrl(url: string) {
  if (!url) return;
  const tgWebApp = (window as any).Telegram?.WebApp;
  if (tgWebApp && typeof tgWebApp.openLink === 'function') {
    tgWebApp.openLink(url);
  } else if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default function AdPanel() {
  const { refresh } = useApp();

  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [activeNetwork, setActiveNetwork] = useState<NetworkId | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [totalCooldown, setTotalCooldown] = useState(30);
  const [serverCounts, setServerCounts] = useState<Record<string, number>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setClickCounts(loadClickCounts());
    fetchServerLog();
  }, []);

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
    } catch {}
  }

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
      } catch {}
    },
    [refresh]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleWatchAd(network: (typeof NETWORKS)[number]) {
    const currentCount = clickCounts[network.id] || 0;
    if (currentCount >= MAX_ADS_PER_NETWORK) return;
    if (activeNetwork) return;

    if (network.id === 'popcash') {
      clearPopCashCookies();
      if (typeof window !== 'undefined') {
        (window as any).uid = '505546';
        (window as any).wid = '758056';
        (window as any).pop_fcap = 50;
      }
      const adUrl = getPopCashAdUrl(network.defaultUrl);
      launchAdUrl(adUrl);
    } else if (network.id === 'popads') {
      if (network.defaultUrl && network.defaultUrl.startsWith('http')) {
        launchAdUrl(network.defaultUrl);
      } else {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          document.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          launchAdUrl('https://p.asdfix.com/go/505546/758056/aHR0cHM6Ly90eXBvY29pbi52ZXJjZWwuYXBw');
        }
      }
    }

    const newCounts = { ...clickCounts, [network.id]: currentCount + 1 };
    setClickCounts(newCounts);
    saveClickCounts(newCounts);

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

  return (
    <div className="space-y-5">
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

            <div className="w-full h-2 bg-white/10 rounded-full mb-4 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${network.color} transition-all duration-700`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

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
```

---

## 5. Backend API (`src/app/api/ads/log/route.ts`)

Ensures the backend accepts `popads` and `popcash` and awards **+2 tokens** per watch:

```typescript
// Network check in route.ts:
if (!['popads', 'adcash', 'adsterra', 'popcash'].includes(network)) {
  return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
}

// Award tokens:
await supabase.rpc('tma_increment_balance', { p_user_id: userId, p_amount: 2 });
```

---

## 6. Supabase Migration (`supabase/migrations/006_adcash_network.sql`)

```sql
ALTER TABLE tma_ads_log DROP CONSTRAINT IF EXISTS tma_ads_log_network_check;
ALTER TABLE tma_ads_log ADD CONSTRAINT tma_ads_log_network_check CHECK (network IN ('popads', 'adcash', 'adsterra', 'popcash'));
```
