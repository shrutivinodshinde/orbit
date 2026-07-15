import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  /** Role defaults, with individual user overrides applied on top. */
  async getEffectivePermissions(userId: number, roleId: number): Promise<Set<string>> {
    const [rolePermissions, overrides] = await Promise.all([
      this.prisma.rolePermission.findMany({
        where: { roleId },
        select: { permission: { select: { key: true } } },
      }),
      this.prisma.userPermissionOverride.findMany({
        where: { userId },
        select: { granted: true, permission: { select: { key: true } } },
      }),
    ]);

    const effective = new Set(rolePermissions.map((rp) => rp.permission.key));

    for (const override of overrides) {
      if (override.granted) {
        effective.add(override.permission.key);
      } else {
        effective.delete(override.permission.key);
      }
    }

    return effective;
  }

  async hasPermissions(userId: number, roleId: number, required: string[]): Promise<boolean> {
    if (required.length === 0) return true;
    const effective = await this.getEffectivePermissions(userId, roleId);
    return required.every((perm) => effective.has(perm));
  }
}