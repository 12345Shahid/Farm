import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Rivar',
  description: 'Terms of Service for Rivar Telegram Mini App',
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 text-tg-text">
      <a href="/" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-2">
        <span>←</span> Back to Rivar
      </a>

      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="text-xs text-tg-hint">Last updated: September 2026</p>

      <section className="space-y-2 text-sm leading-relaxed text-tg-hint">
        <h2 className="text-base font-semibold text-tg-text">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Rivar Telegram Mini App or website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-tg-hint">
        <h2 className="text-base font-semibold text-tg-text">2. Eligibility &amp; Fair Use</h2>
        <p>
          You agree to use Rivar in compliance with all applicable laws. You may not:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Create multiple automated bot accounts to exploit referral programs or mining rewards.</li>
          <li>Use automated scripts, clickers, or proxies to artificially trigger advertising rewards.</li>
          <li>Engage in fraudulent activities against advertising partners or community members.</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-tg-hint">
        <h2 className="text-base font-semibold text-tg-text">3. In-App Tokens &amp; Rewards</h2>
        <p>
          Tokens accumulated in Rivar represent virtual loyalty points within the ecosystem. Withdrawal to external crypto assets (such as USDT) is subject to account verification, minimum thresholds, and available community reward liquidity.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-tg-hint">
        <h2 className="text-base font-semibold text-tg-text">4. Modifications to Service</h2>
        <p>
          We reserve the right to modify or discontinue features, reward rates, or mining cycle metrics at our discretion to maintain platform economic stability and security.
        </p>
      </section>
    </div>
  );
}
