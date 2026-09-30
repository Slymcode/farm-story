import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Inbox, Loader2, Search, UserCheck, X, XCircle, type LucideIcon } from 'lucide-react';
import type { RequestStatus } from '@/types';
import { STATUS_LABEL } from '@/lib/constants';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------- Button ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-forest-800 text-cream-50 hover:bg-forest-700 disabled:bg-forest-800/50',
  secondary: 'bg-white text-forest-900 border border-cream-300 hover:bg-cream-100 disabled:opacity-50',
  ghost: 'text-forest-800 hover:bg-forest-50 disabled:opacity-50',
  gold: 'bg-gold-400 text-forest-950 hover:bg-gold-500 disabled:opacity-60',
  danger: 'bg-danger-700 text-white hover:bg-danger-700/90',
};
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; loading?: boolean; icon?: LucideIcon; size?: 'md' | 'sm' }
export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = 'primary', loading, icon: Icon, size = 'md', className, children, disabled, type = 'button', ...rest }, ref,
) {
  return (
    <button
      ref={ref} type={type} disabled={disabled || loading}
      className={cx('inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed',
        size === 'md' ? 'min-h-12 px-5 text-base' : 'min-h-10 px-3.5 text-sm', VARIANTS[variant], className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-[fs-spin_1s_linear_infinite]" aria-hidden /> : Icon && <Icon className="size-4" aria-hidden />}
      {children}
    </button>
  );
});

/* ---------- Card ---------- */
export function Card({ children, className, as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  return <Tag className={cx('rounded-2xl border border-cream-200 bg-white p-5 shadow-[0_1px_2px_rgb(28_34_30/0.05)]', className)}>{children}</Tag>;
}
export function SectionTitle({ children, hint, action }: { children: ReactNode; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div><h2 className="text-xl font-semibold">{children}</h2>{hint && <p className="text-sm text-ink-500">{hint}</p>}</div>
      {action}
    </div>
  );
}

/* ---------- States ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('animate-[fs-pulse_1.4s_ease-in-out_infinite] rounded-xl bg-cream-200', className)} />;
}
export function LoadingState({ label = 'Loading…', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className={i === 0 ? 'h-28' : 'h-16'} />)}
    </div>
  );
}
export function EmptyState({ title, body, action, icon: Icon = Inbox }: { title: string; body?: string; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 px-6 py-10 text-center">
      <Icon className="mb-3 size-8 text-earth-600" aria-hidden />
      <p className="font-display text-lg font-semibold text-forest-900">{title}</p>
      {body && <p className="mt-1 max-w-sm text-ink-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function ErrorState({ message = "We couldn't load this. Please try again.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-danger-700/20 bg-danger-100 px-6 py-8 text-center">
      <AlertTriangle className="mb-2 size-7 text-danger-700" aria-hidden />
      <p className="font-semibold text-danger-700">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/* ---------- Status badge (icon + text, never colour alone) ---------- */
const STATUS_STYLE: Record<RequestStatus, { cls: string; icon: LucideIcon }> = {
  PENDING: { cls: 'bg-gold-100 text-earth-800 border-gold-400/60', icon: Clock },
  IN_REVIEW: { cls: 'bg-sky-50 text-sky-900 border-sky-200', icon: Search },
  ASSIGNED: { cls: 'bg-forest-100 text-forest-800 border-forest-200', icon: UserCheck },
  COMPLETED: { cls: 'bg-forest-700 text-cream-50 border-forest-700', icon: CheckCircle2 },
  CANCELLED: { cls: 'bg-cream-200 text-ink-700 border-cream-300', icon: XCircle },
};
export function StatusBadge({ status }: { status: RequestStatus }) {
  const { cls, icon: Icon } = STATUS_STYLE[status];
  return <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold', cls)}><Icon className="size-3.5" aria-hidden />{STATUS_LABEL[status]}</span>;
}

/* ---------- Dialog (native <dialog>: focus trap, Esc to close, inert background) ---------- */
export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-label={title} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} className="m-auto w-full max-sm:mb-0 max-sm:max-w-none">
      <div className={cx('mx-auto flex max-h-[92dvh] w-full flex-col overflow-hidden bg-cream-50 shadow-2xl max-sm:rounded-t-3xl sm:rounded-3xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between gap-4 border-b border-cream-200 px-5 py-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full text-ink-700 hover:bg-cream-200"><X className="size-5" aria-hidden /></button>
        </div>
        <div className="overflow-y-auto p-5">{open && children}</div>
      </div>
    </dialog>
  );
}

export function Logo({ light }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="size-9" aria-hidden>
        <rect width="64" height="64" rx="14" fill={light ? '#f6f1e6' : '#16301f'} />
        <path d="M32 50V26" stroke="#c79a2e" strokeWidth="4" strokeLinecap="round" />
        <path d="M32 30c0-8 5-13 14-13 0 9-5 14-14 13Z" fill="#4a8b58" /><path d="M32 38c0-7-4-11-12-11 0 8 4 12 12 11Z" fill="#367043" />
      </svg>
      <span className={cx('font-display text-xl font-bold tracking-tight', light ? 'text-cream-50' : 'text-forest-900')}>Farm Story</span>
    </span>
  );
}
