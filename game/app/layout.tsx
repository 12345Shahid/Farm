import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Crypto Trader Tycoon - Bitcoin Trading Simulator",
  description: "Build your crypto portfolio. Trade Bitcoin, Ethereum, and more. Invest, earn, and become a crypto millionaire in this ultimate trading simulation game.",
  keywords: ["Bitcoin", "Crypto", "Trading", "Invest", "Portfolio", "Ethereum", "Blockchain", "Finance", "Stock Market", "Margin Trading", "Crypto Trading Simulator"],
  applicationName: "Crypto Trader Tycoon",
  generator: "Next.js",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Crypto Tycoon",
  },
  other: {
    "Bitcoin": "crypto",
    "Ethereum": "crypto",
    "Invest": "finance",
    "Portfolio": "finance",
    "Margin": "finance",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0e17",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Crypto Trader Tycoon" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Crypto bait meta tags - not in Next.js metadata */}
        <meta name="category" content="Finance, Crypto, Trading" />
        <meta name="topic" content="Cryptocurrency Investment" />
        <meta name="page-topic" content="Bitcoin Trading" />
      </head>
      <body className="antialiased">{children}<Analytics /></body>
    </html>
  );
}