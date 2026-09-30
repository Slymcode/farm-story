import { Link, Outlet } from 'react-router-dom';
import { DemoAccess } from '@/components/DemoAccess';
import { Logo } from '@/components/ui';

export default function FarmerLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/" aria-label="Farm Story home"><Logo /></Link>
          <DemoAccess />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8"><Outlet /></main>
      <footer className="border-t border-cream-200 px-4 py-5 text-center text-xs text-ink-500">
        Farm Story prototype. Prototype Demo Access — not production authentication. Guidance is decision support, not a substitute for a qualified agronomist.
      </footer>
    </div>
  );
}
