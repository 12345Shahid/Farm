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