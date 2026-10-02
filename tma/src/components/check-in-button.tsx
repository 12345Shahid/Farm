'use client';

import { useState } from 'react';
import { useApp } from './provider';
import { apiFetch } from '@/lib/api-client';

export default function CheckInButton() {
  const { user, refresh } = useApp();
  const [claiming, setClaiming] = useState(false);

  async function handleCheckIn() {
    setClaiming(true);
    try {
      const res = await apiFetch('/api/check-in', { method: 'POST' });
      if (res.ok) {
        await refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.error) alert(data.error);
      }
    } catch {
      alert('Failed to connect to server for check-in');
    } finally {
      setClaiming(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const lastCheckIn = user?.last_check_in ? new Date(user.last_check_in).toISOString().split('T')[0] : null;
  const alreadyChecked = today === lastCheckIn;

  return (
    <button
      onClick={handleCheckIn}
      disabled={alreadyChecked || claiming}
      className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
        alreadyChecked
          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 cursor-default'
          : 'bg-tg-btn text-tg-btnText active:scale-95 shadow-md'
      }`}
    >
      {claiming ? (
        <>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Claiming...
        </>
      ) : alreadyChecked ? (
        '✅ Checked In Today'
      ) : (
        '🎯 Daily Check-In (+5 Tokens)'
      )}
    </button>
  );
}