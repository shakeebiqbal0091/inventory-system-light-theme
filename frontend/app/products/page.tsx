'use client';
// app/products/page.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';  
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Plus, Pencil, Trash2, Search, AlertTriangle, X, Package } from 'lucide-react';
import clsx from 'clsx';

interface Product {
  id: string; name: string; category: string;
  costPrice: number; price: number;
  quantity: number; lowStockThreshold: number;
  supplier?: string; description?: string; isLowStock: boolean;
}
const EMPTY = { name:'', category:'', costPrice:'', price:'', quantity:'', lowStockThreshold:'10', supplier:'', description:'' };

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const fetch = () => api.get('/products').then(r => setProducts(r.data.data)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditProduct(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, category: p.category, costPrice: String(p.costPrice), price: String(p.price),
      quantity: String(p.quantity), lowStockThreshold: String(p.lowStockThreshold), supplier: p.supplier ?? '', description: p.description ?? '' });
    setError(''); setShowModal(true);
  };
  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      const payload = { ...form, costPrice: Number(form.costPrice), price: Number(form.price), quantity: Number(form.quantity), lowStockThreshold: Number(form.lowStockThreshold) };
      editProduct ? await api.put(`/products/${editProduct.id}`, payload) : await api.post('/products', payload);
      setShowModal(false); fetch();
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to save.'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await api.delete(`/products/${id}`); fetch(); }
    catch (err: any) { alert(err.response?.data?.error ?? 'Failed to delete.'); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Products</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{products.length} total products</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input className="input pl-9" placeholder="Search by name or category..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text-muted)' }}>
            <Package className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                  {['Product','Category','Cost Price','Sell Price','Margin','Stock','Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3">{h}</th>
                  ))}
                  {isAdmin && <th className="text-right px-5 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const margin = p.price > 0 ? Math.round(((p.price - p.costPrice) / p.price) * 100) : 0;
                  return (
                    <tr key={p.id} className="transition-colors" style={{ borderBottom: '1px solid var(--bg-border)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{p.category}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--warning)' }}>${p.costPrice.toFixed(2)}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-primary)' }}>${p.price.toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={margin >= 30 ? 'badge-success' : margin >= 15 ? 'badge-warning' : 'badge-danger'}>{margin}%</span>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: p.isLowStock ? 'var(--danger)' : 'var(--text-primary)' }}>{p.quantity}</td>
                      <td className="px-5 py-3.5">
                        {p.isLowStock
                          ? <span className="badge-danger flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" /> Low</span>
                          : <span className="badge-success">In Stock</span>}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-card)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>{editProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>{error}</div>}
              {[
                { label: 'Product Name', key: 'name',     type: 'text',   ph: 'e.g. Wireless Mouse' },
                { label: 'Category',     key: 'category', type: 'text',   ph: 'e.g. Electronics' },
              ].map(({ label, key, type, ph }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input type={type} className="input" placeholder={ph}
                    value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Cost Price ($)</label>
                  <input type="number" className="input" placeholder="What you pay"
                    value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Sell Price ($)</label>
                  <input type="number" className="input" placeholder="What you charge"
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
              </div>
              {form.costPrice && form.price && Number(form.price) > 0 && (
                <div className="rounded-lg px-4 py-3 text-xs flex justify-between items-center"
                  style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Profit per unit</span>
                  <span className="font-bold" style={{ color: 'var(--success)' }}>
                    ${(Number(form.price) - Number(form.costPrice)).toFixed(2)} &nbsp;
                    ({Math.round(((Number(form.price) - Number(form.costPrice)) / Number(form.price)) * 100)}% margin)
                  </span>
                </div>
              )}
              {[
                { label: 'Quantity',            key: 'quantity',          type: 'number', ph: '0' },
                { label: 'Low Stock Threshold', key: 'lowStockThreshold', type: 'number', ph: '10' },
                { label: 'Supplier',            key: 'supplier',          type: 'text',   ph: 'Optional' },
              ].map(({ label, key, type, ph }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input type={type} className="input" placeholder={ph}
                    value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid var(--bg-border)' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
