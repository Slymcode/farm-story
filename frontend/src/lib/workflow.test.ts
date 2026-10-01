import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canAssign, manualOptions } from './workflow.ts';

test('manual status options never include ASSIGNED or COMPLETED', () => {
  for (const s of ['PENDING', 'IN_REVIEW', 'ASSIGNED', 'COMPLETED', 'CANCELLED'] as const) {
    const o = manualOptions(s);
    assert.ok(!o.includes('ASSIGNED') && !o.includes('COMPLETED'));
  }
});
test('final requests offer no manual moves', () => {
  assert.deepEqual(manualOptions('COMPLETED'), []);
  assert.deepEqual(manualOptions('CANCELLED'), []);
});
test('pending can be reviewed or cancelled; later states can only be cancelled', () => {
  assert.deepEqual(manualOptions('PENDING'), ['IN_REVIEW', 'CANCELLED']);
  assert.deepEqual(manualOptions('IN_REVIEW'), ['CANCELLED']);
  assert.deepEqual(manualOptions('ASSIGNED'), ['CANCELLED']);
});
test('assignment is only possible for open requests without an assessment', () => {
  assert.equal(canAssign('PENDING', false), true);
  assert.equal(canAssign('ASSIGNED', false), true);
  assert.equal(canAssign('ASSIGNED', true), false);
  assert.equal(canAssign('COMPLETED', false), false);
});
