import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Rivar',
  description: 'Privacy Policy and data practices for Rivar Telegram Mini App',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 text-tg-text">
      <a href="/" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-2">
        <span>←</span> Back to Rivar
      </a>

      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-xs text-tg-hint">Last updated: September 2026</p>

      <section className="space-y-2 text-sm leading-relaxed text-tg-hint">
        <h2 className="text-base font-semibold text-tg-text">1. Overview</h2>
        <p>
          Rivar (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the Rivar Telegram Mini App and web platform. This Privacy Policy describes how we handle user information when you access or use our services.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-tg-hint">
        <h2 className="text-base font-semibold text-tg-text">2. Information We Collect</h2>
        <p>
          When you access Rivar through Telegram, we receive basic profile parameters provided by the Telegram WebApp API:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Telegram User ID (to uniquely identify your account)</li>
          <li>First name, last name, and username (for profile display)</li>
          <li>In-app gameplay activity (mining timers, task completions, and referral links)</li>
          <li>Wallet address (only when explicitly submitted for withdrawal requests)</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-tg-hint">
        <h2 className="text-base font-semibold text-tg-text">3. Advertising &amp; Third-Party Services</h2>
        <p>
          Our platform integrates with third-party advertising networks (such as PopAds and Adsterra) to deliver sponsored offers and rewarded tasks. These third-party networks may use standard web tracking technologies (such as cookies or anonymized device identifiers) to measure ad delivery and prevent fraudulent impressions.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-tg-hint">
        <h2 className="text-base font-semibold text-tg-text">4. Data Security</h2>
        <p>
          We employ industry-standard cryptographic validation (HMAC SHA-256) to verify Telegram authentication data. We do not sell your personal data to third parties.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-tg-hint">
        <h2 className="text-base font-semibold text-tg-text">5. Contact Us</h2>
        <p>
          For privacy inquiries or account requests, contact our official support bot on Telegram: @ProjectRiver_bot.
        </p>
      </section>
    </div>
  );
}
