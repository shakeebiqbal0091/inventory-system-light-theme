'use client';
// app/stock-locations/page.tsx
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowRightLeft, MapPin, X } from 'lucide-react';

interface Product { id: string; name: string; quantity: number; }
interface Warehouse { id: string; name: string; }
interface StockRow { id: string; quantity: number; warehouse: { id: string; name: string }; }

export default function StockLocationsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [stock, setStock] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/products').then(r => setProducts(r.data.data)),
      api.get('/warehouses').then(r => setWarehouses(r.data.data)),
    ]).then(([, ]) => {
      // pick a default selected product once products are loaded
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) setSelectedProductId(products[0].id);
  }, [products, selectedProductId]);

  const fetchStock = () => {
    if (!selectedProductId) return;
    api.get(`/stock-locations/product/${selectedProductId}`).then(r => setStock(r.data.data)).catch(console.error);
  };
  useEffect(() => { fetchStock(); }, [selectedProductId]);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const allocatedTotal = stock.reduce((sum, s) => sum + s.quantity, 0);
  const unallocated = (selectedProduct?.quantity ?? 0) - allocatedTotal;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Stock by Location</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>View and transfer stock between warehouses</p>
        </div>
        {isAdmin && warehouses.length >= 2 && (
          <button onClick={() => setShowTransfer(true)} className="btn-primary flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" /> Transfer Stock
          </button>
        )}
      </div>

      <div className="mb-5 max-w-sm">
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Product</label>
        <select className="input" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {warehouses.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-40" style={{ color: 'var(--text-muted)' }}>
          <MapPin className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No warehouses set up yet — add one to start tracking stock by location.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bg-border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Total stock: {selectedProduct?.quantity ?? 0}
            </p>
            <p className="text-xs" style={{ color: unallocated !== 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
              {unallocated > 0 ? `${unallocated} unallocated (not yet assigned to a warehouse)` : unallocated < 0 ? `${Math.abs(unallocated)} over-allocated — check records` : 'Fully allocated'}
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                <th className="text-left px-5 py-3">Warehouse</th>
                <th className="text-left px-5 py-3">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {stock.length === 0 ? (
                <tr><td colSpan={2} className="px-5 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No location breakdown recorded for this product yet.</td></tr>
              ) : (
                stock.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-primary)' }}>{s.warehouse.name}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{s.quantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showTransfer && selectedProduct && (
        <TransferModal
          product={selectedProduct}
          warehouses={warehouses}
          stock={stock}
          onClose={() => setShowTransfer(false)}
          onTransferred={() => { setShowTransfer(false); fetchStock(); }}
        />
      )}
    </AppLayout>
  );
}

function TransferModal({ product, warehouses, stock, onClose, onTransferred }: {
  product: Product; warehouses: Warehouse[]; stock: StockRow[];
  onClose: () => void; onTransferred: () => void;
}) {
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const availableAtSource = stock.find(s => s.warehouse.id === fromWarehouseId)?.quantity ?? 0;

  const handleSubmit = async () => {
    setError('');
    if (!fromWarehouseId || !toWarehouseId) return setError('Select both warehouses.');
    if (fromWarehouseId === toWarehouseId) return setError('Source and destination must be different.');
    if (!quantity || Number(quantity) <= 0) return setError('Enter a valid quantity.');
    setSaving(true);
    try {
      await api.post('/stock-locations/transfer', {
        productId: product.id, fromWarehouseId, toWarehouseId, quantity: Number(quantity),
      });
      onTransferred();
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to transfer stock.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl w-full max-w-md" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Transfer Stock — {product.name}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>From Warehouse</label>
            <select className="input" value={fromWarehouseId} onChange={e => setFromWarehouseId(e.target.value)}>
              <option value="">Select...</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            {fromWarehouseId && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{availableAtSource} available at this location</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>To Warehouse</label>
            <select className="input" value={toWarehouseId} onChange={e => setToWarehouseId(e.target.value)}>
              <option value="">Select...</option>
              {warehouses.filter(w => w.id !== fromWarehouseId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Quantity</label>
            <input type="number" min="1" className="input" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? 'Transferring...' : 'Confirm Transfer'}</button>
        </div>
      </div>
    </div>
  );
}