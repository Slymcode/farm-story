/** Mirrors the backend request state machine so the UI only offers moves the API will accept. Pure and unit-tested. */
export type Status = 'PENDING' | 'IN_REVIEW' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';

/** Statuses an admin can set from the plain status control. ASSIGNED / COMPLETED have their own actions. */
export function manualOptions(from: Status): Status[] {
  if (from === 'COMPLETED' || from === 'CANCELLED') return [];
  if (from === 'PENDING') return ['IN_REVIEW', 'CANCELLED'];
  return ['CANCELLED']; // IN_REVIEW, ASSIGNED
}
export const canAssign = (from: Status, hasAssessment: boolean) => (from === 'PENDING' || from === 'IN_REVIEW' || from === 'ASSIGNED') && !hasAssessment;
