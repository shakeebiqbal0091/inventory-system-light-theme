'use client';
// app/purchase-orders/page.tsx
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Plus, X, PackageCheck, Truck, Trash2 } from 'lucide-react';

interface Product { id: string; name: string; quantity: number; }
interface Supplier { id: string; companyName: string; }
interface POItem {
  id: string; productId: string; product: { id: string; name: string; quantity?: number };
  quantityOrdered: number; quantityReceived: number; unitCost: number; damagedCount: number;
}
interface PurchaseOrder {
  id: string; poNumber: string; status: string; orderDate: string; expectedDate?: string;
  notes?: string; supplier: { id: string; companyName: string }; items: POItem[];
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge-info',
  SENT: 'badge-warning',
  PARTIALLY_RECEIVED: 'badge-warning',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
};

export default function PurchaseOrdersPage() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showReceive, setShowReceive] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/purchase-orders').then(r => setOrders(r.data.data)),
      api.get('/suppliers').then(r => setSuppliers(r.data.data)),
      api.get('/products').then(r => setProducts(r.data.data)),
    ]).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id: string, status: 'SENT' | 'CANCELLED') => {
    try { await api.put(`/purchase-orders/${id}/status`, { status }); fetchAll(); }
    catch (err: any) { alert(err.response?.data?.error ?? 'Failed to update status.'); }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Purchase Orders</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{orders.length} orders</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setError(''); setShowCreate(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Purchase Order
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text-muted)' }}>
            <Truck className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No purchase orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                  {['PO Number', 'Supplier', 'Order Date', 'Items', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3">{h}</th>
                  ))}
                  {isAdmin && <th className="text-right px-5 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map(po => (
                  <tr key={po.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{po.poNumber}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{po.supplier.companyName}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{new Date(po.orderDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{po.items.length} item(s)</td>
                    <td className="px-5 py-3.5"><span className={STATUS_BADGE[po.status]}>{po.status.replace('_', ' ')}</span></td>
                    {isAdmin && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {po.status === 'DRAFT' && (
                            <button onClick={() => updateStatus(po.id, 'SENT')} className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ color: 'var(--accent)' }}>Mark Sent</button>
                          )}
                          {(po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && (
                            <button onClick={() => setShowReceive(po)} className="text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ color: 'var(--success)' }}>
                              <PackageCheck className="w-3.5 h-3.5" /> Receive
                            </button>
                          )}
                          {(po.status === 'DRAFT' || po.status === 'SENT') && (
                            <button onClick={() => updateStatus(po.id, 'CANCELLED')} className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ color: 'var(--danger)' }}>Cancel</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreatePOModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAll(); }}
        />
      )}

      {showReceive && (
        <ReceiveModal
          po={showReceive}
          onClose={() => setShowReceive(null)}
          onReceived={() => { setShowReceive(null); fetchAll(); }}
        />
      )}
    </AppLayout>
  );
}

// ─── Create PO Modal ────────────────────────────────────────────────────────────

function CreatePOModal({ suppliers, products, onClose, onCreated }: {
  suppliers: Supplier[]; products: Product[]; onClose: () => void; onCreated: () => void;
}) {
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', quantityOrdered: '', unitCost: '' }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const addRow = () => setItems([...items, { productId: '', quantityOrdered: '', unitCost: '' }]);
  const removeRow = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: string) =>
    setItems(items.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const handleSubmit = async () => {
    setError('');
    if (!supplierId) return setError('Select a supplier.');
    if (items.some(i => !i.productId || !i.quantityOrdered || !i.unitCost)) {
      return setError('Fill in all item fields.');
    }
    setSaving(true);
    try {
      await api.post('/purchase-orders', {
        supplierId,
        expectedDate: expectedDate || undefined,
        notes: notes || undefined,
        items: items.map(i => ({
          productId: i.productId,
          quantityOrdered: Number(i.quantityOrdered),
          unitCost: Number(i.unitCost),
        })),
      });
      onCreated();
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to create purchase order.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-card)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>New Purchase Order</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Supplier</label>
              <select className="input" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">Select supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Expected Delivery</label>
              <input type="date" className="input" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Notes</label>
            <input className="input" placeholder="Optional" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Items</label>
              <button onClick={addRow} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select className="input flex-1" value={row.productId} onChange={e => updateRow(i, 'productId', e.target.value)}>
                    <option value="">Select product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" min="1" className="input w-24" placeholder="Qty" value={row.quantityOrdered} onChange={e => updateRow(i, 'quantityOrdered', e.target.value)} />
                  <input type="number" min="0" step="0.01" className="input w-28" placeholder="Unit cost" value={row.unitCost} onChange={e => updateRow(i, 'unitCost', e.target.value)} />
                  {items.length > 1 && (
                    <button onClick={() => removeRow(i)} style={{ color: 'var(--danger)' }}><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Purchase Order'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Receive Stock Modal ────────────────────────────────────────────────────────

function ReceiveModal({ po, onClose, onReceived }: { po: PurchaseOrder; onClose: () => void; onReceived: () => void }) {
  const outstanding = po.items.filter(i => i.quantityReceived < i.quantityOrdered);
  const [rows, setRows] = useState(
    outstanding.map(i => ({ itemId: i.id, quantityReceived: '', damagedCount: '', qualityNotes: '' }))
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateRow = (i: number, field: string, value: string) =>
    setRows(rows.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const handleSubmit = async () => {
    setError('');
    const toSubmit = rows.filter(r => r.quantityReceived && Number(r.quantityReceived) > 0);
    if (toSubmit.length === 0) return setError('Enter a quantity for at least one item.');
    setSaving(true);
    try {
      await api.post(`/purchase-orders/${po.id}/receive`, {
        items: toSubmit.map(r => ({
          itemId: r.itemId,
          quantityReceived: Number(r.quantityReceived),
          damagedCount: r.damagedCount ? Number(r.damagedCount) : undefined,
          qualityNotes: r.qualityNotes || undefined,
        })),
      });
      onReceived();
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to receive stock.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-card)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Receive Stock — {po.poNumber}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          {outstanding.map((item, i) => (
            <div key={item.id} className="p-3 rounded-lg" style={{ border: '1px solid var(--bg-border)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {item.product.name} — ordered {item.quantityOrdered}, received {item.quantityReceived} so far
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Qty Received</label>
                  <input type="number" min="0" className="input" value={rows[i].quantityReceived} onChange={e => updateRow(i, 'quantityReceived', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Damaged</label>
                  <input type="number" min="0" className="input" value={rows[i].damagedCount} onChange={e => updateRow(i, 'damagedCount', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Notes</label>
                  <input className="input" value={rows[i].qualityNotes} onChange={e => updateRow(i, 'qualityNotes', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? 'Receiving...' : 'Confirm Receipt'}</button>
        </div>
      </div>
    </div>
  );
}