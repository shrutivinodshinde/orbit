import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/auth.service';
import { buildBranchEntityScopeFilter } from '../common/scope.util';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { QueryBranchesDto } from './dto/query-branches.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: JwtPayload, query: QueryBranchesDto) {
    const where: Prisma.BranchWhereInput = {
      ...buildBranchEntityScopeFilter(user),
      ...(query.countryId && { countryId: query.countryId }),
    };
    return this.prisma.branch.findMany({
      where,
      include: { country: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(user: JwtPayload, id: number) {
    const branch = await this.prisma.branch.findFirst({ where: { id, ...buildBranchEntityScopeFilter(user) } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(user: JwtPayload, dto: CreateBranchDto) {
    await this.assertCountryInScope(user, dto.countryId);
    return this.prisma.branch.create({ data: dto });
  }

  async update(user: JwtPayload, id: number, dto: UpdateBranchDto) {
    await this.findOne(user, id); // enforces scope, 404 if outside it
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  private async assertCountryInScope(user: JwtPayload, countryId: number) {
    if (user.roleName === 'Super Admin') return;
    if (user.roleName === 'Country Admin' && countryId === user.countryId) return;
    throw new ForbiddenException('Country is outside your scope');
  }
}