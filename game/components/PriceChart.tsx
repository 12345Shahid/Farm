'use client';

interface Props {
  label: string;
  price: number;
  change: number;
}

export default function PriceChart({ label, price, change }: Props) {
  const isUp = change >= 0;
  // Generate fake mini chart bars
  const bars = Array.from({ length: 20 }, () => Math.random());
  const trend = isUp ? bars.map((v, i) => v * (0.5 + (i / 20) * 0.5)) : bars.map((v, i) => v * (1 - (i / 20) * 0.5));
  const max = Math.max(...trend);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
            ${price.toFixed(label === 'ADA' ? 4 : label === 'DOT' ? 2 : 2)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: isUp ? '#00c853' : '#ff1744' }}>
            {isUp ? '+' : ''}{change.toFixed(2)}%
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>24h</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 }}>
        {trend.map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${(v / max) * 100}%`,
              background: isUp ? '#00c853' : '#ff1744',
              opacity: 0.6,
              borderRadius: '2px 2px 0 0',
              minHeight: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}