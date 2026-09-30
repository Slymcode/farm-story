import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { cx } from './ui';

/** Small header pill: "Online" or "Offline — your draft is saved on this device". */
export function ConnectionStatus() {
  const { online } = useOnlineStatus();
  return (
    <p role="status" aria-live="polite" data-testid="connection-status"
      className={cx('inline-flex min-h-8 max-w-[11rem] items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-tight sm:max-w-none',
        online ? 'bg-forest-100 text-forest-800' : 'bg-gold-100 text-earth-800')}>
      {online ? <Wifi className="size-3.5 shrink-0" aria-hidden /> : <WifiOff className="size-3.5 shrink-0" aria-hidden />}
      <span>{online ? 'Online' : 'Offline — your draft is saved on this device'}</span>
    </p>
  );
}

/** In-form notice for onboarding: explains what offline means, and confirms when the connection returns. */
export function DraftConnectivityNotice() {
  const { online, justReconnected } = useOnlineStatus();
  if (!online) return <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-gold-100 p-3.5 font-medium text-earth-800"><WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden />You're offline. Your draft is saved on this device.</p>;
  if (justReconnected) return <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-forest-100 p-3.5 font-medium text-forest-800"><Wifi className="mt-0.5 size-5 shrink-0" aria-hidden />You're back online.</p>;
  return null;
}
