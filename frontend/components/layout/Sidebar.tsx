// 'use client';
// // components/layout/Sidebar.tsx
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useAuth } from '@/lib/auth-context';
// import { useTheme } from '@/lib/theme-context';
// import {
//   LayoutDashboard, Package, ShoppingCart, AlertTriangle,
//   Users, LogOut, ChevronRight, Package2, Sun, Moon,      // ← added Users
// } from 'lucide-react';
// import clsx from 'clsx';

// const navItems = [
//   { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
//   { href: '/products',  label: 'Products',  icon: Package },
//   { href: '/sales',     label: 'Sales',     icon: ShoppingCart },
//   { href: '/contacts',  label: 'Contacts',  icon: Users },      // ← added
//   { href: '/low-stock', label: 'Low Stock', icon: AlertTriangle, alert: true },
// ];

// export default function Sidebar() {
//   const pathname = usePathname();
//   const { user, logout, isAdmin } = useAuth();
//   const { toggleTheme, isDark } = useTheme();

//   return (
//     <aside style={{
//       backgroundColor: 'var(--bg-secondary)',
//       borderColor: 'var(--bg-border)',
//     }} className="fixed left-0 top-0 h-screen w-60 border-r flex flex-col z-30 transition-colors duration-200">

//       {/* Logo */}
//       <div style={{ borderColor: 'var(--bg-border)' }} className="flex items-center gap-3 px-5 py-5 border-b">
//         <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
//           style={{ backgroundColor: 'var(--accent)' }}>
//           <Package2 className="w-4 h-4 text-white" />
//         </div>
//         <span className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>Inventory Pro</span>
//       </div>

//       {/* Nav */}
//       <nav className="flex-1 px-3 py-4 space-y-0.5">
//         {navItems.map(({ href, label, icon: Icon, alert }) => {
//           const active = pathname === href;
//           return (
//             <Link
//               key={href}
//               href={href}
//               style={active ? {
//                 backgroundColor: 'var(--accent-subtle)',
//                 color: 'var(--accent)',
//               } : {
//                 color: 'var(--text-muted)',
//               }}
//               className={clsx(
//                 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
//                 !active && 'hover:bg-[var(--bg-hover)]'
//               )}
//               onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
//               onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
//             >
//               <Icon className={clsx('w-4 h-4 flex-shrink-0', alert && !active && 'text-amber-500')} />
//               <span className="flex-1">{label}</span>
//               {active && <ChevronRight className="w-3 h-3" />}
//             </Link>
//           );
//         })}
//       </nav>

//       {/* Bottom section */}
//       <div style={{ borderColor: 'var(--bg-border)' }} className="px-3 py-4 border-t space-y-1">

//         {/* Theme toggle */}
//         <button
//           onClick={toggleTheme}
//           style={{ color: 'var(--text-muted)', borderColor: 'var(--bg-border)' }}
//           className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
//         >
//           <div className="flex items-center gap-3">
//             {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
//             <span style={{ color: 'var(--text-primary)' }}>
//               {isDark ? 'Light Mode' : 'Dark Mode'}
//             </span>
//           </div>
//           {/* Toggle pill */}
//           <div
//             style={{ backgroundColor: isDark ? 'var(--bg-border)' : 'var(--accent)' }}
//             className="w-10 h-5 rounded-full relative transition-colors duration-200"
//           >
//             <div
//               className={clsx(
//                 'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
//                 isDark ? 'left-0.5' : 'left-5'
//               )}
//             />
//           </div>
//         </button>

      
//         {/* Logout */}
//         <button
//           onClick={logout}
//           style={{ color: 'var(--text-muted)' }}
//           className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:text-red-500 hover:bg-red-500/5 transition-all"
//         >
//           <LogOut className="w-4 h-4" />
//           Sign out
//         </button>
//       </div>
//     </aside>
//   );
// }







// ---------------------------New Sidebar------------------------


'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  AlertTriangle,
  Users,
  LogOut,
  Package2,
  Sun,
  Moon,
  ChevronRight,
  Settings,
  CircleUserRound,
} from 'lucide-react';

