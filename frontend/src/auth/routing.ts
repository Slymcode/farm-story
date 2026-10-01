/** Where a farmer belongs, given their account. Pure so it is easy to test. */
export interface AuthUserLike { onboardingCompleted: boolean }

export const ONBOARDING_PATH = '/farmer/onboarding';
export const DASHBOARD_PATH = '/farmer/dashboard';

/** After login (or when an already-signed-in farmer opens /login): unfinished onboarding continues, otherwise the dashboard. */
export const homePathFor = (user: AuthUserLike): string => (user.onboardingCompleted ? DASHBOARD_PATH : ONBOARDING_PATH);

/** After login, return to the page the farmer originally asked for, but only if they're allowed there. */
export function postLoginPath(user: AuthUserLike, from?: string | null): string {
  if (user.onboardingCompleted && from && from.startsWith('/farmer') && from !== '/farmer') return from;
  return homePathFor(user);
}

/** Which gate applies: onboarding pages are only for unfinished farmers; everything else needs a finished onboarding. */
export type Gate = 'any' | 'onboarded' | 'incomplete';
export function gateRedirect(user: AuthUserLike | null, gate: Gate): 'login' | string | null {
  if (!user) return 'login';
  if (gate === 'onboarded' && !user.onboardingCompleted) return ONBOARDING_PATH;
  if (gate === 'incomplete' && user.onboardingCompleted) return DASHBOARD_PATH;
  return null;
}
