import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSession, AuthUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
export const INVALID_LOGIN = 'Invalid email or password.';
const DUPLICATE_EMAIL = 'An account with this email already exists. Try logging in instead.';

/** Only these columns ever leave the auth layer: no passwordHash, ever. */
export const toAuthUser = (u: { id: string; name: string; email: string; role: 'FARMER'; onboardingCompleted: boolean }): AuthUser => ({
  id: u.id, name: u.name, email: u.email, role: u.role, onboardingCompleted: u.onboardingCompleted,
});

@Injectable()
export class AuthService {
  private dummyHash?: string;
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto): Promise<{ user: AuthSession; token: string }> {
    if (await this.prisma.user.findUnique({ where: { email: dto.email } })) throw new ConflictException(DUPLICATE_EMAIL);
    const passwordHash = await bcrypt.hash(dto.password, ROUNDS);
    let user;
    try {
      user = await this.prisma.user.create({ data: { name: dto.name, email: dto.email, passwordHash, role: 'FARMER', onboardingCompleted: false } });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException(DUPLICATE_EMAIL); // lost a race with another registration
      throw e;
    }
    return { user: { ...toAuthUser(user), farmer: null }, token: this.sign(user.id) };
  }

  async login(dto: LoginDto): Promise<{ user: AuthSession; token: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Always run one bcrypt comparison so response time doesn't reveal whether the email exists.
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? (this.dummyHash ??= bcrypt.hashSync('not-a-real-password', ROUNDS)));
    if (!user || !ok) throw new UnauthorizedException(INVALID_LOGIN);
    return { user: await this.session(toAuthUser(user)), token: this.sign(user.id) };
  }

  /** The authenticated user plus their linked farmer/farm ids (used by the frontend to route and to load their own farm). */
  async session(user: AuthUser): Promise<AuthSession> {
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId: user.id }, select: { id: true, farmerId: true, farms: { select: { id: true }, orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    return { ...user, farmer: farmer ? { id: farmer.id, farmerId: farmer.farmerId, farmId: farmer.farms[0]?.id ?? null } : null };
  }

  private sign(userId: string) { return this.jwt.sign({ sub: userId }); }
}
