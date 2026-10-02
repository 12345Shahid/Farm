'use client';

import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/mining', label: 'Mine', icon: '⛏️' },
  { href: '/ads', label: 'Ads', icon: '📺' },
  { href: '/tasks', label: 'Tasks', icon: '📋' },
  { href: '/wallet', label: 'Wallet', icon: '💳' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-tg-bg border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-colors ${
                active ? 'text-tg-btn' : 'text-tg-hint'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}