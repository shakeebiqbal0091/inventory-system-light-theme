'use client';
// components/layout/Header.tsx
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Search, Bell, ChevronDown, AlertTriangle, LogOut, User } from 'lucide-react';

interface LowStockProduct {
  id: string;
  name: string;
  quantity: number;
}

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Fetch low-stock items for the notification bell ────────────────────────
  useEffect(() => {
    api.get('/products/low-stock')
      .then((res) => setLowStock(res.data.data ?? []))
      .catch(() => setLowStock([]));
  }, []);

  // ── Close dropdowns when clicking outside them ──────────────────────────────
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="flex items-center justify-between mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">

        {/* Search — now a real form that navigates to Products with the query */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl w-64"
          style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: 'var(--text-primary)' }}
          />
        </form>

        {/* Notifications — real dropdown backed by actual low-stock data */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setMenuOpen(false); }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}
          >
            <Bell className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            {lowStock.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--danger)' }}>
                {lowStock.length > 9 ? '9+' : lowStock.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl overflow-hidden z-50"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', boxShadow: '0 8px 24px rgba(20,16,31,0.12)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>Low Stock Alerts</p>
              </div>
              <div className="max-h-72 overflow-auto">
                {lowStock.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>All products well stocked ✓</p>
                ) : (
                  lowStock.map((p) => (
                    <div key={p.id} className="px-4 py-2.5 flex items-center gap-3"
                      style={{ borderBottom: '1px solid var(--bg-border)' }}>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--warning)' }} />
                      <div className="min-w-0">
                        <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.quantity} left in stock</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {lowStock.length > 0 && (
                <button
                  onClick={() => { setNotifOpen(false); router.push('/low-stock'); }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-center"
                  style={{ color: 'var(--accent)' }}
                >
                  View all
                </button>
              )}
            </div>
          )}
        </div>

        {/* User menu — real dropdown with profile info + logout */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--accent)' }}>
              {initials}
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden z-50"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', boxShadow: '0 8px 24px rgba(20,16,31,0.12)' }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-heading)' }}>{user?.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full px-4 py-2.5 text-sm font-medium flex items-center gap-2 hover:bg-red-500/5"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}