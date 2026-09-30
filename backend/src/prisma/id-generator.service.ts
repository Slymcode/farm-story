import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Mints human-readable IDs from an atomic Postgres counter.
 * `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` is a single statement, so concurrent
 * callers can never receive the same number (no read-then-write race).
 */
@Injectable()
export class IdGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  private async next(name: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ value: number }[]>`
      INSERT INTO "Counter" ("name", "value") VALUES (${name}, 1)
      ON CONFLICT ("name") DO UPDATE SET "value" = "Counter"."value" + 1
      RETURNING "value"`;
    return Number(rows[0].value);
  }
  static format(prefix: string, n: number) { return `${prefix}-${String(n).padStart(6, '0')}`; }
  async nextFarmerId() { return IdGeneratorService.format('FS-KEN', await this.next('farmer')); }
  async nextRequestId() { return IdGeneratorService.format('FS-REQ', await this.next('service_request')); }
}
