'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬛' },
  { href: '/properties', label: 'Properties', icon: '🏠' },
  { href: '/tenants', label: 'Tenants', icon: '👤' },
  { href: '/finance', label: 'Finance', icon: '💶' },
  { href: '/documents', label: 'Documents', icon: '📄' },
  { href: '/bookings', label: 'Bookings', icon: '📅' },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow md:hidden"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle navigation"
      >
        <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
        <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
        <span className="block w-5 h-0.5 bg-gray-700" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-white border-r border-gray-200
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex
        `}
      >
        <div className="flex h-14 items-center px-4 border-b border-gray-200">
          <span className="text-base font-bold text-gray-900">Investo</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                <span aria-hidden>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 text-left"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
