import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { JwtPayload } from '../auth/auth.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetPermissionOverrideDto } from './dto/set-permission-override.dto';

const SAFE_SELECT = {
  id: true, name: true, email: true, createdAt: true,
  role: { select: { id: true, name: true } },
  country: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  private buildManagementScope(actingUser: JwtPayload): Prisma.UserWhereInput {
    if (actingUser.roleName === 'Super Admin') return { companyId: actingUser.companyId };
    if (actingUser.roleName === 'Country Admin') return { countryId: actingUser.countryId ?? -1 };
    return { branchId: actingUser.branchId ?? -1 };
  }

  // NEW — fetches roles from DB instead of hardcoding
  getRoles() {
    return this.prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
  }

  async findAll(actingUser: JwtPayload, query: QueryUsersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.UserWhereInput = {
      ...this.buildManagementScope(actingUser),
      ...(query.roleId && { roleId: query.roleId }),
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: SAFE_SELECT, orderBy: { name: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, pageSize };
  }

  async findOne(actingUser: JwtPayload, id: number) {
    const user = await this.prisma.user.findFirst({ where: { id, ...this.buildManagementScope(actingUser) }, select: SAFE_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getPermissions(actingUser: JwtPayload, id: number) {
    const user = await this.assertManageable(actingUser, id);

    const [rolePermissions, overrides, effective] = await Promise.all([
      this.prisma.rolePermission.findMany({ where: { roleId: user.roleId }, select: { permission: true } }),
      this.prisma.userPermissionOverride.findMany({ where: { userId: id }, select: { granted: true, permission: true } }),
      this.rbacService.getEffectivePermissions(id, user.roleId),
    ]);

    return {
      roleDefaults: rolePermissions.map((rp) => rp.permission),
      overrides: overrides.map((o) => ({ ...o.permission, granted: o.granted })),
      effectivePermissions: Array.from(effective),
    };
  }

  async setPermissionOverride(actingUser: JwtPayload, id: number, dto: SetPermissionOverrideDto) {
    await this.assertManageable(actingUser, id);

    await this.prisma.userPermissionOverride.upsert({
      where: { userId_permissionId: { userId: id, permissionId: dto.permissionId } },
      update: { granted: dto.granted },
      create: { userId: id, permissionId: dto.permissionId, granted: dto.granted },
    });

    return this.getPermissions(actingUser, id);
  }

  async removePermissionOverride(actingUser: JwtPayload, id: number, permissionId: number) {
    await this.assertManageable(actingUser, id);
    await this.prisma.userPermissionOverride.deleteMany({ where: { userId: id, permissionId } });
    return this.getPermissions(actingUser, id);
  }

  async update(actingUser: JwtPayload, id: number, dto: UpdateUserDto) {
    await this.assertManageable(actingUser, id);

    if ((dto.roleId || dto.countryId || dto.branchId) && actingUser.roleName === 'Manager') {
      throw new ForbiddenException('Managers cannot change role, country, or branch assignment');
    }

    return this.prisma.user.update({ where: { id }, data: dto, select: SAFE_SELECT });
  }

  private async assertManageable(actingUser: JwtPayload, targetId: number) {
    const user = await this.prisma.user.findFirst({ where: { id: targetId, ...this.buildManagementScope(actingUser) } });
    if (!user) throw new NotFoundException('User not found or outside your management scope');
    return user;
  }
}