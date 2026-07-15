import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/auth.service';
import { buildUserScopeFilter } from '../common/scope.util';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Self check-in: creates today's record if it doesn't exist yet. */
  async checkIn(user: JwtPayload) {
    const today = startOfDay();
    const existing = await this.prisma.attendance.findFirst({ where: { userId: user.sub, date: today } });
    if (existing?.checkIn) throw new BadRequestException('Already checked in today');

    return existing
      ? this.prisma.attendance.update({ where: { id: existing.id }, data: { checkIn: new Date(), status: AttendanceStatus.PRESENT } })
      : this.prisma.attendance.create({ data: { userId: user.sub, date: today, status: AttendanceStatus.PRESENT, checkIn: new Date() } });
  }

  /** Self check-out: requires an existing check-in today. */
  async checkOut(user: JwtPayload) {
    const today = startOfDay();
    const existing = await this.prisma.attendance.findFirst({ where: { userId: user.sub, date: today } });
    if (!existing?.checkIn) throw new BadRequestException('You must check in before checking out');
    if (existing.checkOut) throw new BadRequestException('Already checked out today');

    return this.prisma.attendance.update({ where: { id: existing.id }, data: { checkOut: new Date() } });
  }

  /** Own attendance history. */
  findMine(user: JwtPayload, query: QueryAttendanceDto) {
    return this.findAllInternal({ userId: user.sub }, query);
  }

  /** Scoped team view — requires 'view_attendance' permission, enforced at controller level. */
  findAll(user: JwtPayload, query: QueryAttendanceDto) {
    const scope = buildUserScopeFilter(user);
    return this.findAllInternal(scope, query);
  }

  private async findAllInternal(scope: Prisma.AttendanceWhereInput, query: QueryAttendanceDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.AttendanceWhereInput = {
      ...scope,
      ...(query.userId && { userId: query.userId }),
      ...(query.status && { status: query.status }),
      ...(query.fromDate || query.toDate
        ? { date: { ...(query.fromDate && { gte: new Date(query.fromDate) }), ...(query.toDate && { lte: new Date(query.toDate) }) } }
        : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: { user: { select: { id: true, name: true, branch: { select: { name: true } } } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { data: records, total, page, pageSize };
  }

  /** Admin manually marks a status (e.g. leave/absent) for someone in their scope. */
  async mark(user: JwtPayload, dto: MarkAttendanceDto) {
    await this.assertUserInScope(user, dto.userId);
    const date = startOfDay(new Date(dto.date));

    const existing = await this.prisma.attendance.findFirst({ where: { userId: dto.userId, date } });
    return existing
      ? this.prisma.attendance.update({ where: { id: existing.id }, data: { status: dto.status } })
      : this.prisma.attendance.create({ data: { userId: dto.userId, date, status: dto.status } });
  }

  private async assertUserInScope(actingUser: JwtPayload, targetUserId: number) {
    if (actingUser.roleName === 'Super Admin') return;

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { countryId: true, branchId: true },
    });
    if (!target) throw new NotFoundException('User not found');

    if (actingUser.roleName === 'Country Admin') {
      if (target.countryId !== actingUser.countryId) throw new ForbiddenException('User is outside your country scope');
      return;
    }

    if (target.branchId !== actingUser.branchId) throw new ForbiddenException('User is outside your branch scope');
  }
}