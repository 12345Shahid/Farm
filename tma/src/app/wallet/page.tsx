'use client';

import { useApp } from '@/components/provider';
import VerificationGate from '@/components/verification-gate';

const TOKEN_USDT_RATE = 0.00004;

export default function WalletPage() {
  const { user } = useApp();
  const usdtValue = ((user?.balance || 0) * TOKEN_USDT_RATE).toFixed(4);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-tg-text">💳 Wallet</h1>

      <div className="p-4 rounded-xl bg-tg-secondaryBg">
        <p className="text-sm text-tg-hint">Balance</p>
        <p className="text-2xl font-bold text-tg-text">{(user?.balance || 0).toLocaleString()} Tokens</p>
        <p className="text-sm text-tg-hint mt-1">≈ ${usdtValue} USDT</p>
        <p className="text-xs text-tg-hint mt-1">1 Token = {TOKEN_USDT_RATE} USDT</p>
        <p className="text-xs text-tg-hint">Min withdrawal: 2000 Tokens</p>
      </div>

      <VerificationGate />
    </div>
  );
}