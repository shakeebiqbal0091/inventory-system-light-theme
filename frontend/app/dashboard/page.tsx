'use client';
// app/dashboard/page.tsx
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import StatCard from '@/components/ui/StatCard';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from 'recharts';
import clsx from 'clsx';

interface DashboardStats {
  totalProducts: number; totalSales: number;
  totalRevenue: number; totalCost: number; totalProfit: number; profitMarginPct: number;
  lowStockCount: number; lowStockProducts: any[]; recentSales: any[];
  categoryData: { category: string; revenue: number; profit: number; cost: number; margin: number }[];
  monthlySales: { month: string; revenue: number; profit: number; cost: number }[];
  topProfitableProducts: { name: string; category: string; revenue: number; profit: number; unitsSold: number; margin: number }[];
}

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-4 py-3 text-xs shadow-lg"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
      <p className="mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
<Header
  title={`Good ${getGreeting()}, ${user?.name?.split(' ')[0]} 👋`}
  subtitle="Here's your business performance at a glance"
/>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard title="Total Revenue"   value={fmt(stats?.totalRevenue ?? 0)}    icon={<DollarSign className="w-5 h-5" />} trend="Total sales income"    color="indigo" />
        <StatCard title="Total Cost"      value={fmt(stats?.totalCost ?? 0)}       icon={<TrendingDown className="w-5 h-5" />} trend="Cost of goods sold"  color="amber" />
        <StatCard title="Gross Profit"    value={fmt(stats?.totalProfit ?? 0)}     icon={<TrendingUp className="w-5 h-5" />} trend="Revenue minus cost"    color={(stats?.totalProfit ?? 0) >= 0 ? 'green' : 'red'} />
        <StatCard title="Profit Margin" value={`${stats?.profitMarginPct ?? 0}%`} icon={<Percent className="w-5 h-5" />} ringPercent={stats?.profitMarginPct ?? 0} color={(stats?.totalProfit ?? 0) >= 0 ? 'green' : 'red'} />
        <StatCard title="Stock Health" value={stats?.lowStockCount ? `${stats.lowStockCount} low` : 'All healthy'} icon={<AlertTriangle className="w-5 h-5" />} ringPercent={stats?.totalProducts ? Math.round(((stats.totalProducts - stats.lowStockCount) / stats.totalProducts) * 100) : 100} color={stats?.lowStockCount ? 'red' : 'green'}/>
        <StatCard title="Total Products"      value={stats?.totalProducts ?? 0} icon={<Package className="w-5 h-5" />}      color="indigo" />
        <StatCard title="Total Transactions"  value={stats?.totalSales ?? 0}    icon={<ShoppingCart className="w-5 h-5" />} color="indigo" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="card xl:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Revenue vs Profit (Monthly)</h2>
          </div>
          {stats?.monthlySales?.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={stats.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--accent)"  strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="profit"  name="Profit"  stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cost"    name="Cost"    stroke="var(--warning)"  strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>No sales data yet</div>
          )}
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-heading)' }}>Profit by Category</h2>
          {stats?.categoryData?.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={stats.categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis type="category" dataKey="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profit" name="Profit" radius={[0, 4, 4, 0]} fill="var(--success)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {/* Top profitable products */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--success)' }} /> Most Profitable Products
          </h2>
          {stats?.topProfitableProducts?.length ? (
            <div className="space-y-3">
              {stats.topProfitableProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.unitsSold} units · {p.margin}% margin</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--success)' }}>{fmt(p.profit)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>profit</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sales yet</p>}
        </div>

        {/* Category performance */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-heading)' }}>Category Performance</h2>
          {stats?.categoryData?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                  <th className="text-left pb-2">Category</th>
                  <th className="text-right pb-2">Revenue</th>
                  <th className="text-right pb-2">Profit</th>
                  <th className="text-right pb-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {stats.categoryData.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>{c.category}</td>
                    <td className="py-2.5 text-right" style={{ color: 'var(--text-muted)' }}>{fmt(c.revenue)}</td>
                    <td className="py-2.5 text-right font-medium" style={{ color: 'var(--success)' }}>{fmt(c.profit)}</td>
                    <td className="py-2.5 text-right">
                      <span className={c.margin >= 30 ? 'badge-success' : c.margin >= 15 ? 'badge-warning' : 'badge-danger'}>{c.margin}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</p>}
        </div>
      </div>

      {/* Recent + Low Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-heading)' }}>Recent Sales</h2>
          {stats?.recentSales?.length ? (
            <div className="space-y-3">
              {stats.recentSales.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.product.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Qty: {s.quantity} · Profit: <span style={{ color: 'var(--success)' }}>{fmt(s.profit)}</span>
                    </p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{fmt(s.totalPrice)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sales yet</p>}
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warning)' }} /> Low Stock Alerts
          </h2>
          {stats?.lowStockProducts?.length ? (
            <div className="space-y-3">
              {stats.lowStockProducts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.category}</p>
                  </div>
                  <span className="badge-danger">{p.quantity} left</span>
                </div>
              ))}
            </div>
          ) : <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success)' }}>✓ All products well stocked</div>}
        </div>
      </div>
    </AppLayout>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}
