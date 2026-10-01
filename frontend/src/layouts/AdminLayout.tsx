import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, Menu, Stethoscope, Users, X } from 'lucide-react';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { DemoAccess } from '@/components/DemoAccess';
import { Logo, cx } from '@/components/ui';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/farmers', label: 'Farmers', icon: Users },
  { to: '/admin/requests', label: 'Service requests', icon: ClipboardList },
  { to: '/admin/agronomists', label: 'Agronomists', icon: Stethoscope },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Administrator" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate}
          className={({ isActive }) => cx('flex min-h-11 items-center gap-3 rounded-xl px-3.5 font-medium transition-colors', isActive ? 'bg-forest-700 text-cream-50' : 'text-forest-100 hover:bg-forest-800')}>
          <Icon className="size-5" aria-hidden />{label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-cream-100 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden bg-forest-900 p-5 lg:flex lg:flex-col lg:gap-8">
        <Logo light /><Nav />
        <p className="mt-auto text-xs text-forest-200/80">Administrator Dashboard<br />Prototype Demo Access — not production authentication.</p>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-cream-200 bg-cream-50/95 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-3">
            <button className="grid size-11 place-items-center rounded-xl hover:bg-cream-200 lg:hidden" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu className="size-6" /></button>
            <div className="lg:hidden"><Logo /></div>
            <p className="hidden font-display text-lg font-semibold text-forest-900 lg:block">Administrator Dashboard</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2"><ConnectionStatus /><DemoAccess /></div>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 bg-forest-950/50" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 bg-forest-900 p-5">
              <div className="mb-6 flex items-center justify-between"><Logo light /><button className="grid size-10 place-items-center rounded-full text-forest-100 hover:bg-forest-800" aria-label="Close navigation" onClick={() => setOpen(false)}><X className="size-5" /></button></div>
              <Nav onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
