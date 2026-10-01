import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useSession, type Role } from '@/lib/session';
import { cx } from './ui';

/** Role switcher. Clearly labelled as prototype access, not real authentication. */
export function DemoAccess() {
  const { role, setRole, farmer } = useSession();
  const { user } = useAuth();
  const nav = useNavigate();
  const go = (r: Role) => { setRole(r); nav(r === 'admin' ? '/admin' : r === 'agronomist' ? '/agronomist' : user ? '/farmer' : farmer ? `/farm/${farmer.farmId}` : '/'); };
  return (
    <div className="flex items-center gap-2" title="Prototype Demo Access — not production authentication.">
      <ShieldAlert className="hidden size-4 text-earth-600 sm:block" aria-hidden />
      <div role="group" aria-label="Prototype Demo Access — not production authentication" className="flex rounded-full bg-cream-200 p-0.5 text-sm font-semibold">
        {(['farmer', 'agronomist', 'admin'] as Role[]).map((r) => (
          <button key={r} onClick={() => go(r)} aria-pressed={role === r} className={cx('min-h-9 rounded-full px-2.5 capitalize sm:px-3.5 transition-colors', role === r ? 'bg-forest-900 text-cream-50' : 'text-ink-700 hover:text-forest-900')}>{r}</button>
        ))}
      </div>
    </div>
  );
}
