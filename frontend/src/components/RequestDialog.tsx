import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useCreateRequest } from '@/api/hooks';
import { Button, Dialog, StatusBadge } from './ui';
import { TextAreaField } from './form';
import { SERVICES } from '@/lib/constants';
import type { Farm, ServiceType } from '@/types';

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 py-2"><dt className="text-ink-500">{k}</dt><dd className="text-right font-semibold text-forest-900">{v}</dd></div>;
}

function Body({ type, farm, onClose }: { type: ServiceType; farm: Farm; onClose: () => void }) {
  const [note, setNote] = useState('');
  const create = useCreateRequest();
  const svc = SERVICES[type];
  const done = create.data;

  if (done) {
    return (
      <div className="text-center" role="status">
        <CheckCircle2 className="mx-auto size-14 text-forest-600" aria-hidden />
        <h3 className="mt-3 text-2xl font-bold">Request submitted</h3>
        <p className="mt-2 text-ink-700">Your {svc.label.toLowerCase()} request has been received.</p>
        <dl className="mx-auto mt-5 max-w-xs space-y-3 rounded-2xl bg-white p-4 text-left ring-1 ring-cream-200">
          <div><dt className="text-sm text-ink-500">Request ID</dt><dd className="font-display text-xl font-bold text-forest-900">{done.requestId}</dd></div>
          <div><dt className="mb-1 text-sm text-ink-500">Status</dt><dd><StatusBadge status={done.status} /></dd></div>
        </dl>
        <Button className="mt-6 w-full" onClick={onClose}>Back to Farm Intelligence</Button>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); create.mutate({ farmerId: farm.farmerId, farmId: farm.id, type, description: note.trim() || undefined }); }} className="space-y-5">
      <p className="text-ink-700">{svc.blurb}</p>
      <dl className="divide-y divide-cream-200 rounded-2xl bg-white px-4 ring-1 ring-cream-200">
        <Row k="Service" v={svc.label} /><Row k="Farmer" v={farm.farmer?.fullName ?? '—'} /><Row k="Farm" v={farm.farmName} /><Row k="Location" v={farm.location} />
      </dl>
      <TextAreaField label="Add a note" optional maxLength={500} placeholder="Anything the team should know? For example, the best time to visit." value={note} onChange={(e) => setNote(e.target.value)} />
      {create.error && <p role="alert" className="rounded-xl bg-danger-100 p-3 font-medium text-danger-700">{create.error.message}</p>}
      <div className="flex gap-3"><Button variant="secondary" onClick={onClose} disabled={create.isPending}>Cancel</Button><Button type="submit" className="flex-1" loading={create.isPending}>Submit request</Button></div>
    </form>
  );
}

export function RequestDialog({ type, farm, onClose }: { type: ServiceType | null; farm: Farm; onClose: () => void }) {
  return (
    <Dialog open={!!type} onClose={onClose} title={type ? SERVICES[type].requestLabel : 'Request a service'}>
      {type && <Body key={type} type={type} farm={farm} onClose={onClose} />}
    </Dialog>
  );
}
