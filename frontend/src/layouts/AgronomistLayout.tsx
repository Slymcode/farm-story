import { Link, Outlet } from 'react-router-dom';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { DemoAccess } from '@/components/DemoAccess';
import { Logo } from '@/components/ui';
import { useViewingAgronomist } from '@/lib/useViewingAgronomist';

/** Agronomist Workspace shell. Identity comes from the demo "viewing as" selector — there is no agronomist login. */
export default function AgronomistLayout() {
  const v = useViewingAgronomist();
  return (
    <div className="flex min-h-dvh flex-col bg-cream-100">
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5">
          <Link to="/agronomist" aria-label="Agronomist Workspace home" className="flex items-center gap-3"><Logo /><span className="hidden font-display text-lg font-semibold text-forest-900 sm:inline">Agronomist Workspace</span></Link>
          <div className="flex flex-wrap items-center justify-end gap-2"><ConnectionStatus /><DemoAccess /></div>
        </div>
        <div className="border-t border-cream-200 bg-cream-100">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
            <label htmlFor="viewing-as" className="font-semibold text-ink-700">Viewing as</label>
            <select id="viewing-as" value={v.current?.id ?? ''} onChange={(e) => v.setAgronomistId(e.target.value)} disabled={!v.all.length} className="min-h-10 rounded-xl border border-cream-300 bg-white px-3 font-medium">
              {v.all.filter((a) => a.status === 'ACTIVE' || a.id === v.current?.id).map((a) => <option key={a.id} value={a.id}>{a.fullName}{a.county ? ` · ${a.county}` : ''}</option>)}
            </select>
            <span className="text-ink-500">Prototype Demo Access — not production authentication.</span>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8"><Outlet /></main>
    </div>
  );
}
