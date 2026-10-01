import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { fetchMe, loginAccount, logoutAccount, registerAccount, type AuthUser } from './authApi';

interface Ctx {
  user: AuthUser | null;
  /** True right after sign-up, so onboarding can greet the new farmer. Cleared on login / logout. */
  justRegistered: boolean;
  /** True after an explicit logout, so the login page can confirm it (cleared on the next login / sign-up). */
  loggedOut: boolean;
  /** True until the first "who am I?" check has finished, so routes don't flash the login page for a signed-in farmer. */
  loading: boolean;
  register: (v: { name: string; email: string; password: string }) => Promise<AuthUser>;
  login: (v: { email: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Re-reads the session (e.g. after onboarding completes so onboardingCompleted and the farm id are current). */
  refresh: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [justRegistered, setJustRegistered] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);

  const refresh = useCallback(async () => {
    try { const u = await fetchMe(); setUser(u); return u; }
    catch (e) {
      if (e instanceof ApiError && e.status === 0) return null; // offline: keep whatever we have, don't log anyone out
      setUser(null); return null; // 401 = not logged in
    }
  }, []);

  useEffect(() => { void refresh().finally(() => setLoading(false)); }, [refresh]);

  const value = useMemo<Ctx>(() => ({
    user, loading, refresh, justRegistered, loggedOut,
    register: async (v) => { const u = await registerAccount(v); qc.clear(); setJustRegistered(true); setLoggedOut(false); setUser(u); return u; },
    login: async (v) => { const u = await loginAccount(v); qc.clear(); setJustRegistered(false); setLoggedOut(false); setUser(u); return u; },
    logout: async () => {
      try { await logoutAccount(); } finally { qc.clear(); setJustRegistered(false); setLoggedOut(true); setUser(null); } // cached farm data must never outlive the session
    },
  }), [user, loading, refresh, justRegistered, loggedOut, qc]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
