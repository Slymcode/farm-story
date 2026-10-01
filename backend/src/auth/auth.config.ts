import { Logger } from '@nestjs/common';
import type { CookieOptions } from 'express';

export const AUTH_COOKIE = 'farmstory_token';
export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days, no refresh tokens (out of scope for the prototype)

const DEV_SECRET = 'farm-story-dev-only-secret-change-me';

/** JWT signing secret. Required in production; a clearly-named development fallback is used locally so `npm run start:dev` just works. */
export function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be set in production.');
  new Logger('Auth').warn('JWT_SECRET is not set; using an insecure development secret. Set JWT_SECRET in backend/.env.');
  return DEV_SECRET;
}

/**
 * HTTP-only cookie. Local dev goes through the Vite proxy (same origin), so SameSite=Lax works.
 * If the frontend and API are on different sites in production, set COOKIE_SAME_SITE=none (forces Secure).
 */
export function cookieOptions(): CookieOptions {
  const sameSite = (process.env.COOKIE_SAME_SITE ?? 'lax').toLowerCase() as 'lax' | 'strict' | 'none';
  return {
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    path: '/',
  };
}
