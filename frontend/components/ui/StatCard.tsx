// components/ui/StatCard.tsx

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'indigo' | 'green' | 'amber' | 'red';
  ringPercent?: number;   // 0–100, only pass for true percentage metrics
}

const iconBg: Record<string, string> = {
  indigo: 'rgba(91,61,240,0.10)',
  green:  'rgba(34,197,94,0.12)',
  amber:  'rgba(245,158,11,0.12)',
  red:    'rgba(239,68,68,0.12)',
};
const ringColor: Record<string, string> = {
  indigo: 'var(--accent)',
  green:  'var(--success)',
  amber:  'var(--warning)',
  red:    'var(--danger)',
};

function Ring({ percent, color }: { percent: number; color: string }) {
  const size = 56, stroke = 5, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x={size / 2} y={size / 2} dy="0.35em" textAnchor="middle" fontSize="13" fontWeight="700"
        fill={color} transform={`rotate(90 ${size / 2} ${size / 2})`}>
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

export default function StatCard({ title, value, icon, trend, trendUp, color = 'indigo', ringPercent }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      {ringPercent !== undefined ? (
        <Ring percent={ringPercent} color={ringColor[color]} />
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg[color], color: ringColor[color] }}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{title}</p>
        <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-heading)' }}>{value}</p>
        {trend && (
          <p className="text-xs mt-0.5" style={{ color: trendUp ? 'var(--success)' : 'var(--text-muted)' }}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}