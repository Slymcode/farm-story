/**
 * Service request state machine (pure, unit-tested).
 *
 *   PENDING ──► IN_REVIEW ──► ASSIGNED ──► COMPLETED
 *      │            │            │
 *      └────────────┴────────────┴──► CANCELLED        (COMPLETED and CANCELLED are final)
 *
 * ASSIGNED and COMPLETED can only be reached through their own actions (assign / complete),
 * so the generic status endpoint can never skip the agronomist workflow.
 */
export type Status = 'PENDING' | 'IN_REVIEW' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';

export const FINAL_STATUSES: Status[] = ['COMPLETED', 'CANCELLED'];
export const OPEN_STATUSES: Status[] = ['PENDING', 'IN_REVIEW', 'ASSIGNED'];

const NEXT: Record<Status, Status[]> = {
  PENDING: ['IN_REVIEW', 'ASSIGNED', 'CANCELLED'],
  IN_REVIEW: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ASSIGNED', 'COMPLETED', 'CANCELLED'], // ASSIGNED → ASSIGNED = reassignment
  COMPLETED: [],
  CANCELLED: [],
};

/** Targets an admin may pick from the plain status control. */
export const MANUAL_TARGETS: Status[] = ['IN_REVIEW', 'CANCELLED'];

export const canTransition = (from: Status, to: Status) => NEXT[from]?.includes(to) ?? false;

/** Statuses the plain status control may offer for a request that is currently `from`. */
export const manualOptions = (from: Status): Status[] => MANUAL_TARGETS.filter((t) => canTransition(from, t));

/** Returns a farmer-friendly error message when a manual status change is not allowed, otherwise null. */
export function manualStatusError(from: Status, to: Status): string | null {
  if (to === 'ASSIGNED') return 'Assign an agronomist to move a request to Assigned.';
  if (to === 'COMPLETED') return 'A request is completed by its agronomist after an assessment is submitted.';
  if (FINAL_STATUSES.includes(from)) return `This request is already ${from.toLowerCase()} and can no longer change.`;
  if (from === to) return `This request is already ${to.replace('_', ' ').toLowerCase()}.`;
  if (!canTransition(from, to)) return `A request cannot move from ${from.replace('_', ' ').toLowerCase()} to ${to.replace('_', ' ').toLowerCase()}.`;
  return null;
}
