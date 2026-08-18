'use client';
// components/layout/Sidebar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import {
  LayoutDashboard, Package, ShoppingCart, AlertTriangle,
  LogOut, ChevronRight, Package2, Sun, Moon,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products',  label: 'Products',  icon: Package },
  { href: '/sales',     label: 'Sales',     icon: ShoppingCart },
  { href: '/low-stock', label: 'Low Stock', icon: AlertTriangle, alert: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  return (
    <aside style={{
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--bg-border)',
    }} className="fixed left-0 top-0 h-screen w-60 border-r flex flex-col z-30 transition-colors duration-200">

      {/* Logo */}
      <div style={{ borderColor: 'var(--bg-border)' }} className="flex items-center gap-3 px-5 py-5 border-b">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--accent)' }}>
          <Package2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>Inventory Pro</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, alert }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={active ? {
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent)',
              } : {
                color: 'var(--text-muted)',
              }}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                !active && 'hover:bg-[var(--bg-hover)]'
              )}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', alert && !active && 'text-amber-500')} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ borderColor: 'var(--bg-border)' }} className="px-3 py-4 border-t space-y-1">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{ color: 'var(--text-muted)', borderColor: 'var(--bg-border)' }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
        >
          <div className="flex items-center gap-3">
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            <span style={{ color: 'var(--text-primary)' }}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </div>
          {/* Toggle pill */}
          <div
            style={{ backgroundColor: isDark ? 'var(--bg-border)' : 'var(--accent)' }}
            className="w-10 h-5 rounded-full relative transition-colors duration-200"
          >
            <div
              className={clsx(
                'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                isDark ? 'left-0.5' : 'left-5'
              )}
            />
          </div>
        </button>

        {/* User card */}
        <div style={{ backgroundColor: 'var(--bg-hover)' }} className="px-3 py-2.5 rounded-lg">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-heading)' }}>{user?.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={isAdmin ? 'badge-info' : 'badge-success'}>{user?.role}</span>
            <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{ color: 'var(--text-muted)' }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:text-red-500 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
