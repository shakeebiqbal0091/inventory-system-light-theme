'use client';
// app/settings/page.tsx
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { User, Building2, Bell, Lock, Save } from 'lucide-react';

interface Settings {
  profile: { id: string; name: string; email: string; role: string; createdAt: string };
  preferences: { currency: string; lowStockThreshold: number; dateFormat: string };
  business: { businessName?: string; businessEmail?: string; businessPhone?: string; businessAddress?: string };
  notifications: { lowStockAlerts: boolean; salesNotifications: boolean; emailNotifications: boolean };
}

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'business', label: 'Business', icon: Building2 },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'password', label: 'Password', icon: Lock },
] as const;

export default function SettingsPage() {
  const [tab, setTab] = useState<typeof TABS[number]['key']>('profile');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [businessForm, setBusinessForm] = useState({ businessName: '', businessEmail: '', businessPhone: '', businessAddress: '' });
  const [notifForm, setNotifForm] = useState({ lowStockAlerts: true, salesNotifications: true, emailNotifications: false });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    api.get('/settings').then((res) => {
      const data: Settings = res.data.data;
      setSettings(data);
      setProfileForm({ name: data.profile.name, email: data.profile.email });
      setBusinessForm({
        businessName: data.business.businessName ?? '',
        businessEmail: data.business.businessEmail ?? '',
        businessPhone: data.business.businessPhone ?? '',
        businessAddress: data.business.businessAddress ?? '',
      });
      setNotifForm(data.notifications);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const flash = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/settings/profile', profileForm);
      flash('success', 'Profile updated.');
    } catch (err: any) { flash('error', err.response?.data?.error ?? 'Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const saveBusiness = async () => {
    setSaving(true);
    try {
      await api.put('/settings/business', businessForm);
      flash('success', 'Business info updated.');
    } catch (err: any) { flash('error', err.response?.data?.error ?? 'Failed to update business info.'); }
    finally { setSaving(false); }
  };

  const saveNotifications = async (next: typeof notifForm) => {
    setNotifForm(next);
    try {
      await api.put('/settings/notifications', next);
      flash('success', 'Notification settings updated.');
    } catch (err: any) { flash('error', err.response?.data?.error ?? 'Failed to update notifications.'); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      flash('error', 'New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/settings/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      flash('success', 'Password changed.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { flash('error', err.response?.data?.error ?? 'Failed to change password.'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage your profile, business info, and preferences</p>
      </div>

      {msg && (
        <div className="mb-5 text-sm px-4 py-2.5 rounded-lg"
          style={msg.type === 'success'
            ? { backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--success)' }
            : { backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={tab === key ? { backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' } : { color: 'var(--text-muted)' }}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="card max-w-xl">
        {tab === 'profile' && (
          <div className="space-y-4">
            <Field label="Name" value={profileForm.name} onChange={(v) => setProfileForm(f => ({ ...f, name: v }))} />
            <Field label="Email" type="email" value={profileForm.email} onChange={(v) => setProfileForm(f => ({ ...f, email: v }))} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Role: {settings?.profile.role}</p>
            <SaveButton onClick={saveProfile} saving={saving} />
          </div>
        )}

        {tab === 'business' && (
          <div className="space-y-4">
            <Field label="Business Name" value={businessForm.businessName} onChange={(v) => setBusinessForm(f => ({ ...f, businessName: v }))} />
            <Field label="Business Email" type="email" value={businessForm.businessEmail} onChange={(v) => setBusinessForm(f => ({ ...f, businessEmail: v }))} />
            <Field label="Business Phone" value={businessForm.businessPhone} onChange={(v) => setBusinessForm(f => ({ ...f, businessPhone: v }))} />
            <Field label="Business Address" value={businessForm.businessAddress} onChange={(v) => setBusinessForm(f => ({ ...f, businessAddress: v }))} />
            <SaveButton onClick={saveBusiness} saving={saving} />
          </div>
        )}

        {tab === 'notifications' && (
          <div className="space-y-4">
            <Toggle label="Low Stock Alerts" checked={notifForm.lowStockAlerts} onChange={(v) => saveNotifications({ ...notifForm, lowStockAlerts: v })} />
            <Toggle label="Sales Notifications" checked={notifForm.salesNotifications} onChange={(v) => saveNotifications({ ...notifForm, salesNotifications: v })} />
            <Toggle label="Email Notifications" checked={notifForm.emailNotifications} onChange={(v) => saveNotifications({ ...notifForm, emailNotifications: v })} />
          </div>
        )}

        {tab === 'password' && (
          <div className="space-y-4">
            <Field label="Current Password" type="password" value={pwForm.currentPassword} onChange={(v) => setPwForm(f => ({ ...f, currentPassword: v }))} />
            <Field label="New Password" type="password" value={pwForm.newPassword} onChange={(v) => setPwForm(f => ({ ...f, newPassword: v }))} />
            <Field label="Confirm New Password" type="password" value={pwForm.confirmPassword} onChange={(v) => setPwForm(f => ({ ...f, confirmPassword: v }))} />
            <SaveButton onClick={changePassword} saving={saving} label="Change Password" />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <button onClick={() => onChange(!checked)} className="relative h-5 w-9 rounded-full transition-colors"
        style={{ backgroundColor: checked ? 'var(--accent)' : 'var(--bg-border)' }}>
        <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all" style={{ left: checked ? '18px' : '2px' }} />
      </button>
    </div>
  );
}

function SaveButton({ onClick, saving, label = 'Save Changes' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving} className="btn-primary flex items-center gap-2">
      <Save className="w-4 h-4" /> {saving ? 'Saving...' : label}
    </button>
  );
}