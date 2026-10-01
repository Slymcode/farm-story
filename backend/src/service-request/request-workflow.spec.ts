import { canTransition, manualOptions, manualStatusError, Status } from './request-workflow';

const ALL: Status[] = ['PENDING', 'IN_REVIEW', 'ASSIGNED', 'COMPLETED', 'CANCELLED'];

describe('request state machine', () => {
  it('never allows leaving a final state', () => {
    for (const final of ['COMPLETED', 'CANCELLED'] as Status[]) for (const to of ALL) expect(canTransition(final, to)).toBe(false);
  });
  it('lets the manual control reach only IN_REVIEW or CANCELLED', () => {
    expect(manualOptions('PENDING')).toEqual(['IN_REVIEW', 'CANCELLED']);
    expect(manualOptions('IN_REVIEW')).toEqual(['CANCELLED']);
    expect(manualOptions('ASSIGNED')).toEqual(['CANCELLED']);
    expect(manualOptions('COMPLETED')).toEqual([]);
  });
  it('refuses to skip the agronomist workflow through the status control', () => {
    expect(manualStatusError('PENDING', 'ASSIGNED')).toMatch(/Assign an agronomist/);
    expect(manualStatusError('ASSIGNED', 'COMPLETED')).toMatch(/after an assessment/);
    expect(manualStatusError('PENDING', 'IN_REVIEW')).toBeNull();
  });
  it('gives clear messages for no-op and final-state changes', () => {
    expect(manualStatusError('COMPLETED', 'CANCELLED')).toMatch(/already completed/);
    expect(manualStatusError('IN_REVIEW', 'IN_REVIEW')).toMatch(/already in review/);
    expect(manualStatusError('ASSIGNED', 'IN_REVIEW')).toMatch(/cannot move/);
  });
  it('allows reassignment while assigned but not backwards moves', () => {
    expect(canTransition('ASSIGNED', 'ASSIGNED')).toBe(true);
    expect(canTransition('ASSIGNED', 'PENDING')).toBe(false);
  });
});
