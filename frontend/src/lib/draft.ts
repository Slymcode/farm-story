/**
 * Onboarding draft persistence (pure logic, storage injected so it can be tested without a browser).
 * localStorage is the simplest reliable store here: the draft is one small JSON object, read and written
 * synchronously. A queue of offline writes would need IndexedDB, which is deliberately out of scope.
 */
export const DRAFT_KEY = 'farmstory.onboarding-draft.v1';
export const LAST_STEP = 4;
/** Drafts are kept per account so two farmers sharing a device never see each other's answers. */
export const draftKeyFor = (userId?: string | null) => (userId ? `${DRAFT_KEY}:${userId}` : DRAFT_KEY);

export interface StoredDraft<T = unknown> { values: T; step: number; savedAt?: string }
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const browserStore = (): Store | null => { try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; } };

export function loadDraft<T>(key: string = DRAFT_KEY, store: Store | null = browserStore()): StoredDraft<T> | null {
  try {
    const parsed = JSON.parse(store?.getItem(key) ?? 'null');
    if (!parsed || typeof parsed !== 'object' || typeof parsed.values !== 'object' || parsed.values === null) return null;
    const step = Number.isInteger(parsed.step) ? Math.min(LAST_STEP, Math.max(0, parsed.step)) : 0;
    return { values: parsed.values as T, step, savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : undefined };
  } catch { return null; }
}

/** Returns true when the draft was written. Never throws (storage may be full, blocked or unavailable). */
export function saveDraft(d: { values: unknown; step: number }, key: string = DRAFT_KEY, store: Store | null = browserStore(), now: Date = new Date()): boolean {
  try { store?.setItem(key, JSON.stringify({ values: d.values, step: d.step, savedAt: now.toISOString() })); return !!store; } catch { return false; }
}

export function clearDraft(key: string = DRAFT_KEY, store: Store | null = browserStore()): void {
  try { store?.removeItem(key); } catch { /* ignore */ }
}
