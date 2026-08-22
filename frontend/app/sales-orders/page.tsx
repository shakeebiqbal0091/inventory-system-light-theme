'use client';
// app/sales-orders/page.tsx
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { Plus, X, Truck, Package, RotateCcw, Trash2 } from 'lucide-react';

interface Product { id: string; name: string; quantity: number; }
interface Customer { id: string; name: string; company?: string; }
interface SaleLine {
  id: string; productId: string; product: { id: string; name: string };
  quantity: number; totalPrice: number;
}
interface SalesOrder {
  id: string; orderNumber: string; status: string; channel: string; orderDate: string;
  notes?: string; customer?: { id: string; name: string; company?: string };
  sales: SaleLine[];
  shipment?: { carrierName?: string; trackingNumber?: string; shipDate?: string };
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-info',
  PACKING: 'badge-warning',
  SHIPPED: 'badge-success',
  CANCELLED: 'badge-danger',
};

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showShip, setShowShip] = useState<SalesOrder | null>(null);
  const [showReturn, setShowReturn] = useState<SalesOrder | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/sales-orders').then(r => setOrders(r.data.data)),
      api.get('/customers').then(r => setCustomers(r.data.data)),
      api.get('/products').then(r => setProducts(r.data.data)),
    ]).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id: string, status: 'PACKING' | 'CANCELLED') => {
    try { await api.put(`/sales-orders/${id}/status`, { status }); fetchAll(); }
    catch (err: any) { alert(err.response?.data?.error ?? 'Failed to update status.'); }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Sales Orders</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{orders.length} orders</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Sales Order
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text-muted)' }}>
            <Package className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No sales orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                  {['Order #', 'Customer', 'Channel', 'Date', 'Items', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3">{h}</th>
                  ))}
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{o.orderNumber}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{o.customer?.name ?? 'Walk-in'}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{o.channel.replace('_', ' ')}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{new Date(o.orderDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{o.sales.length} item(s)</td>
                    <td className="px-5 py-3.5"><span className={STATUS_BADGE[o.status]}>{o.status}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {o.status === 'PENDING' && (
                          <button onClick={() => updateStatus(o.id, 'PACKING')} className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ color: 'var(--accent)' }}>Mark Packing</button>
                        )}
                        {o.status === 'PACKING' && (
                          <button onClick={() => setShowShip(o)} className="text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ color: 'var(--success)' }}>
                            <Truck className="w-3.5 h-3.5" /> Ship
                          </button>
                        )}
                        {o.status === 'SHIPPED' && (
                          <button onClick={() => setShowReturn(o)} className="text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ color: 'var(--warning)' }}>
                            <RotateCcw className="w-3.5 h-3.5" /> Return
                          </button>
                        )}
                        {(o.status === 'PENDING' || o.status === 'PACKING') && (
                          <button onClick={() => updateStatus(o.id, 'CANCELLED')} className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ color: 'var(--danger)' }}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateOrderModal
          customers={customers} products={products}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAll(); }}
        />
      )}
      {showShip && (
        <ShipModal order={showShip} onClose={() => setShowShip(null)} onShipped={() => { setShowShip(null); fetchAll(); }} />
      )}
      {showReturn && (
        <ReturnModal order={showReturn} onClose={() => setShowReturn(null)} onReturned={() => { setShowReturn(null); fetchAll(); }} />
      )}
    </AppLayout>
  );
}

// ─── Create Order Modal ─────────────────────────────────────────────────────────

function CreateOrderModal({ customers, products, onClose, onCreated }: {
  customers: Customer[]; products: Product[]; onClose: () => void; onCreated: () => void;
}) {
  const [customerId, setCustomerId] = useState('');
  const [channel, setChannel] = useState<'ONLINE' | 'IN_STORE' | 'WHOLESALE'>('IN_STORE');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: '' }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const addRow = () => setItems([...items, { productId: '', quantity: '' }]);
  const removeRow = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: string) =>
    setItems(items.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const handleSubmit = async () => {
    setError('');
    if (items.some(i => !i.productId || !i.quantity)) return setError('Fill in all item fields.');
    setSaving(true);
    try {
      await api.post('/sales-orders', {
        customerId: customerId || undefined,
        channel,
        notes: notes || undefined,
        items: items.map(i => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      onCreated();
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to create sales order.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-card)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>New Sales Order</h2>
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Customer (optional)</label>
              <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Walk-in / no customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Channel</label>
              <select className="input" value={channel} onChange={e => setChannel(e.target.value as any)}>
                <option value="IN_STORE">In-Store</option>
                <option value="ONLINE">Online</option>
                <option value="WHOLESALE">Wholesale</option>
              </select>
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
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.quantity} in stock)</option>)}
                  </select>
                  <input type="number" min="1" className="input w-24" placeholder="Qty" value={row.quantity} onChange={e => updateRow(i, 'quantity', e.target.value)} />
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
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Order'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Ship Modal ─────────────────────────────────────────────────────────────────

function ShipModal({ order, onClose, onShipped }: { order: SalesOrder; onClose: () => void; onShipped: () => void }) {
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipDate, setShipDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError(''); setSaving(true);
    try {
      await api.post(`/sales-orders/${order.id}/shipment`, {
        carrierName: carrierName || undefined,
        trackingNumber: trackingNumber || undefined,
        shipDate,
        packingSlipNotes: notes || undefined,
      });
      onShipped();
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to record shipment.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl w-full max-w-md" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Ship Order — {order.orderNumber}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <Field label="Carrier" value={carrierName} onChange={setCarrierName} placeholder="e.g. FedEx" />
          <Field label="Tracking Number" value={trackingNumber} onChange={setTrackingNumber} placeholder="Optional" />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Ship Date</label>
            <input type="date" className="input" value={shipDate} onChange={e => setShipDate(e.target.value)} />
          </div>
          <Field label="Packing Slip Notes" value={notes} onChange={setNotes} placeholder="Optional" />
        </div>
        <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? 'Shipping...' : 'Confirm Shipment'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Return Modal ───────────────────────────────────────────────────────────────

function ReturnModal({ order, onClose, onReturned }: { order: SalesOrder; onClose: () => void; onReturned: () => void }) {
  const [saleId, setSaleId] = useState(order.sales[0]?.id ?? '');
  const [reason, setReason] = useState('');
  const [quantity, setQuantity] = useState('');
  const [disposition, setDisposition] = useState<'RESTOCK' | 'WRITE_OFF'>('RESTOCK');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!reason.trim() || !quantity) return setError('Reason and quantity are required.');
    setSaving(true);
    try {
      await api.post(`/sales-orders/${order.id}/returns`, {
        saleId: saleId || undefined,
        reason,
        quantity: Number(quantity),
        disposition,
      });
      onReturned();
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to record return.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl w-full max-w-md" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>Process Return — {order.orderNumber}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Item</label>
            <select className="input" value={saleId} onChange={e => setSaleId(e.target.value)}>
              {order.sales.map(s => (
                <option key={s.id} value={s.id}>{s.product.name} (qty {s.quantity})</option>
              ))}
            </select>
          </div>
          <Field label="Reason" value={reason} onChange={setReason} placeholder="e.g. Wrong size, damaged in transit" />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Quantity</label>
            <input type="number" min="1" className="input" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Disposition</label>
            <select className="input" value={disposition} onChange={e => setDisposition(e.target.value as any)}>
              <option value="RESTOCK">Restock — add back to sellable inventory</option>
              <option value="WRITE_OFF">Write-off — damaged, do not restock</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? 'Processing...' : 'Confirm Return'}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input className="input" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}