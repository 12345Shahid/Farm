'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [boosterStatus, setBoosterStatus] = useState('inactive');

  function handleSmsToggle() {
    setSmsEnabled(!smsEnabled);
    if (!smsEnabled) {
      setTimeout(() => {
        alert('📱 Download Booster APK to enable SMS Rewards');
      }, 300);
    }
  }

  function handleShareToggle() {
    setShareEnabled(!shareEnabled);
    if (!shareEnabled) {
      setTimeout(() => {
        alert('📱 Download Booster APK to enable Share Internet for Rewards');
      }, 300);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-tg-text">⚙️ Settings</h1>

      {/* Account Info */}
      <div className="p-4 rounded-xl bg-tg-secondaryBg">
        <h3 className="font-semibold text-tg-text mb-2">Account</h3>
        <p className="text-sm text-tg-hint">Connected via Telegram</p>
      </div>

      {/* Booster Integrations (Placeholder for Phase 2) */}
      <div className="p-4 rounded-xl bg-tg-secondaryBg">
        <h3 className="font-semibold text-tg-text mb-3">Integrations</h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div>
              <p className="text-sm font-medium text-tg-text">SMS Rewards</p>
              <p className="text-xs text-tg-hint">Earn from OTP verification</p>
            </div>
            <button
              onClick={handleSmsToggle}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                smsEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                smsEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div>
              <p className="text-sm font-medium text-tg-text">Share Internet</p>
              <p className="text-xs text-tg-hint">Earn from bandwidth sharing</p>
            </div>
            <button
              onClick={handleShareToggle}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                shareEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                shareEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </label>
        </div>
      </div>

      {/* Booster Status (from DB) */}
      <div className="p-4 rounded-xl bg-tg-secondaryBg">
        <h3 className="font-semibold text-tg-text mb-2">Booster Status</h3>
        <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
          {boosterStatus === 'active' ? '🟢 Active' : '⏳ Inactive — Download APK'}
        </div>
      </div>
    </div>
  );
}