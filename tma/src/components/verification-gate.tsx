'use client';

import { useState, useEffect } from 'react';
import { useApp } from './provider';
import { apiFetch } from '@/lib/api-client';

const MIN_WITHDRAW = 2000;
const MIN_REFERRALS = 2;

export default function VerificationGate() {
  const { user, refresh } = useApp();
  const [uploading, setUploading] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [referredCount, setReferredCount] = useState(0);

  useEffect(() => {
    if (user?.user_id) fetchReferralCount();
  }, [user?.user_id]);

  async function fetchReferralCount() {
    try {
      const res = await apiFetch(`/api/referrals/count`);
      if (res.ok) {
        const data = await res.json();
        setReferredCount(data.count || 0);
      }
    } catch {}
  }

  const hasMinReferrals = referredCount >= MIN_REFERRALS;
  const hasMinBalance = (user?.balance || 0) >= MIN_WITHDRAW;
  const isVerified = user?.verification_status === 'verified';
  const canWithdraw = isVerified && hasMinBalance;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setVideoUploaded(true);
        alert('✅ Video uploaded successfully! Under review.');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Upload network error');
    } finally {
      setUploading(false);
    }
  }

  async function handleWithdraw() {
    try {
      const res = await apiFetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: MIN_WITHDRAW }),
      });
      if (res.ok) {
        alert('🎉 Withdrawal request submitted!');
        await refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Withdrawal failed');
      }
    } catch {
      alert('Network error while requesting withdrawal');
    }
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="p-4 rounded-xl bg-tg-secondaryBg">
        <h3 className="font-semibold text-tg-text mb-2">Verification Status</h3>
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          isVerified
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
          {isVerified ? '✅ Verified' : '⏳ Pending'}
        </div>
      </div>

      {/* Requirements */}
      <div className="p-4 rounded-xl bg-tg-secondaryBg space-y-3">
        <h3 className="font-semibold text-tg-text">Requirements</h3>

        <div className="flex items-center gap-2">
          <span className={hasMinReferrals ? 'text-green-500' : 'text-gray-400'}>
            {hasMinReferrals ? '✅' : '❌'}
          </span>
          <span className="text-sm text-tg-text">
            Minimum {MIN_REFERRALS} Referrals ({referredCount}/{MIN_REFERRALS})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={videoUploaded ? 'text-green-500' : 'text-gray-400'}>
            {videoUploaded ? '✅' : '❌'}
          </span>
          <span className="text-sm text-tg-text">Upload verification video</span>
        </div>

        {!videoUploaded && (
          <label className="block w-full py-3 rounded-xl bg-tg-btn text-tg-btnText text-center font-medium cursor-pointer active:scale-95">
            {uploading ? '⏳ Uploading...' : '📹 Upload 4s Video'}
            <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
          </label>
        )}
      </div>

      {/* Withdraw button */}
      <button
        onClick={handleWithdraw}
        disabled={!canWithdraw}
        className={`w-full py-4 rounded-xl font-bold text-lg active:scale-95 ${
          canWithdraw
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-400 dark:bg-gray-800'
        }`}
      >
        {!hasMinBalance
          ? `Need ${MIN_WITHDRAW} Tokens (${(user?.balance || 0).toFixed(0)}/${MIN_WITHDRAW})`
          : !isVerified
          ? '🔒 Verify to Withdraw'
          : '💸 Withdraw'}
      </button>
    </div>
  );
}