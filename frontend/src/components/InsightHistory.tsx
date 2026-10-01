import { History } from 'lucide-react';
import { useInsightHistory } from '@/api/hooks';
import { date } from '@/lib/format';
import type { InsightSnapshot } from '@/types';
import { Card, EmptyState, ErrorState, LoadingState } from './ui';

const W = 560, H = 190, PAD = { l: 34, r: 14, t: 12, b: 28 };

/** Dependency-free SVG line chart of stored opportunity scores (0–100) over time. */
function ScoreChart({ points }: { points: InsightSnapshot[] }) {
  const t = points.map((p) => new Date(p.createdAt).getTime());
  const min = Math.min(...t), span = Math.max(1, Math.max(...t) - min);
  const x = (i: number) => PAD.l + (points.length === 1 ? (W - PAD.l - PAD.r) / 2 : ((t[i] - min) / span) * (W - PAD.l - PAD.r));
  const y = (s: number) => PAD.t + (1 - s / 100) * (H - PAD.t - PAD.b);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.opportunityScore).toFixed(1)}`).join(' ');
  const label = `Opportunity score over time: ${points.map((p) => `${p.opportunityScore} on ${date(p.createdAt)}`).join(', ')}.`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}><line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} stroke="#e7dfcc" strokeWidth="1" /><text x={PAD.l - 6} y={y(g) + 4} textAnchor="end" fontSize="11" fill="#6b7168">{g}</text></g>
      ))}
      {points.length > 1 && <path d={path} fill="none" stroke="#367043" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <g key={p.id}>
          <circle cx={x(i)} cy={y(p.opportunityScore)} r="5" fill="#16301f" stroke="#f6f1e6" strokeWidth="2"><title>{`${date(p.createdAt)}: score ${p.opportunityScore}`}</title></circle>
          <text x={x(i)} y={H - 8} textAnchor={i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle'} fontSize="11" fill="#6b7168">{date(p.createdAt)}</text>
        </g>
      ))}
    </svg>
  );
}

/** Score history + a plain-language explanation of each change. Everything shown is derived from stored engine results. */
export function InsightHistory({ farmId }: { farmId: string }) {
  const q = useInsightHistory(farmId);
  if (q.isLoading) return <LoadingState rows={2} label="Loading history" />;
  if (q.isError || !q.data) return <ErrorState message="We couldn't load the history." onRetry={() => q.refetch()} />;
  const { snapshots, note } = q.data;
  if (!snapshots.length) return <EmptyState icon={History} title="No history saved yet" body="A snapshot is saved each time your farm information changes the result." />;
  const latestFirst = [...snapshots].reverse();
  return (
    <div className="space-y-4">
      <Card className="p-4">
        {snapshots.length > 1 ? <ScoreChart points={snapshots} /> : <p className="text-[0.95rem] text-ink-700">Only one result has been saved so far (score <strong>{snapshots[0].opportunityScore}</strong>). A chart appears once your farm information changes the result.</p>}
        <p className="mt-2 text-xs text-ink-500">{note}</p>
      </Card>
      <ol aria-label="Saved results" className="space-y-2.5">
        {latestFirst.map((s, i) => (
          <li key={s.id}>
            <Card className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-forest-900">Score {s.opportunityScore} <span className="font-normal text-ink-500">· {s.statusLabel}</span></p>
                <p className="text-sm text-ink-500">{date(s.createdAt)}{i === 0 ? ' · Latest' : ''}</p>
              </div>
              <p className="mt-1 text-[0.95rem] text-ink-700">{s.change.summary}</p>
              {s.change.reasons.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-ink-700">{s.change.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
