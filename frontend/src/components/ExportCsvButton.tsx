import { useState } from 'react';
import { Download } from 'lucide-react';
import { ApiError } from '@/api/client';
import { Button } from './ui';

/** "Export CSV" action: runs the server export for the filters currently applied and triggers a normal download. */
export function ExportCsvButton({ run, label = 'Export CSV', hint }: { run: () => Promise<void>; label?: string; hint?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const click = async () => {
    setBusy(true); setError(null);
    try { await run(); } catch (e) { setError(e instanceof ApiError ? e.message : 'The export could not be created. Please try again.'); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button variant="secondary" icon={Download} loading={busy} onClick={click} title={hint}>{busy ? 'Preparing…' : label}</Button>
      {error && <p role="alert" className="text-sm font-medium text-danger-700">{error}</p>}
    </div>
  );
}
