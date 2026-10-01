import { explainChange, snapshotHash, SnapshotLike } from './insight-history';

const dim = (key: string, points: number) => ({ key, label: key[0].toUpperCase() + key.slice(1), max: 25, points, explanation: '' }) as any;
const rec = (title: string, serviceType = 'SOIL_TEST') => ({ title, description: '', reason: '', serviceType, triggers: [] }) as any;
const snap = (score: number, dims: [string, number][], recs: any[] = [], have: string[] = [], status = 'MODERATE_OPPORTUNITY'): SnapshotLike => ({
  opportunityScore: score, healthStatus: status,
  scoreBreakdown: { dimensions: dims.map(([k, p]) => dim(k, p)), availableInformation: have, missingInformation: [] } as any,
  recommendations: recs,
});

describe('explainChange', () => {
  it('handles the first snapshot without inventing a comparison', () => {
    const e = explainChange(null, snap(50, []));
    expect(e.direction).toBe('first');
    expect(e.reasons).toEqual([]);
  });
  it('lists only factors that actually changed, from stored data', () => {
    const prev = snap(60, [['production', 20], ['completeness', 10]], [rec('Book a soil test')], ['Farm size']);
    const curr = snap(45, [['production', 20], ['completeness', 0]], [], ['Farm size', 'Last soil test date']);
    const e = explainChange(prev, curr);
    expect(e.direction).toBe('down');
    expect(e.scoreDelta).toBe(-15);
    expect(e.reasons).toEqual([
      'Completeness: 10 points → 0 points.',
      'New information on record: Last soil test date.',
      'Suggested support no longer shown: Book a soil test.',
    ]);
  });
  it('never claims improvement or a verdict', () => {
    const down = explainChange(snap(60, []), snap(40, [])).summary.toLowerCase();
    const up = explainChange(snap(40, []), snap(60, [])).summary.toLowerCase();
    for (const t of [down, up]) { expect(t).not.toMatch(/unhealthy|proves|diagnos|improved farm|better farmer/); }
    expect(down).toContain('not that results have improved');
    expect(up).toContain('not that the farm is doing worse');
  });
  it('reports an unchanged result', () => {
    const s = snap(50, [['production', 20]]);
    const e = explainChange(s, s);
    expect(e.direction).toBe('same');
    expect(e.summary).toContain('No individual factor changed');
  });
  it('flags status changes', () => {
    expect(explainChange(snap(70, [], [], [], 'HIGH_OPPORTUNITY'), snap(30, [], [], [], 'STRONG_POSITION')).statusChanged).toBe(true);
  });
});

describe('snapshotHash', () => {
  it('is identical for identical results and differs when the score or recommendations change', () => {
    const a = snap(50, [['production', 20]], [rec('A')]);
    expect(snapshotHash(a)).toBe(snapshotHash(snap(50, [['production', 20]], [rec('A')])));
    expect(snapshotHash(a)).not.toBe(snapshotHash(snap(51, [['production', 21]], [rec('A')])));
    expect(snapshotHash(a)).not.toBe(snapshotHash(snap(50, [['production', 20]], [rec('B')])));
  });
});
