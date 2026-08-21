'use client';
// app/sales/page.tsx
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { Plus, ShoppingCart, X, TrendingUp } from 'lucide-react';

interface Sale { id:string; quantity:number; totalPrice:number; totalCost:number; profit:number; createdAt:string; product:{id:string;name:string;category:string}; }
interface Product { id:string; name:string; price:number; costPrice:number; quantity:number; }
const fmt = (n: number) => `$${n.toFixed(2)}`;

export default function SalesPage() {
  const [sales, setSales]       = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const fetchData = async () => {
    const [s, p] = await Promise.all([api.get('/sales'), api.get('/products')]);
    setSales(s.data.data); setProducts(p.data.data); setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const sel = products.find(p => p.id === form.productId);
  const qty = Number(form.quantity);
  const preview = sel && qty > 0 ? {
    revenue: (sel.price * qty).toFixed(2),
    cost:    (sel.costPrice * qty).toFixed(2),
    profit:  ((sel.price - sel.costPrice) * qty).toFixed(2),
    margin:  sel.price > 0 ? Math.round(((sel.price - sel.costPrice) / sel.price) * 100) : 0,
  } : null;

  const handleSale = async () => {
    if (!form.productId || !form.quantity) { setError('Please select a product and enter quantity.'); return; }
    setError(''); setSaving(true);
    try {
      await api.post('/sales', { productId: form.productId, quantity: qty });
      setShowModal(false); setForm({ productId: '', quantity: '' }); fetchData();
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to record sale.'); }
    finally { setSaving(false); }
  };

  const totalRevenue = sales.reduce((s, x) => s + x.totalPrice, 0);
  const totalProfit  = sales.reduce((s, x) => s + x.profit, 0);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Sales</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {sales.length} transactions · Revenue: <span style={{ color: 'var(--accent)' }}>{fmt(totalRevenue)}</span>
            {' · '}Profit: <span style={{ color: 'var(--success)' }}>{fmt(totalProfit)}</span>
          </p>
        </div>
        <button onClick={() => { setError(''); setForm({ productId: '', quantity: '' }); setShowModal(true); }}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Record Sale
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text-muted)' }}>
            <ShoppingCart className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No sales recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                  {['Product','Category','Qty','Revenue','Cost','Profit','Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} className="transition-colors" style={{ borderBottom: '1px solid var(--bg-border)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{s.product.name}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{s.product.category}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-primary)' }}>{s.quantity}</td>
                    <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--accent)' }}>{fmt(s.totalPrice)}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--warning)' }}>{fmt(s.totalCost)}</td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--success)' }}>{fmt(s.profit)}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl w-full max-w-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Record Sale</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>{error}</div>}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Product</label>
                <select className="input" value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                      {p.name} (Stock: {p.quantity}) — ${p.price}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Quantity</label>
                <input type="number" min="1" className="input" placeholder="1"
                  value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              {preview && (
                <div className="rounded-lg px-4 py-3 space-y-2" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}>
                  {[
                    { label: 'Revenue', val: `$${preview.revenue}`, color: 'var(--accent)' },
                    { label: 'Cost',    val: `$${preview.cost}`,    color: 'var(--warning)' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-xs">
                      <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                      <span style={{ color: r.color }} className="font-medium">{r.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs pt-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
                    <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <TrendingUp className="w-3 h-3" style={{ color: 'var(--success)' }} /> Profit
                    </span>
                    <span className="font-bold" style={{ color: 'var(--success)' }}>${preview.profit} ({preview.margin}% margin)</span>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid var(--bg-border)' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSale} disabled={saving} className="btn-primary">
                {saving ? 'Recording...' : 'Confirm Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
