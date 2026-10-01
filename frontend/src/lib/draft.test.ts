import test from 'node:test';
import assert from 'node:assert/strict';
import { DRAFT_KEY, clearDraft, draftKeyFor, loadDraft, saveDraft } from './draft.ts';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), raw: m }; };

test('a saved draft comes back with the same answers and step (e.g. after going offline and reloading)', () => {
  const s = memory();
  assert.equal(saveDraft({ values: { fullName: 'John Mwangi', county: 'Nyeri' }, step: 2 }, DRAFT_KEY, s, new Date('2026-09-30T10:00:00Z')), true);
  assert.deepEqual(loadDraft(DRAFT_KEY, s), { values: { fullName: 'John Mwangi', county: 'Nyeri' }, step: 2, savedAt: '2026-09-30T10:00:00.000Z' });
});

test('the latest save wins', () => {
  const s = memory();
  saveDraft({ values: { a: 1 }, step: 0 }, DRAFT_KEY, s); saveDraft({ values: { a: 2 }, step: 3 }, DRAFT_KEY, s);
  assert.deepEqual(loadDraft<{ a: number }>(DRAFT_KEY, s)?.values, { a: 2 });
  assert.equal(loadDraft(DRAFT_KEY, s)?.step, 3);
});

test('clearDraft removes it (used after a successful submit)', () => {
  const s = memory(); saveDraft({ values: {}, step: 1 }, DRAFT_KEY, s); clearDraft(DRAFT_KEY, s);
  assert.equal(loadDraft(DRAFT_KEY, s), null); assert.equal(s.raw.has(DRAFT_KEY), false);
});

test('corrupt or malformed stored data is ignored, not thrown', () => {
  const s = memory();
  s.setItem(DRAFT_KEY, '{not json'); assert.equal(loadDraft(DRAFT_KEY, s), null);
  s.setItem(DRAFT_KEY, JSON.stringify({ step: 2 })); assert.equal(loadDraft(DRAFT_KEY, s), null);
  s.setItem(DRAFT_KEY, JSON.stringify('nope')); assert.equal(loadDraft(DRAFT_KEY, s), null);
});

test('an out-of-range step is clamped into the form', () => {
  const s = memory(); s.setItem(DRAFT_KEY, JSON.stringify({ values: {}, step: 99 }));
  assert.equal(loadDraft(DRAFT_KEY, s)?.step, 4);
  s.setItem(DRAFT_KEY, JSON.stringify({ values: {}, step: -3 })); assert.equal(loadDraft(DRAFT_KEY, s)?.step, 0);
});

test('unavailable or throwing storage never crashes the form', () => {
  const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => { throw new Error('denied'); } };
  assert.equal(saveDraft({ values: {}, step: 0 }, DRAFT_KEY, broken), false);
  assert.equal(loadDraft(DRAFT_KEY, broken), null);
  assert.doesNotThrow(() => clearDraft(DRAFT_KEY, broken));
  assert.equal(saveDraft({ values: {}, step: 0 }, DRAFT_KEY, null), false);
});

test('drafts are separate per account on a shared device', () => {
  const s = memory();
  saveDraft({ values: { n: 'alice' }, step: 1 }, draftKeyFor('u-alice'), s);
  saveDraft({ values: { n: 'bob' }, step: 3 }, draftKeyFor('u-bob'), s);
  assert.deepEqual(loadDraft<{ n: string }>(draftKeyFor('u-alice'), s)?.values, { n: 'alice' });
  assert.equal(loadDraft(draftKeyFor('u-bob'), s)?.step, 3);
  assert.equal(loadDraft(draftKeyFor('u-carol'), s), null);
  clearDraft(draftKeyFor('u-alice'), s);
  assert.equal(loadDraft(draftKeyFor('u-alice'), s), null);
  assert.notEqual(loadDraft(draftKeyFor('u-bob'), s), null);
});
