'use client';

import { useState } from 'react';
import { useApp } from './provider';

export default function ReferralButton() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'ProjectRiver_bot';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || '';
  const referralCode = user?.referral_code || '';

  // Use direct Mini App startapp link if appName exists, otherwise bot /start link
  const referralLink = appName
    ? `https://t.me/${botUsername}/${appName}?startapp=${referralCode}`
    : `https://t.me/${botUsername}?start=${referralCode}`;

  async function handleTelegramShare() {
    const shareText = `🚀 Join me on Rivar! Mine tokens daily, complete simple tasks, and earn real rewards:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
      return;
    }

    // Fallback if not inside Telegram
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy your referral link:', referralLink);
    }
  }

  async function copyCodeOnly() {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      prompt('Copy your referral code:', referralCode);
    }
  }

  return (
    <div className="w-full p-4 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-semibold text-tg-text">👥 Referral Program</span>
          <p className="text-xs text-tg-hint mt-0.5">Earn +80 Tokens for each invited friend</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-bold">
          +80 / friend
        </span>
      </div>

      {/* Referral Code Box */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-tg-hint">Your Code:</span>
          <span className="font-mono font-bold tracking-wider text-sm text-tg-text">
            {referralCode || '...'}
          </span>
        </div>
        <button
          onClick={copyCodeOnly}
          className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-200 dark:bg-gray-700 text-tg-text active:scale-95 transition-all"
        >
          {codeCopied ? '✓ Copied' : 'Copy Code'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={handleTelegramShare}
          className="py-3 px-3 rounded-xl bg-tg-btn text-tg-btnText font-medium text-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>📤</span>
          <span>Invite Friends</span>
        </button>

        <button
          onClick={copyLink}
          className="py-3 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-tg-text font-medium text-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <span>{copied ? '✅' : '🔗'}</span>
          <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
        </button>
      </div>
    </div>
  );
}