'use client';

import { useApp } from '@/components/provider';
import BalanceCard from '@/components/balance-card';
import CheckInButton from '@/components/check-in-button';
import ReferralButton from '@/components/referral-button';
import LandingShowcase from '@/components/landing-showcase';

export default function HomePage() {
  const { user, isDemoMode } = useApp();

  // If user is authenticated (via Telegram or Demo Mode), show dashboard
  if (user) {
    return (
      <div className="space-y-4 pt-2">
        {isDemoMode && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
            <span>🎮 <strong>Demo Dashboard</strong> — exploring with mock tokens.</span>
            <a
              href={`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || 'ProjectRiver_bot'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline ml-2"
            >
              Open Real App ↗
            </a>
          </div>
        )}

        <BalanceCard balance={user.balance} />
        <CheckInButton />
        <ReferralButton />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xl font-bold text-tg-text">{user.check_in_streak}</p>
            <p className="text-xs text-tg-hint mt-0.5">Day Streak</p>
          </div>
          <div className="p-3.5 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xl font-bold text-tg-text">+80</p>
            <p className="text-xs text-tg-hint mt-0.5">Per Referral</p>
          </div>
        </div>
      </div>
    );
  }

  // During SSR or when outside Telegram, render the rich LandingShowcase in static HTML!
  return <LandingShowcase />;
}