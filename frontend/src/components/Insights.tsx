import { BarChart3, CircleAlert, Flag, Info, type LucideIcon } from 'lucide-react';
import { Button, Card, StatusBadge } from './ui';
import { SERVICES } from '@/lib/constants';
import { date } from '@/lib/format';
import type { InsightItem, Recommendation, ServiceRequest } from '@/types';

const ICONS: Record<InsightItem['category'], { icon: LucideIcon; label: string }> = {
  metric: { icon: BarChart3, label: 'Farm metric' }, gap: { icon: CircleAlert, label: 'Missing information' },
  challenge: { icon: Flag, label: 'Reported challenge' }, info: { icon: Info, label: 'Information' },
};

export function InsightCard({ item }: { item: InsightItem }) {
  const { icon: Icon, label } = ICONS[item.category];
  return (
    <Card as="article" className="flex gap-3.5 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700"><Icon className="size-5" aria-label={label} /></span>
      <div><h3 className="text-base font-semibold">{item.title}</h3><p className="mt-0.5 text-[0.95rem] text-ink-700">{item.description}</p></div>
    </Card>
  );
}

export function RecommendationCard({ rec, onAct }: { rec: Recommendation; onAct: () => void }) {
  const s = SERVICES[rec.serviceType];
  return (
    <Card as="article" className="border-l-4 border-l-gold-500">
      <div className="flex items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-earth-700"><s.icon className="size-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold">{rec.title}</h3>
          <p className="mt-0.5 text-[0.95rem] text-ink-700">{rec.description}</p>
          <p className="mt-2 text-sm text-ink-500"><span className="font-semibold text-ink-700">Why: </span>{rec.reason}</p>
        </div>
      </div>
      <Button className="mt-4 w-full sm:w-auto" onClick={onAct}>{s.requestLabel}</Button>
    </Card>
  );
}

export function ServiceRequestCard({ r, showFarmer }: { r: ServiceRequest; showFarmer?: boolean }) {
  const s = SERVICES[r.type];
  return (
    <li className="flex items-start gap-3 rounded-xl border border-cream-200 bg-white p-3.5">
      <s.icon className="mt-0.5 size-5 shrink-0 text-earth-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-forest-900">{s.label}</p>
        <p className="text-sm text-ink-500">{r.requestId} · {date(r.createdAt)}{showFarmer && r.farmer ? ` · ${r.farmer.fullName}` : ''}</p>
        {r.description && <p className="mt-1 text-sm text-ink-700">“{r.description}”</p>}
      </div>
      <StatusBadge status={r.status} />
    </li>
  );
}

export function MetricCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon?: LucideIcon }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-500">{Icon && <Icon className="size-4 text-earth-600" aria-hidden />}{label}</div>
      <p className="mt-1.5 font-display text-3xl font-bold text-forest-900">{value}</p>
      {sub && <p className="text-sm text-ink-500">{sub}</p>}
    </Card>
  );
}
