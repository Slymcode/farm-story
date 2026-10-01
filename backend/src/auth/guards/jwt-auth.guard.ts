import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Strict: the request must carry a valid session. Used by GET /auth/me. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(_err: unknown, user: T | false | null): T {
    if (!user) throw new UnauthorizedException('Please log in to continue.');
    return user;
  }
}

/**
 * Global and never rejects: attaches `req.user` when a valid session cookie is present, otherwise leaves it undefined.
 * Farmer-private routes then enforce ownership whenever a farmer is logged in. Requests with no session keep the
 * existing prototype demo/admin behaviour (admin authentication is intentionally out of scope).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(ctx: ExecutionContext) {
    try { await super.canActivate(ctx); } catch { /* invalid / expired / missing token: treat as not logged in */ }
    return true;
  }
  handleRequest<T>(_err: unknown, user: T | false | null): T | undefined { return user || undefined; }
}
