'use client';
// components/layout/Header.tsx
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Search, Bell, ChevronDown } from 'lucide-react';

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center justify-between mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl w-64"
          style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search products, sales..."
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* Notifications */}
        <button className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}>
          <Bell className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </button>

        {/* User menu */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: 'var(--accent)' }}>
            {initials}
          </div>
          <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </div>
  );
}