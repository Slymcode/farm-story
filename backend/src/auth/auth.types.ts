/** The authenticated user as seen by controllers/services. Never contains the password hash. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'FARMER';
  onboardingCompleted: boolean;
}

export interface AuthSession extends AuthUser {
  /** The Farmer record linked to this account (null until the farmer details step of onboarding is saved). */
  farmer: { id: string; farmerId: string; farmId: string | null } | null;
}
