'use client';

import { useState } from 'react';
import { useApp } from './provider';

export default function LandingShowcase() {
  const { enableDemoMode } = useApp();
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'ProjectRiver_bot';

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is Rivar?',
      a: 'Rivar is a Web3 community rewards Telegram Mini App. Users log in through Telegram to mine tokens, complete engagement tasks, earn referral bonuses, and withdraw crypto rewards.',
    },
    {
      q: 'How does the 24-hour mining cycle work?',
      a: 'Once you tap "Start Mining", your virtual rig generates tokens in the background over a 24-hour period. Once complete, you claim your tokens and can upgrade your rig up to Level 30 for increased daily yields.',
    },
    {
      q: 'How do I earn referral bonuses?',
      a: 'Every user receives a unique referral code and direct Telegram invite link. When a friend joins via your link, you instantly receive +80 tokens credited to your balance.',
    },
    {
      q: 'How do withdrawals work?',
      a: 'Once you reach the minimum balance (2,000 Tokens) and complete a quick verification check, you can submit your USDT wallet address for payout.',
    },
  ];

  return (
    <div className="w-full space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center space-y-5 pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>Official Telegram Mini App & Community Hub</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-tg-text leading-tight">
          Mine Tokens, Complete Tasks &amp; Earn{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Real Crypto
          </span>
        </h1>

        <p className="text-sm sm:text-base text-tg-hint max-w-md mx-auto leading-relaxed">
          Rivar is an interactive Telegram Mini App. Activate your daily 24h mining rig, complete partner tasks, invite friends, and withdraw rewards.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>🚀 Open in Telegram</span>
            <span>↗</span>
          </a>

          <button
            onClick={enableDemoMode}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-tg-secondaryBg hover:bg-gray-200 dark:hover:bg-gray-800 text-tg-text font-semibold text-sm border border-gray-200 dark:border-gray-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>🎮 Try Interactive Demo</span>
          </button>
        </div>

        <p className="text-[11px] text-tg-hint">
          No installation required • Runs directly inside Telegram
        </p>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">24h</p>
          <p className="text-xs text-tg-hint mt-0.5 font-medium">Mining Cycle</p>
        </div>
        <div className="p-3.5 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">+80</p>
          <p className="text-xs text-tg-hint mt-0.5 font-medium">Tokens / Referral</p>
        </div>
        <div className="p-3.5 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400">1 - 30</p>
          <p className="text-xs text-tg-hint mt-0.5 font-medium">Mining Levels</p>
        </div>
        <div className="p-3.5 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">USDT</p>
          <p className="text-xs text-tg-hint mt-0.5 font-medium">Direct Cashout</p>
        </div>
      </section>

      {/* Interactive App Preview Banner */}
      <section className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/10 via-indigo-900/10 to-purple-900/10 border border-blue-200/50 dark:border-blue-900/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-tg-text text-base">Interactive Web Preview</h3>
            <p className="text-xs text-tg-hint mt-0.5">Explore the dashboard, test mining cycles, and preview token tasks in your browser.</p>
          </div>
          <button
            onClick={enableDemoMode}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 active:scale-95 transition-all self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>Launch Web Demo</span>
            <span>→</span>
          </button>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-tg-text">Platform Features</h2>
          <p className="text-xs text-tg-hint">Everything built into the Rivar Telegram Mini App</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 space-y-2">
            <div className="text-2xl">⛏️</div>
            <h3 className="font-semibold text-tg-text text-sm">24-Hour Mining Engine</h3>
            <p className="text-xs text-tg-hint leading-relaxed">
              Start your automated rig with one click. Upgrade from Level 1 up to Level 30 using your earned tokens to multiply your daily generation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 space-y-2">
            <div className="text-2xl">👥</div>
            <h3 className="font-semibold text-tg-text text-sm">Viral Referral System</h3>
            <p className="text-xs text-tg-hint leading-relaxed">
              Share direct Telegram invite links or your custom code. Both you and your friend earn token bonuses when they launch the app.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 space-y-2">
            <div className="text-2xl">🎯</div>
            <h3 className="font-semibold text-tg-text text-sm">Daily Streaks &amp; Social Quests</h3>
            <p className="text-xs text-tg-hint leading-relaxed">
              Check in daily for streak multipliers. Follow social media channels and complete verified sponsor offers for instant token payouts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 space-y-2">
            <div className="text-2xl">💳</div>
            <h3 className="font-semibold text-tg-text text-sm">Transparent Crypto Payouts</h3>
            <p className="text-xs text-tg-hint leading-relaxed">
              Convert your tokens to USDT at a fixed rate (1 Token = 0.00004 USDT). Submit withdrawal requests directly to your crypto wallet.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="p-5 rounded-2xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 space-y-4">
        <h2 className="text-base font-bold text-tg-text text-center">How to Get Started in 3 Steps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="space-y-1.5 p-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 font-bold text-sm flex items-center justify-center mx-auto">1</div>
            <h4 className="font-semibold text-xs text-tg-text">Open Telegram Bot</h4>
            <p className="text-[11px] text-tg-hint">Launch @{botUsername} in the Telegram mobile or desktop app.</p>
          </div>
          <div className="space-y-1.5 p-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 font-bold text-sm flex items-center justify-center mx-auto">2</div>
            <h4 className="font-semibold text-xs text-tg-text">Start Mining &amp; Tasks</h4>
            <p className="text-[11px] text-tg-hint">Activate your rig, complete daily quests, and invite friends.</p>
          </div>
          <div className="space-y-1.5 p-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 font-bold text-sm flex items-center justify-center mx-auto">3</div>
            <h4 className="font-semibold text-xs text-tg-text">Claim &amp; Withdraw</h4>
            <p className="text-[11px] text-tg-hint">Claim your rewards and request withdrawal to your USDT wallet.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-3">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-tg-text">Frequently Asked Questions</h2>
          <p className="text-xs text-tg-hint">Quick answers about the Rivar platform</p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-tg-secondaryBg border border-gray-100 dark:border-gray-800 transition-all cursor-pointer"
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
            >
              <div className="flex justify-between items-center font-medium text-xs text-tg-text">
                <span>{faq.q}</span>
                <span className="text-tg-hint text-sm ml-2">{activeFaq === idx ? '−' : '+'}</span>
              </div>
              {activeFaq === idx && (
                <p className="text-xs text-tg-hint mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center space-y-3 shadow-md">
        <h3 className="text-lg font-bold">Ready to Start Earning?</h3>
        <p className="text-xs text-blue-100 max-w-sm mx-auto">
          Join thousands of community members mining tokens and completing tasks on Telegram today.
        </p>
        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-xs shadow hover:bg-blue-50 active:scale-95 transition-all"
        >
          <span>Launch on Telegram</span>
          <span>↗</span>
        </a>
      </section>

      {/* Footer */}
      <footer className="pt-6 border-t border-gray-200 dark:border-gray-800 text-center space-y-3 text-xs text-tg-hint">
        <div className="flex justify-center items-center gap-4">
          <a href="/privacy" className="hover:text-tg-text transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-tg-text transition-colors">Terms of Service</a>
          <span>•</span>
          <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer" className="hover:text-tg-text transition-colors">Telegram Bot</a>
        </div>
        <p className="text-[11px] text-tg-hint/70">
          © {new Date().getFullYear()} Rivar Ecosystem. Built for the Telegram Mini App Platform.
        </p>
      </footer>
    </div>
  );
}
