import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_COOKIE, jwtSecret } from '../auth.config';
import { AuthUser } from '../auth.types';
import { toAuthUser } from '../auth.service';

/** Reads the JWT from the HTTP-only cookie (preferred) or an Authorization: Bearer header (handy for API clients / Swagger). */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req?.cookies?.[AUTH_COOKIE] ?? null, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  /** Called with a verified token. Re-reads the user so deleted accounts and a changed onboarding flag are always current. */
  async validate(payload: { sub: string }): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    return user ? toAuthUser(user) : null;
  }
}
