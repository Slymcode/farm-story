import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useFarmers } from '@/api/hooks';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { COUNTIES, CROPS, cropLabel } from '@/lib/constants';
import { date, initials, num } from '@/lib/format';

const sel = 'min-h-11 rounded-xl border border-cream-300 bg-white px-3 text-sm';

export default function Farmers() {
  const nav = useNavigate();
  const [search, setSearch] = useState(''), [q, setQ] = useState('');
  const [county, setCounty] = useState(''), [crop, setCrop] = useState(''), [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);
  const farmers = useFarmers({ search: q, county, crop, page });
  const d = farmers.data;
  const pages = d ? Math.max(1, Math.ceil(d.total / d.pageSize)) : 1;

  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-bold">Farmers</h1><p className="text-ink-700">Search and filter everyone who has registered.</p></div>
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
          <label htmlFor="fsearch" className="sr-only">Search by name, farmer ID or farm</label>
          <input id="fsearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, farmer ID or farm" className="min-h-11 w-full rounded-xl border border-cream-300 bg-white pl-9 pr-3 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/30" /></div>
        <label className="sr-only" htmlFor="fcounty">County</label>
        <select id="fcounty" value={county} onChange={(e) => { setCounty(e.target.value); setPage(1); }} className={sel}><option value="">All counties</option>{COUNTIES.filter((c) => c !== 'Other').map((c) => <option key={c}>{c}</option>)}</select>
        <label className="sr-only" htmlFor="fcrop">Crop</label>
        <select id="fcrop" value={crop} onChange={(e) => { setCrop(e.target.value); setPage(1); }} className={sel}><option value="">All crops</option>{CROPS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
      </Card>

      {farmers.isLoading ? <LoadingState rows={5} /> : farmers.isError || !d ? <ErrorState message="We couldn't load farmers." onRetry={() => farmers.refetch()} />
        : d.items.length === 0 ? <EmptyState title="No farmers match" body="Try a different search or clear the filters." action={<Button variant="secondary" onClick={() => { setSearch(''); setCounty(''); setCrop(''); }}>Clear filters</Button>} />
        : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <caption className="sr-only">Registered farmers</caption>
                <thead className="bg-cream-100 text-ink-700"><tr>{['Farmer', 'Farmer ID', 'County', 'Farm', 'Crop', 'Acres', 'Opportunity Score', 'Requests', 'Created'].map((h) => <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-cream-200">
                  {d.items.map((f) => (
                    <tr key={f.id} tabIndex={0} onClick={() => nav(`/admin/farmers/${f.id}`)} onKeyDown={(e) => e.key === 'Enter' && nav(`/admin/farmers/${f.id}`)} className="cursor-pointer hover:bg-forest-50 focus-visible:bg-forest-50">
                      <td className="px-4 py-3"><span className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-full bg-forest-100 text-xs font-bold text-forest-800" aria-hidden>{initials(f.fullName)}</span><span className="font-semibold text-forest-900">{f.fullName}</span></span></td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums">{f.farmerId}</td>
                      <td className="px-4 py-3">{f.county}</td><td className="px-4 py-3">{f.farm?.farmName ?? '—'}</td>
                      <td className="px-4 py-3">{f.farm ? cropLabel(f.farm.primaryCrop) : '—'}</td><td className="px-4 py-3 tabular-nums">{f.farm ? num(f.farm.sizeAcres, 1) : '—'}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums">{f.opportunityScore ?? '—'}</td><td className="px-4 py-3 tabular-nums">{f.requestCount}</td>
                      <td className="whitespace-nowrap px-4 py-3">{date(f.createdAt)}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-sm text-ink-700">
              <span>{d.total} {d.total === 1 ? 'farmer' : 'farmers'} · page {d.page} of {pages}</span>
              <span className="flex gap-2"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button></span>
            </div>
          </>)}
    </div>
  );
}
