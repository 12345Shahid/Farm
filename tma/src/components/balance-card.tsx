'use client';

const TOKEN_USDT_RATE = 0.00004;

export default function BalanceCard({ balance }: { balance: number }) {
  const usdtValue = (balance * TOKEN_USDT_RATE).toFixed(4);
  return (
    <div className="w-full p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <p className="text-sm opacity-80">Balance</p>
      <p className="text-3xl font-bold mt-1">{balance.toLocaleString()} <span className="text-lg font-normal">Tokens</span></p>
      <p className="text-sm opacity-80 mt-1">≈ ${usdtValue} USDT</p>
    </div>
  );
}