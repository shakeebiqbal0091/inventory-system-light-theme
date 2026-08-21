'use client';
// app/low-stock/page.tsx
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface Product { id:string; name:string; category:string; quantity:number; lowStockThreshold:number; supplier?:string; }

export default function LowStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/products/low-stock').then(r => setProducts(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-heading)' }}>
          <AlertTriangle className="w-6 h-6" style={{ color: 'var(--warning)' }} />
          Low Stock Alerts
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Products that have fallen below their minimum threshold
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : products.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle className="w-12 h-12 mb-3" style={{ color: 'var(--success)' }} />
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-heading)' }}>All stocked up!</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>No products are below their minimum stock threshold.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(p => {
            const pct = Math.round((p.quantity / p.lowStockThreshold) * 100);
            const crit = p.quantity === 0 || p.quantity <= p.lowStockThreshold / 2;
            return (
              <div key={p.id} className="card" style={{ border: '1px solid #e4e4e7', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.category}</p>
                  </div>
                  <span className={p.quantity === 0 ? 'badge-danger' : 'badge-warning'}>
                    {p.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Current: <strong style={{ color: 'var(--text-primary)' }}>{p.quantity}</strong></span>
                    <span>Min: <strong style={{ color: 'var(--text-primary)' }}>{p.lowStockThreshold}</strong></span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-border)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: crit ? 'var(--danger)' : 'var(--warning)' }} />
                  </div>
                </div>
                {p.supplier && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Supplier: <span style={{ color: 'var(--text-primary)' }}>{p.supplier}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
