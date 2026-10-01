import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/ui';
import { useAuth } from './AuthContext';
import { gateRedirect, homePathFor, postLoginPath, type Gate } from './routing';

const Checking = () => <div className="mx-auto max-w-3xl p-6"><LoadingState label="Signing you in…" rows={2} /></div>;

/** Farmer-only pages. Logged out → login; unfinished onboarding → Continue Onboarding (see auth/routing.ts). */
export function ProtectedRoute({ gate = 'onboarded', children }: { gate?: Gate; children: ReactNode }) {
  const { user, loading, loggedOut } = useAuth();
  const loc = useLocation();
  if (loading) return <Checking />;
  // Right after onboarding the context still has the old user for a moment; the onboarding page hands over a `welcome` state.
  const justFinished = gate === 'onboarded' && !!(loc.state as { welcome?: unknown } | null)?.welcome;
  const to = justFinished && user ? null : gateRedirect(user, gate);
  if (to === 'login') return <Navigate to="/login" replace state={{ from: loggedOut ? undefined : loc.pathname }} />;
  if (to) return <Navigate to={to} replace />;
  return <>{children}</>;
}

/** Login / sign-up pages: a farmer who is already signed in is sent to where they belong. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { state } = useLocation() as { state?: { from?: string } };
  if (loading) return <Checking />;
  // This is also what moves a farmer on right after they log in or sign up (one place decides, so there is no navigation race).
  if (user) return <Navigate to={postLoginPath(user, state?.from)} replace />;
  return <>{children}</>;
}

/** /farmer → the right place for this farmer. */
export function FarmerEntry() {
  const { user, loading } = useAuth();
  if (loading) return <Checking />;
  return <Navigate to={user ? homePathFor(user) : '/login'} replace />;
}
