'use client';
// app/warehouses/page.tsx
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Plus, Pencil, Trash2, X, Warehouse as WarehouseIcon } from 'lucide-react';

interface Warehouse { id: string; name: string; address?: string; isDefault: boolean; }

const EMPTY = { name: '', address: '' };

export default function WarehousesPage() {
  const { isAdmin } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Warehouse | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    api.get('/warehouses').then(r => setWarehouses(r.data.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit = (w: Warehouse) => {
    setEditItem(w);
    setForm({ name: w.name, address: w.address ?? '' });
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) return setError('Warehouse name is required.');
    setSaving(true);
    try {
      editItem
        ? await api.put(`/warehouses/${editItem.id}`, form)
        : await api.post('/warehouses', form);
      setShowModal(false); fetchAll();
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Any stock recorded at this location will be affected.`)) return;
    try { await api.delete(`/warehouses/${id}`); fetchAll(); }
    catch (err: any) { alert(err.response?.data?.error ?? 'Failed to delete.'); }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Warehouses</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{warehouses.length} locations</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Warehouse
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text-muted)' }}>
            <WarehouseIcon className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No warehouses yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Address</th>
                  {isAdmin && <th className="text-right px-5 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {warehouses.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{w.name}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{w.address || '—'}</td>
                    {isAdmin && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(w.id, w.name)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}><Trash2 className="w-3.5 h-3.5" /></button>
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

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl w-full max-w-md" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>{editItem ? 'Edit' : 'Add'} Warehouse</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Name</label>
                <input className="input" placeholder="e.g. Main Warehouse" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Address</label>
                <input className="input" placeholder="Optional" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid var(--bg-border)' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Warehouse'}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}