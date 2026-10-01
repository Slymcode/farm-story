import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { useResetPassport } from '@/api/hooks';
import { useAuth } from '@/auth/AuthContext';
import type { Farm } from '@/types';
import { PassportQr } from './PassportQr';
import { Button, Card } from './ui';

/** Farmer-facing entry point for the public Farm Passport: link, QR code, what is (not) shared, and a way to revoke the link. */
export function PassportPanel({ farm }: { farm: Farm }) {
  const { user } = useAuth();
  const reset = useResetPassport(farm.id);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!farm.publicId) return null;
  const path = `/passport/${farm.publicId}`;
  const url = `${window.location.origin}${path}`;
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked: the link is shown on screen */ } };

  return (
    <Card className="space-y-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <PassportQr url={url} />
        <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
          <p className="text-[0.95rem] text-ink-700">A shareable page with basic details about your farm, for buyers or partners who want to know who you are. It does not need a login.</p>
          <p className="break-all rounded-lg bg-cream-100 px-3 py-2 text-sm text-ink-700" data-testid="passport-url">{url}</p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link to={path} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-forest-800 px-3.5 text-sm font-semibold text-cream-50 hover:bg-forest-700"><ExternalLink className="size-4" aria-hidden />Open passport</Link>
            <Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={copy}>{copied ? 'Copied' : 'Copy link'}</Button>
          </div>
        </div>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-forest-50 p-3"><dt className="font-semibold text-forest-900">Shared</dt><dd className="text-ink-700">Farm name, county, main crop, coffee varieties, farm size, when you joined, and how many visits were completed.</dd></div>
        <div className="rounded-xl bg-earth-50 p-3"><dt className="font-semibold text-earth-800">Never shared</dt><dd className="text-ink-700">Your name, phone, email, Farmer ID, exact location, challenges, score, recommendations, assessments and AI chats.</dd></div>
      </dl>
      {user && (
        <div className="border-t border-cream-200 pt-3">
          {!confirm
            ? <button onClick={() => setConfirm(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 underline underline-offset-2"><RefreshCw className="size-4" aria-hidden />Stop sharing this link</button>
            : (
              <div role="alertdialog" aria-label="Confirm new link" className="space-y-2">
                <p className="text-sm text-ink-700">This creates a new link and QR code. Anyone with the old link or QR code will no longer be able to open your passport.</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="danger" loading={reset.isPending} onClick={() => reset.mutate(undefined, { onSuccess: () => setConfirm(false) })}>Create new link</Button>
                  <Button size="sm" variant="secondary" onClick={() => setConfirm(false)}>Keep current link</Button>
                </div>
                {reset.isError && <p role="alert" className="text-sm font-medium text-danger-700">{reset.error.message}</p>}
              </div>
            )}
        </div>
      )}
    </Card>
  );
}
