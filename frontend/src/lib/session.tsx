import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * PROTOTYPE DEMO ACCESS — not production authentication.
 * Holds which role the reviewer is viewing as, and which farmer/farm the "farmer" role represents.
 */
export type Role = 'farmer' | 'admin';
export interface FarmerSession { farmerUuid: string; publicId: string; name: string; farmId: string }
interface State { role: Role; farmer: FarmerSession | null }
interface Ctx extends State { setRole: (r: Role) => void; setFarmer: (f: FarmerSession | null) => void }

const KEY = 'farmstory.demo-session.v1';
const read = (): State => {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (v?.role) return v; } catch { /* storage unavailable */ }
  return { role: 'farmer', farmer: null };
};
const write = (v: State) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignore */ } };

const SessionContext = createContext<Ctx | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(read);
  const update = useCallback((patch: Partial<State>) => setState((s) => { const n = { ...s, ...patch }; write(n); return n; }), []);
  const value = useMemo<Ctx>(() => ({ ...state, setRole: (role) => update({ role }), setFarmer: (farmer) => update({ farmer }) }), [state, update]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const c = useContext(SessionContext);
  if (!c) throw new Error('useSession must be used inside SessionProvider');
  return c;
}

/** Onboarding draft persistence lives in lib/draft.ts (pure + tested); re-exported here so existing imports keep working. */
export { clearDraft, loadDraft, saveDraft } from './draft';
