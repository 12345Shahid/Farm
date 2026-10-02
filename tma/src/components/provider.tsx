'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface UserData {
  user_id: number;
  first_name: string;
  balance: number;
  referral_code: string;
  check_in_streak: number;
  last_check_in: string | null;
  referred_by_count?: number;
  verification_status: string;
  booster_status: string;
}

export const DEMO_USER: UserData = {
  user_id: 12345678,
  first_name: 'Explorer (Demo)',
  balance: 1450,
  referral_code: 'RIVAR77',
  check_in_streak: 4,
  last_check_in: null,
  referred_by_count: 3,
  verification_status: 'verified',
  booster_status: 'active',
};

interface AppState {
  user: UserData | null;
  loading: boolean;
  initData: string;
  isTelegram: boolean;
  isDemoMode: boolean;
  enableDemoMode: () => void;
  exitDemoMode: () => void;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppState>({
  user: null,
  loading: true,
  initData: '',
  isTelegram: false,
  isDemoMode: false,
  enableDemoMode: () => {},
  exitDemoMode: () => {},
  refresh: async () => {},
});

export function AppProvider({ children, initialUser }: { children: ReactNode; initialUser?: UserData }) {
  const [user, setUser] = useState<UserData | null>(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);
  const [rawInitData, setRawInitData] = useState<string>('');
  const [isTelegram, setIsTelegram] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setUser(DEMO_USER);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rivar_demo_mode', 'true');
    }
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('rivar_demo_mode');
    }
  }, []);

  const refresh = useCallback(async () => {
    let initData = '';
    let startParam = '';

    // Check Telegram WebApp object
    for (let i = 0; i < 20; i++) {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initData) {
        initData = tg.initData;
        startParam = tg.initDataUnsafe?.start_param || '';
        break;
      }
      if (i > 0) await new Promise(r => setTimeout(r, 100));
    }

    if (!initData) {
      console.log('[Rivar] Running in Web Preview Mode (outside Telegram)');
      setIsTelegram(false);

      // Check if user previously toggled demo mode
      if (typeof window !== 'undefined' && sessionStorage.getItem('rivar_demo_mode') === 'true') {
        setIsDemoMode(true);
        setUser(DEMO_USER);
      }
      setLoading(false);
      return;
    }

    // Inside real Telegram WebApp
    setIsTelegram(true);
    setIsDemoMode(false);
    setRawInitData(initData);

    // Extract referral code from start_param, URL params, or localStorage
    let refCode = startParam;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      refCode = refCode || urlParams.get('ref') || urlParams.get('tgWebAppStartParam') || urlParams.get('startapp') || '';

      if (!refCode && window.location.hash) {
        try {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          refCode = hashParams.get('tgWebAppStartParam') || hashParams.get('start_param') || '';
        } catch {}
      }

      if (refCode) {
        localStorage.setItem('rivar_referral_code', refCode);
      } else {
        refCode = localStorage.getItem('rivar_referral_code') || '';
      }
    }

    try {
      console.log('[Rivar] Telegram initData found, authenticating...');
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
        body: JSON.stringify({ initData, refCode }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialUser) refresh();
  }, [refresh]);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        initData: rawInitData,
        isTelegram,
        isDemoMode,
        enableDemoMode,
        exitDemoMode,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);