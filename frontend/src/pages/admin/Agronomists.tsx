import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useAgronomists, useCreateAgronomist, useUpdateAgronomist } from '@/api/hooks';
import { TextField } from '@/components/form';
import { Button, Card, Dialog, EmptyState, ErrorState, LoadingState, cx } from '@/components/ui';
import { ALL_SERVICES, SERVICES } from '@/lib/constants';
import type { ServiceType } from '@/types';

function AddForm({ onDone }: { onDone: () => void }) {
  const create = useCreateAgronomist();
  const [f, setF] = useState({ fullName: '', email: '', phone: '', county: '' });
  const [spec, setSpec] = useState<ServiceType[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (!f.fullName.trim()) x.fullName = 'Please enter the full name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) x.email = 'Please enter a valid email address.';
    setErr(x);
    if (Object.keys(x).length) return;
    create.mutate({ fullName: f.fullName.trim(), email: f.email.trim(), phone: f.phone.trim() || undefined, county: f.county.trim() || undefined, specialties: spec }, { onSuccess: onDone });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField label="Full name" value={f.fullName} error={err.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
      <TextField label="Email" type="email" value={f.email} error={err.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <TextField label="Phone" optional value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <TextField label="County" optional value={f.county} onChange={(e) => setF({ ...f, county: e.target.value })} />
      <fieldset><legend className="mb-1.5 text-[0.95rem] font-semibold text-forest-900">Specialties <span className="font-normal text-ink-500">(optional)</span></legend>
        <div className="flex flex-wrap gap-2">{ALL_SERVICES.map((s) => (
          <label key={s} className={cx('inline-flex min-h-10 cursor-pointer items-center rounded-full border-2 px-3.5 text-sm font-semibold', spec.includes(s) ? 'border-forest-800 bg-forest-800 text-cream-50' : 'border-cream-300 bg-white text-ink-700')}>
            <input type="checkbox" className="sr-only" checked={spec.includes(s)} onChange={() => setSpec((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]))} />{SERVICES[s].label}</label>
        ))}</div></fieldset>
      {create.isError && <p role="alert" className="rounded-xl bg-danger-100 p-3 font-medium text-danger-700">{create.error.message}</p>}
      <div className="flex gap-3"><Button variant="secondary" onClick={onDone}>Cancel</Button><Button type="submit" className="flex-1" loading={create.isPending}>Add agronomist</Button></div>
    </form>
  );
}

export default function Agronomists() {
  const q = useAgronomists();
  const update = useUpdateAgronomist();
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-3xl font-bold">Agronomists</h1><p className="text-ink-700">Manage who can be assigned to service requests. Inactive agronomists keep their existing work but receive no new requests.</p></div>
        <Button icon={Plus} onClick={() => setAdding(true)}>Add agronomist</Button>
      </div>
      {q.isLoading ? <LoadingState rows={3} /> : q.isError || !q.data ? <ErrorState message="We couldn't load agronomists." onRetry={() => q.refetch()} />
        : !q.data.length ? <EmptyState title="No agronomists yet" body="Add one so requests can be assigned." />
        : <ul className="grid gap-3 md:grid-cols-2">{q.data.map((a) => (
          <li key={a.id}><Card className={cx('flex h-full flex-col gap-3', a.status === 'INACTIVE' && 'opacity-75')}>
            <div className="flex items-start justify-between gap-2">
              <div><h2 className="text-lg font-semibold">{a.fullName}</h2><p className="text-sm text-ink-500">{a.email}{a.phone ? ` · ${a.phone}` : ''}{a.county ? ` · ${a.county}` : ''}</p></div>
              <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold', a.status === 'ACTIVE' ? 'bg-forest-100 text-forest-800' : 'bg-cream-200 text-ink-700')}>{a.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
            </div>
            {a.specialties.length > 0 && <ul className="flex flex-wrap gap-1.5">{a.specialties.map((s) => <li key={s} className="rounded-full bg-earth-100 px-2.5 py-0.5 text-xs font-semibold text-earth-800">{SERVICES[s].label}</li>)}</ul>}
            <p className="text-sm text-ink-700">{a.openRequests ?? 0} open · {a.completedRequests ?? 0} completed</p>
            <Button size="sm" variant="secondary" className="mt-auto self-start" disabled={update.isPending} onClick={() => update.mutate({ id: a.id, json: { status: a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } })}>{a.status === 'ACTIVE' ? 'Mark inactive' : 'Mark active'}</Button>
          </Card></li>))}</ul>}
      {update.isError && <p role="alert" className="text-sm font-medium text-danger-700">{update.error.message}</p>}
      <Dialog open={adding} onClose={() => setAdding(false)} title="Add agronomist"><AddForm onDone={() => setAdding(false)} /></Dialog>
    </div>
  );
}
