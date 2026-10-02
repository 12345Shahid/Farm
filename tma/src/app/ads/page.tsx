'use client';

import AdPanel from '@/components/ad-panel';

export default function AdsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-tg-text mb-4">📺 Ad Hub</h1>
      <p className="text-sm text-tg-hint mb-4">Earn +2 tokens per ad • Up to 25 ads per network daily</p>
      <AdPanel />
    </div>
  );
}