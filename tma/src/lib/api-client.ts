'use client';

/**
 * Helper to get Telegram initData safely in the browser.
 */
export function getTelegramInitData(): string {
  if (typeof window === 'undefined') return '';
  return (window as any).Telegram?.WebApp?.initData || '';
}

/**
 * Helper to get start_param from Telegram WebApp or URL query.
 */
export function getReferralCodeFromContext(): string {
  if (typeof window === 'undefined') return '';

  // 1. Check Telegram WebApp initDataUnsafe
  const tgStartParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (tgStartParam) return tgStartParam;

  // 2. Check URL search params (?ref=... or ?tgWebAppStartParam=...)
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('tgWebAppStartParam') || params.get('startapp');
    if (ref) return ref;

    // 3. Check hash fragment for tgWebAppStartParam
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hashRef = hashParams.get('tgWebAppStartParam') || hashParams.get('start_param');
      if (hashRef) return hashRef;
    }
  } catch {}

  // 4. Check sessionStorage / localStorage cache
  try {
    const cached = localStorage.getItem('rivar_referral_code');
    if (cached) return cached;
  } catch {}

  return '';
}

/**
 * Authenticated fetch helper for all client components.
 * Automatically injects the `x-init-data` header from Telegram.
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const initData = getTelegramInitData();
  const headers = new Headers(init.headers || {});

  if (initData && !headers.has('x-init-data')) {
    headers.set('x-init-data', initData);
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
