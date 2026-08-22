'use client';
// app/reports/page.tsx
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { Activity, TrendingUp, Wallet, Info } from 'lucide-react';

interface Movement {
  id: string; type: string; quantity: number; note?: string; createdAt: string;
  product: { id: string; name: string }; user?: { id: string; name: string } | null;
}
interface TurnoverData {
  days: number; turnoverRatio: number; totalUnitsSold: number;
  bestSellers: { productId: string; name: string; unitsSold: number; revenue: number }[];
  slowMovers: { productId: string; name: string; quantity: number; unitsSoldInWindow: number }[];
}
interface ValuationRow {
  productId: string; name: string; quantity: number; hasFullCostHistory: boolean;
  fifoValue: number; lifoValue: number; weightedAverageValue: number;
}
interface ValuationData { products: ValuationRow[]; totals: { fifo: number; lifo: number; weightedAverage: number }; }

const TYPE_BADGE: Record<string, string> = {
  SALE: 'badge-info',
  PURCHASE_RECEIPT: 'badge-success',
  TRANSFER_OUT: 'badge-warning',
  TRANSFER_IN: 'badge-info',
  RETURN_RESTOCK: 'badge-warning',
  MANUAL_ADJUSTMENT: 'badge-danger',
};

const TABS = [
  { key: 'movements', label: 'Stock Movements', icon: Activity },
  { key: 'turnover', label: 'Sales & Turnover', icon: TrendingUp },
  { key: 'valuation', label: 'Valuation', icon: Wallet },
] as const;

export default function ReportsPage() {
  const [tab, setTab] = useState<typeof TABS[number]['key']>('movements');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [turnover, setTurnover] = useState<TurnoverData | null>(null);
  const [valuation, setValuation] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/reports/stock-movements').then(r => setMovements(r.data.data)),
      api.get('/reports/sales-turnover').then(r => setTurnover(r.data.data)),
      api.get('/reports/valuation').then(r => setValuation(r.data.data)),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Reports & Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Stock history, sales performance, and inventory valuation</p>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={tab === key ? { backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' } : { color: 'var(--text-muted)' }}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <>
          {tab === 'movements' && <MovementsTab movements={movements} />}
          {tab === 'turnover' && turnover && <TurnoverTab data={turnover} />}
          {tab === 'valuation' && valuation && <ValuationTab data={valuation} />}
        </>
      )}
    </AppLayout>
  );
}

// ─── Stock Movements ─────────────────────────────────────────────────────────────

function MovementsTab({ movements }: { movements: Movement[] }) {
  return (
    <div className="card p-0 overflow-hidden">
      {movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text-muted)' }}>
          <Activity className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No stock movements recorded yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                {['Date', 'Product', 'Type', 'Quantity', 'By', 'Note'].map(h => (
                  <th key={h} className="text-left px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{m.product.name}</td>
                  <td className="px-5 py-3.5"><span className={TYPE_BADGE[m.type] ?? 'badge-info'}>{m.type.replace('_', ' ')}</span></td>
                  <td className="px-5 py-3.5" style={{ color: m.quantity < 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{m.user?.name ?? '—'}</td>
                  <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{m.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Sales & Turnover ─────────────────────────────────────────────────────────────

function TurnoverTab({ data }: { data: TurnoverData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Turnover Ratio (last {data.days} days)</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-heading)' }}>{data.turnoverRatio}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Units sold ÷ current stock on hand</p>
        </div>
        <div className="card">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Units Sold</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-heading)' }}>{data.totalUnitsSold}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Over the last {data.days} days</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-heading)' }}>Best Sellers</h3>
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Units Sold</th>
                <th className="text-left px-5 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.bestSellers.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No sales in this window yet.</td></tr>
              ) : data.bestSellers.map(p => (
                <tr key={p.productId} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                  <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{p.unitsSold}</td>
                  <td className="px-5 py-3.5" style={{ color: 'var(--success)' }}>${p.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-heading)' }}>Slow-Moving Inventory</h3>
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Current Stock</th>
                <th className="text-left px-5 py-3">Units Sold (window)</th>
              </tr>
            </thead>
            <tbody>
              {data.slowMovers.map(p => (
                <tr key={p.productId} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                  <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{p.quantity}</td>
                  <td className="px-5 py-3.5" style={{ color: p.unitsSoldInWindow === 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {p.unitsSoldInWindow}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Inventory Valuation ─────────────────────────────────────────────────────────

function ValuationTab({ data }: { data: ValuationData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-4 py-3 rounded-lg text-sm"
        style={{ backgroundColor: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', color: 'var(--warning)' }}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          FIFO and LIFO values are calculated from actual purchase-order receipt history where available.
          Products without a purchase-order history use their listed cost price as an approximation —
          these are marked "Approximated" below and should not be treated as audited cost-layer accounting.
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>FIFO Total</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-heading)' }}>${data.totals.fifo.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>LIFO Total</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-heading)' }}>${data.totals.lifo.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Weighted Average Total</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-heading)' }}>${data.totals.weightedAverage.toLocaleString()}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
              {['Product', 'Qty', 'Cost Basis', 'FIFO', 'LIFO', 'Weighted Avg'].map(h => (
                <th key={h} className="text-left px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.products.map(p => (
              <tr key={p.productId} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{p.quantity}</td>
                <td className="px-5 py-3.5">
                  <span className={p.hasFullCostHistory ? 'badge-success' : 'badge-warning'}>
                    {p.hasFullCostHistory ? 'Full History' : 'Approximated'}
                  </span>
                </td>
                <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>${p.fifoValue.toLocaleString()}</td>
                <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>${p.lifoValue.toLocaleString()}</td>
                <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>${p.weightedAverageValue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}