import clsx from 'clsx';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/products',
    label: 'Products',
    icon: Package,
  },
  {
    href: '/sales',
    label: 'Sales',
    icon: ShoppingCart,
  },
  {
    href: '/contacts',
    label: 'Contacts',
    icon: Users,
  },

  {
    href: '/low-stock',
    label: 'Low Stock',
    icon: AlertTriangle,
    alert: true,
  },
  {
    href: '/Sales & Orders',
    label: 'Sales & Orders',
    icon: Users,
  },
  {
    href: '/Multi-warehouse stock',
    label: 'Multi-warehouse stock',
    icon: Users,
  },
  {
    href: '/Reports & Analytics',
    label: 'Reports & Analytics',
    icon: Users,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--bg-border)',
      }}
    >
      {/* =========================================================
          BRAND
      ========================================================= */}
      <div
        className="flex h-[76px] items-center border-b px-5"
        style={{
          borderColor: 'var(--bg-border)',
        }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          {/* Logo */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
            style={{
              backgroundColor: 'var(--accent)',
            }}
          >
            <Package2 className="h-5 w-5 text-white" />
          </div>

          {/* Brand name */}
          <div className="flex flex-col">
            <span
              className="text-[15px] font-bold leading-tight"
              style={{
                color: 'var(--text-heading)',
              }}
            >
              Inventory Pro
            </span>

            <span
              className="mt-0.5 text-[11px]"
              style={{
                color: 'var(--text-muted)',
              }}
            >
              Management System
            </span>
          </div>
        </Link>
      </div>

      {/* =========================================================
          NAVIGATION
      ========================================================= */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">

        {/* Overview */}
        <div className="mb-3 px-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              color: 'var(--text-muted)',
            }}
          >
            Overview
          </span>
        </div>

        <div className="space-y-1">
          {navItems.slice(0, 1).map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              pathname={pathname}
            />
          ))}
        </div>

        {/* Management */}
        <div className="mb-3 mt-7 px-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              color: 'var(--text-muted)',
            }}
          >
            Management
          </span>
        </div>

        <div className="space-y-1">
          {navItems.slice(1).map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              pathname={pathname}
            />
          ))}
        </div>

        {/* Settings */}
        <div className="mb-3 mt-7 px-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              color: 'var(--text-muted)',
            }}
          >
            System
          </span>
        </div>

        <Link
          href="/settings"
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
          style={{
            color:
              pathname === '/settings'
                ? 'var(--accent)'
                : 'var(--text-muted)',
            backgroundColor:
              pathname === '/settings'
                ? 'var(--accent-subtle)'
                : 'transparent',
          }}
        >
          <Settings
            className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:rotate-45"
          />

          <span className="flex-1">Settings</span>

          {pathname === '/settings' && (
            <ChevronRight className="h-4 w-4" />
          )}
        </Link>
      </nav>

      {/* =========================================================
          BOTTOM SECTION
      ========================================================= */}
      <div
        className="border-t px-3 py-4"
        style={{
          borderColor: 'var(--bg-border)',
        }}
      >

        {/* =====================================================
            THEME TOGGLE
        ===================================================== */}
        <button
          type="button"
          onClick={toggleTheme}
          className="group mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-[var(--bg-hover)]"
          style={{
            color: 'var(--text-muted)',
          }}
          aria-label={
            isDark
              ? 'Switch to light mode'
              : 'Switch to dark mode'
          }
        >
          <div className="flex items-center gap-3">
            {isDark ? (
              <Sun className="h-[18px] w-[18px] text-amber-400" />
            ) : (
              <Moon className="h-[18px] w-[18px] text-indigo-400" />
            )}

            <span
              className="text-sm font-medium"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </div>

          {/* Toggle */}
          <div
            className="relative h-5 w-9 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: isDark
                ? 'var(--accent)'
                : 'var(--bg-border)',
            }}
          >
            <div
              className={clsx(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200',
                isDark ? 'left-[18px]' : 'left-0.5'
              )}
            />
          </div>
        </button>

        {/* =====================================================
            SIGN OUT
        ===================================================== */}
        <button
          type="button"
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
          style={{
            color: 'var(--text-muted)',
          }}
        >
          <LogOut className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-0.5" />

          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

/* =============================================================
   SIDEBAR ITEM
============================================================= */

function SidebarItem({
  item,
  pathname,
}: {
  item: {
    href: string;
    label: string;
    icon: React.ComponentType<{
      className?: string;
    }>;
    alert?: boolean;
  };
  pathname: string;
}) {
  const Icon = item.icon;

  /*
   * Supports nested routes as well.
   *
   * Example:
   * /products       → active
   * /products/123   → active
   */
  const active =
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={clsx(
        'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'shadow-sm'
          : 'hover:bg-[var(--bg-hover)]'
      )}
      style={{
        color: active
          ? 'var(--accent)'
          : 'var(--text-muted)',

        backgroundColor: active
          ? 'var(--accent-subtle)'
          : 'transparent',
      }}
    >
      {/* Active indicator */}
      {active && (
        <span
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
          style={{
            backgroundColor: 'var(--accent)',
          }}
        />
      )}

      {/* Icon */}
      <Icon
        className={clsx(
          'h-[18px] w-[18px] shrink-0 transition-transform duration-200',
          !active && 'group-hover:scale-105',
          item.alert &&
            !active &&
            'text-amber-500'
        )}
      />

      {/* Label */}
      <span className="flex-1">
        {item.label}
      </span>

      {/* Low stock badge */}
      {item.alert && !active && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
          !
        </span>
      )}

      {/* Active arrow */}
      {active && (
        <ChevronRight className="h-4 w-4 opacity-70" />
      )}
    </Link>
  );
}

/* =============================================================
   USER INITIALS
============================================================= */

function getInitials(name?: string) {
  if (!name) return 'U';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
}