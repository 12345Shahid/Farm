'use client';

import { useEffect } from 'react';

export default function EntryGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
    }
  }, []);

  return <>{children}</>;
}