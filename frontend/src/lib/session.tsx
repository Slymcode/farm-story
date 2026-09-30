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

/** Draft of the onboarding form so a refresh or dropped connection doesn't lose the farmer's answers. */
const DRAFT = 'farmstory.onboarding-draft.v1';
export const loadDraft = <T,>(): { values: T; step: number } | null => { try { return JSON.parse(localStorage.getItem(DRAFT) ?? 'null'); } catch { return null; } };
export const saveDraft = (d: unknown) => { try { localStorage.setItem(DRAFT, JSON.stringify(d)); } catch { /* ignore */ } };
export const clearDraft = () => { try { localStorage.removeItem(DRAFT); } catch { /* ignore */ } };
