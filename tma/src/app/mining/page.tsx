'use client';

import MiningPanel from '@/components/mining-panel';

export default function MiningPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-tg-text mb-4">⛏️ Mining</h1>
      <MiningPanel />
    </div>
  );
}