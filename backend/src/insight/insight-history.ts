import { createHash } from 'crypto';
import { Recommendation, ScoreBreakdown } from './insight.types';

/**
 * Insight history helpers (pure). Everything here is derived from stored engine output only:
 * no AI, no estimates, no guessing about *why* a farmer's circumstances changed.
 */
export interface SnapshotLike {
  opportunityScore: number;
  healthStatus: string;
  scoreBreakdown: ScoreBreakdown | null;
  recommendations: Recommendation[];
}

export interface ChangeExplanation {
  direction: 'up' | 'down' | 'same' | 'first';
  scoreDelta: number;
  statusChanged: boolean;
  summary: string;
  reasons: string[];
}

const recKey = (r: Recommendation) => `${r.serviceType}:${r.title}`;

/** Stable fingerprint of what the engine concluded. Free-text explanations are excluded so wording tweaks don't create snapshots. */
export function snapshotHash(s: SnapshotLike): string {
  const payload = {
    score: s.opportunityScore, status: s.healthStatus,
    dims: (s.scoreBreakdown?.dimensions ?? []).map((d) => [d.key, d.points]),
    recs: s.recommendations.map(recKey).sort(),
    have: [...(s.scoreBreakdown?.availableInformation ?? [])].sort(),
  };
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

const pts = (n: number) => `${n} point${n === 1 ? '' : 's'}`;

export function explainChange(prev: SnapshotLike | null | undefined, curr: SnapshotLike): ChangeExplanation {
  if (!prev) {
    return { direction: 'first', scoreDelta: 0, statusChanged: false, reasons: [], summary: 'This is the first saved result for this farm.' };
  }
  const scoreDelta = curr.opportunityScore - prev.opportunityScore;
  const statusChanged = prev.healthStatus !== curr.healthStatus;
  const reasons: string[] = [];

  const prevDims = new Map((prev.scoreBreakdown?.dimensions ?? []).map((d) => [d.key, d]));
  for (const d of curr.scoreBreakdown?.dimensions ?? []) {
    const before = prevDims.get(d.key);
    if (before && before.points !== d.points) reasons.push(`${d.label}: ${pts(before.points)} → ${pts(d.points)}.`);
  }

  const hadInfo = new Set(prev.scoreBreakdown?.availableInformation ?? []);
  const nowInfo = new Set(curr.scoreBreakdown?.availableInformation ?? []);
  const added = [...nowInfo].filter((i) => !hadInfo.has(i));
  const removed = [...hadInfo].filter((i) => !nowInfo.has(i));
  if (added.length) reasons.push(`New information on record: ${added.join(', ')}.`);
  if (removed.length) reasons.push(`No longer on record: ${removed.join(', ')}.`);

  const prevRecs = new Set(prev.recommendations.map(recKey));
  const currRecs = new Set(curr.recommendations.map(recKey));
  const newRecs = curr.recommendations.filter((r) => !prevRecs.has(recKey(r))).map((r) => r.title);
  const goneRecs = prev.recommendations.filter((r) => !currRecs.has(recKey(r))).map((r) => r.title);
  if (newRecs.length) reasons.push(`New suggested support: ${newRecs.join('; ')}.`);
  if (goneRecs.length) reasons.push(`Suggested support no longer shown: ${goneRecs.join('; ')}.`);

  const direction = scoreDelta > 0 ? 'up' : scoreDelta < 0 ? 'down' : 'same';
  const head =
    direction === 'same'
      ? `The opportunity score stayed at ${curr.opportunityScore}.`
      : `The opportunity score moved from ${prev.opportunityScore} to ${curr.opportunityScore}.`;
  // The score measures where support or better information could help, so it is never framed as a grade of the farmer or proof of improvement.
  const meaning =
    direction === 'down' ? ' A lower score means fewer gaps were identified in the information recorded, not that results have improved.'
    : direction === 'up' ? ' A higher score means more areas were identified where support or better information could help, not that the farm is doing worse.'
    : '';
  const tail = reasons.length ? '' : ' No individual factor changed.';
  return { direction, scoreDelta, statusChanged, reasons, summary: head + meaning + tail };
}
