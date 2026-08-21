'use client';
// app/contacts/page.tsx
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Plus, Pencil, Trash2, X, Users, Truck, Search } from 'lucide-react';
import clsx from 'clsx';

interface Supplier {
  id: string; companyName: string; contactPerson?: string; email?: string;
  phone?: string; address?: string; paymentTerms?: string; leadTimeDays?: number;
}
interface Customer {
  id: string; name: string; company?: string; email?: string;
  phone?: string; shippingAddress?: string; billingAddress?: string;
}

const EMPTY_SUPPLIER = { companyName: '', contactPerson: '', email: '', phone: '', address: '', paymentTerms: '', leadTimeDays: '' };
const EMPTY_CUSTOMER = { name: '', company: '', email: '', phone: '', shippingAddress: '', billingAddress: '' };

export default function ContactsPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<'suppliers' | 'customers'>('suppliers');
  const [search, setSearch] = useState('');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_SUPPLIER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/suppliers').then(r => setSuppliers(r.data.data)),
      api.get('/customers').then(r => setCustomers(r.data.data)),
    ]).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(tab === 'suppliers' ? EMPTY_SUPPLIER : EMPTY_CUSTOMER);
    setError(''); setShowModal(true);
  };
  const openEdit = (item: any) => {
    setEditItem(item);
    if (tab === 'suppliers') {
      setForm({
        companyName: item.companyName, contactPerson: item.contactPerson ?? '', email: item.email ?? '',
        phone: item.phone ?? '', address: item.address ?? '', paymentTerms: item.paymentTerms ?? '',
        leadTimeDays: item.leadTimeDays != null ? String(item.leadTimeDays) : '',
      });
    } else {
      setForm({
        name: item.name, company: item.company ?? '', email: item.email ?? '',
        phone: item.phone ?? '', shippingAddress: item.shippingAddress ?? '', billingAddress: item.billingAddress ?? '',
      });
    }
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    setError(''); setSaving(true);
    const base = tab === 'suppliers' ? '/suppliers' : '/customers';
    try {
      const payload = tab === 'suppliers'
        ? { ...form, leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined }
        : form;
      editItem ? await api.put(`${base}/${editItem.id}`, payload) : await api.post(base, payload);
      setShowModal(false); fetchAll();
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const base = tab === 'suppliers' ? '/suppliers' : '/customers';
    try { await api.delete(`${base}/${id}`); fetchAll(); }
    catch (err: any) { alert(err.response?.data?.error ?? 'Failed to delete.'); }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (s.contactPerson ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const supplierFields = [
    { label: 'Company Name',   key: 'companyName',   type: 'text',   ph: 'e.g. Acme Supplies' },
    { label: 'Contact Person', key: 'contactPerson', type: 'text',   ph: 'Optional' },
    { label: 'Email',          key: 'email',         type: 'email',  ph: 'Optional' },
    { label: 'Phone',          key: 'phone',         type: 'text',   ph: 'Optional' },
    { label: 'Address',        key: 'address',       type: 'text',   ph: 'Optional' },
    { label: 'Payment Terms',  key: 'paymentTerms',  type: 'text',   ph: 'e.g. Net 30' },
    { label: 'Lead Time (days)', key: 'leadTimeDays', type: 'number', ph: 'Optional' },
  ];
  const customerFields = [
    { label: 'Name',              key: 'name',             type: 'text',  ph: 'e.g. Jane Doe' },
    { label: 'Company',           key: 'company',          type: 'text',  ph: 'Optional' },
    { label: 'Email',             key: 'email',            type: 'email', ph: 'Optional' },
    { label: 'Phone',             key: 'phone',            type: 'text',  ph: 'Optional' },
    { label: 'Shipping Address',  key: 'shippingAddress',  type: 'text',  ph: 'Optional' },
    { label: 'Billing Address',   key: 'billingAddress',   type: 'text',  ph: 'Optional' },
  ];
  const activeFields = tab === 'suppliers' ? supplierFields : customerFields;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Contacts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {tab === 'suppliers' ? `${suppliers.length} suppliers` : `${customers.length} customers`}
          </p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add {tab === 'suppliers' ? 'Supplier' : 'Customer'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {(['suppliers', 'customers'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t
              ? { backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }
              : { color: 'var(--text-muted)' }}
          >
            {t === 'suppliers' ? <Truck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {t === 'suppliers' ? 'Suppliers' : 'Customers'}
          </button>
        ))}
      </div>

      <div className="relative mb-5 gap-3">
  <Search
    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
    style={{ color: 'var(--text-muted)' }}
  />

  <input
    prefix="search"
    className="input pr-9"
    placeholder="Search Suppliers..."
    value={search}
    onChange={e => setSearch(e.target.value)}
  />
</div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : tab === 'suppliers' ? (
          filteredSuppliers.length === 0 ? (
            <EmptyState icon={<Truck className="w-8 h-8 mb-2 opacity-40" />} label="No suppliers found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                    {['Company', 'Contact', 'Email', 'Phone', 'Terms', 'Lead Time'].map(h => (
                      <th key={h} className="text-left px-5 py-3">{h}</th>
                    ))}
                    {isAdmin && <th className="text-right px-5 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{s.companyName}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{s.contactPerson || '—'}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{s.email || '—'}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{s.phone || '—'}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{s.paymentTerms || '—'}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{s.leadTimeDays != null ? `${s.leadTimeDays}d` : '—'}</td>
                      {isAdmin && <RowActions onEdit={() => openEdit(s)} onDelete={() => handleDelete(s.id, s.companyName)} />}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredCustomers.length === 0 ? (
            <EmptyState icon={<Users className="w-8 h-8 mb-2 opacity-40" />} label="No customers found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
                    {['Name', 'Company', 'Email', 'Phone', 'Shipping Address'].map(h => (
                      <th key={h} className="text-left px-5 py-3">{h}</th>
                    ))}
                    {isAdmin && <th className="text-right px-5 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{c.company || '—'}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{c.phone || '—'}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{c.shippingAddress || '—'}</td>
                      {isAdmin && <RowActions onEdit={() => openEdit(c)} onDelete={() => handleDelete(c.id, c.name)} />}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-card)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--text-heading)' }}>
                {editItem ? 'Edit' : 'Add'} {tab === 'suppliers' ? 'Supplier' : 'Customer'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
                  {error}
                </div>
              )}
              {activeFields.map(({ label, key, type, ph }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input type={type} className="input" placeholder={ph}
                    value={form[key] ?? ''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid var(--bg-border)' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : editItem ? 'Save Changes' : `Add ${tab === 'suppliers' ? 'Supplier' : 'Customer'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text-muted)' }}>
      {icon}
      <p className="text-sm">{label}</p>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <td className="px-5 py-3.5">
      <div className="flex items-center justify-end gap-2">
        <button onClick={onEdit} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  );
}