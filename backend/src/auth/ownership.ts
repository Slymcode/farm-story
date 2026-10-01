import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './auth.types';

export const NOT_YOURS = 'You can only access your own farm information.';

/**
 * Farmer ownership rule: when a farmer is logged in, they may only touch records that belong to their own Farmer.
 * Without a session (prototype demo / admin access) nothing is enforced here.
 */
export async function assertOwnsFarmer(prisma: PrismaService, actor: AuthUser | undefined, farmerUuid: string): Promise<void> {
  if (!actor) return;
  const f = await prisma.farmer.findUnique({ where: { id: farmerUuid }, select: { userId: true } });
  if (!f || f.userId !== actor.id) throw new ForbiddenException(NOT_YOURS);
}

/** The logged-in farmer's own Farmer UUID, or null if they haven't saved their farmer details yet. */
export async function ownFarmerId(prisma: PrismaService, actor: AuthUser): Promise<string | null> {
  return (await prisma.farmer.findUnique({ where: { userId: actor.id }, select: { id: true } }))?.id ?? null;
}

/** Same rule, starting from a farm id. */
export async function assertOwnsFarm(prisma: PrismaService, actor: AuthUser | undefined, farmId: string): Promise<void> {
  if (!actor) return;
  const farm = await prisma.farm.findUnique({ where: { id: farmId }, select: { farmer: { select: { userId: true } } } });
  if (!farm) throw new NotFoundException('We could not find this farm.');
  if (farm.farmer.userId !== actor.id) throw new ForbiddenException(NOT_YOURS);
}
