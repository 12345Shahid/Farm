'use client';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/trade', label: 'Trade', icon: '💱' },
    { href: '/portfolio', label: 'Portfolio', icon: '📁' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="game-header" style={{ background: '#131a2b', borderBottom: '1px solid #1e2a45' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>₿</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Crypto Trader Tycoon</span>
        </div>
        <span style={{ fontSize: 11, color: '#6b7280', background: '#1e2a45', padding: '4px 8px', borderRadius: 4 }}>
          v1.3.2
        </span>
      </div>
      <nav className="nav-bar" style={{ position: 'static', borderTop: 'none', borderBottom: '1px solid #1e2a45' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={isActive ? 'active' : ''}
              style={{ borderTop: isActive ? '2px solid #1e7aff' : '2px solid transparent' }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}