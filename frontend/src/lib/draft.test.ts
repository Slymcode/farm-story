import test from 'node:test';
import assert from 'node:assert/strict';
import { DRAFT_KEY, clearDraft, loadDraft, saveDraft } from './draft.ts';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), raw: m }; };

test('a saved draft comes back with the same answers and step (e.g. after going offline and reloading)', () => {
  const s = memory();
  assert.equal(saveDraft({ values: { fullName: 'John Mwangi', county: 'Nyeri' }, step: 2 }, s, new Date('2026-09-30T10:00:00Z')), true);
  assert.deepEqual(loadDraft(s), { values: { fullName: 'John Mwangi', county: 'Nyeri' }, step: 2, savedAt: '2026-09-30T10:00:00.000Z' });
});

test('the latest save wins', () => {
  const s = memory();
  saveDraft({ values: { a: 1 }, step: 0 }, s); saveDraft({ values: { a: 2 }, step: 3 }, s);
  assert.deepEqual(loadDraft<{ a: number }>(s)?.values, { a: 2 });
  assert.equal(loadDraft(s)?.step, 3);
});

test('clearDraft removes it (used after a successful submit)', () => {
  const s = memory(); saveDraft({ values: {}, step: 1 }, s); clearDraft(s);
  assert.equal(loadDraft(s), null); assert.equal(s.raw.has(DRAFT_KEY), false);
});

test('corrupt or malformed stored data is ignored, not thrown', () => {
  const s = memory();
  s.setItem(DRAFT_KEY, '{not json'); assert.equal(loadDraft(s), null);
  s.setItem(DRAFT_KEY, JSON.stringify({ step: 2 })); assert.equal(loadDraft(s), null);
  s.setItem(DRAFT_KEY, JSON.stringify('nope')); assert.equal(loadDraft(s), null);
});

test('an out-of-range step is clamped into the form', () => {
  const s = memory(); s.setItem(DRAFT_KEY, JSON.stringify({ values: {}, step: 99 }));
  assert.equal(loadDraft(s)?.step, 4);
  s.setItem(DRAFT_KEY, JSON.stringify({ values: {}, step: -3 })); assert.equal(loadDraft(s)?.step, 0);
});

test('unavailable or throwing storage never crashes the form', () => {
  const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => { throw new Error('denied'); } };
  assert.equal(saveDraft({ values: {}, step: 0 }, broken), false);
  assert.equal(loadDraft(broken), null);
  assert.doesNotThrow(() => clearDraft(broken));
  assert.equal(saveDraft({ values: {}, step: 0 }, null), false);
});
