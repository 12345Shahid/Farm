'use client';

import { useApp } from './provider';

export default function PreviewBanner() {
  const { isTelegram, isDemoMode, exitDemoMode } = useApp();
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'ProjectRiver_bot';

  // Do not show banner when opened inside real Telegram WebApp
  if (isTelegram) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-3 py-2 text-xs shadow-sm sticky top-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="flex h-2 w-2 relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="font-semibold">Web Preview Mode</span>
          <span className="hidden sm:inline text-white/80">— Run real 24h mining & cash out on Telegram:</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isDemoMode && (
            <button
              onClick={exitDemoMode}
              className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[11px] font-medium transition-colors"
            >
              Back to Overview
            </button>
          )}
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-full bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors shadow-sm text-[11px] flex items-center gap-1"
          >
            <span>Open in Telegram</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
