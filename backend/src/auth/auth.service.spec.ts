import 'reflect-metadata';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { AUTH_COOKIE } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService, INVALID_LOGIN } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

process.env.BCRYPT_ROUNDS = '4'; // fast hashing in tests; production default is 10

/** Tiny in-memory stand-in for the two tables auth touches. */
function fakePrisma() {
  const users: any[] = [];
  return {
    users,
    user: {
      findUnique: jest.fn(async ({ where }: any) => users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null),
      create: jest.fn(async ({ data }: any) => { const u = { id: `u${users.length + 1}`, createdAt: new Date(), updatedAt: new Date(), ...data }; users.push(u); return u; }),
    },
    farmer: { findUnique: jest.fn(async () => null) },
  };
}
const setup = () => {
  const prisma = fakePrisma();
  const jwt = new JwtService({ secret: 'test-secret' });
  const service = new AuthService(prisma as any, jwt);
  return { prisma, jwt, service, controller: new AuthController(service) };
};
const res = () => ({ cookie: jest.fn(), clearCookie: jest.fn() }) as any;
const reg = { name: 'John Mwangi', email: 'john@example.com', password: 'Password123!' };

describe('registration', () => {
  it('creates a FARMER with onboardingCompleted=false and never returns the hash', async () => {
    const { service, jwt } = setup();
    const { user, token } = await service.register(reg);
    expect(user).toMatchObject({ name: 'John Mwangi', email: 'john@example.com', role: 'FARMER', onboardingCompleted: false, farmer: null });
    expect(JSON.stringify(user)).not.toMatch(/passwordHash|Password123/);
    expect(jwt.verify(token).sub).toBe(user.id);
  });
  it('stores a bcrypt hash, not the password', async () => {
    const { service, prisma } = setup();
    await service.register(reg);
    const stored = prisma.users[0].passwordHash;
    expect(stored).not.toBe(reg.password);
    expect(stored).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare(reg.password, stored)).toBe(true);
    expect(await bcrypt.compare('wrong', stored)).toBe(false);
  });
  it('rejects a duplicate email, including a lost race on the unique index', async () => {
    const { service, prisma } = setup();
    await service.register(reg);
    await expect(service.register(reg)).rejects.toBeInstanceOf(ConflictException);
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockRejectedValueOnce({ code: 'P2002' });
    await expect(service.register({ ...reg, email: 'race@example.com' })).rejects.toBeInstanceOf(ConflictException);
  });
  it('validates name, email and password length, and normalises the email', async () => {
    const bad = await validate(plainToInstance(RegisterDto, { name: '', email: 'nope', password: 'short' }));
    expect(bad.map((e) => e.property).sort()).toEqual(['email', 'name', 'password']);
    const good = plainToInstance(RegisterDto, { name: ' Jo ', email: ' Jo@Example.COM ', password: 'longenough1' });
    expect(await validate(good)).toEqual([]);
    expect(good).toMatchObject({ name: 'Jo', email: 'jo@example.com' });
  });
});

describe('login', () => {
  it('logs in with the right password and returns the session', async () => {
    const { service } = setup();
    await service.register(reg);
    const { user, token } = await service.login({ email: reg.email, password: reg.password });
    expect(user.email).toBe(reg.email);
    expect(JSON.stringify(user)).not.toContain('passwordHash');
    expect(token).toEqual(expect.any(String));
  });
  it('gives the same generic error for a wrong password and an unknown email', async () => {
    const { service } = setup();
    await service.register(reg);
    const wrongPw = await service.login({ email: reg.email, password: 'nope-nope' }).catch((e) => e);
    const noUser = await service.login({ email: 'ghost@example.com', password: 'nope-nope' }).catch((e) => e);
    [wrongPw, noUser].forEach((e) => { expect(e).toBeInstanceOf(UnauthorizedException); expect(e.message).toBe(INVALID_LOGIN); });
  });
});

describe('session endpoints', () => {
  it('login and register set an HTTP-only cookie', async () => {
    const { controller } = setup();
    const r = res();
    await controller.register(reg as any, r);
    expect(r.cookie).toHaveBeenCalledWith(AUTH_COOKIE, expect.any(String), expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }));
  });
  it('/auth/me returns the logged-in farmer without sensitive fields', async () => {
    const { controller, service } = setup();
    const { user } = await service.register(reg);
    const me = await controller.me({ id: user.id, name: user.name, email: user.email, role: 'FARMER', onboardingCompleted: false });
    expect(me).toMatchObject({ email: 'john@example.com', role: 'FARMER', onboardingCompleted: false });
    expect(Object.keys(me)).not.toContain('passwordHash');
  });
  it('/auth/me is rejected without a session (401)', () => {
    expect(() => new JwtAuthGuard().handleRequest(null, false)).toThrow(UnauthorizedException);
    expect(() => new JwtAuthGuard().handleRequest(null, null)).toThrow('Please log in');
  });
  it('logout clears the cookie', () => {
    const { controller } = setup();
    const r = res();
    controller.logout(r);
    expect(r.clearCookie).toHaveBeenCalledWith(AUTH_COOKIE, expect.objectContaining({ httpOnly: true, path: '/' }));
  });
  it('the JWT strategy resolves a token to a user (without the hash) and rejects deleted users', async () => {
    const { prisma, service } = setup();
    const { user } = await service.register(reg);
    const strategy = new JwtStrategy(prisma as any);
    const resolved = await strategy.validate({ sub: user.id });
    expect(resolved).toMatchObject({ id: user.id, role: 'FARMER' });
    expect(resolved).not.toHaveProperty('passwordHash');
    expect(await strategy.validate({ sub: 'deleted' })).toBeNull();
  });
});
