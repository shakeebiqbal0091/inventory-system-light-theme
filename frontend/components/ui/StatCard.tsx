// components/ui/StatCard.tsx

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'indigo' | 'green' | 'amber' | 'red';
}

const iconBg: Record<string, string> = {
  indigo: 'rgba(99,102,241,0.12)',
  green:  'rgba(34,197,94,0.12)',
  amber:  'rgba(245,158,11,0.12)',
  red:    'rgba(239,68,68,0.12)',
};
const iconColor: Record<string, string> = {
  indigo: 'var(--accent)',
  green:  'var(--success)',
  amber:  'var(--warning)',
  red:    'var(--danger)',
};

export default function StatCard({ title, value, icon, trend, trendUp, color = 'indigo' }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg[color], color: iconColor[color] }}>
        {icon}
      </div>
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
