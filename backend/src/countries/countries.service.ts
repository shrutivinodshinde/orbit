import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/auth.service';
import { buildCountryScopeFilter } from '../common/scope.util';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: JwtPayload) {
    return this.prisma.country.findMany({
      where: buildCountryScopeFilter(user),
      include: { branches: { select: { id: true, name: true, city: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(user: JwtPayload, id: number) {
    const country = await this.prisma.country.findFirst({ where: { id, ...buildCountryScopeFilter(user) } });
    if (!country) throw new NotFoundException('Country not found');
    return country;
  }

  // Adding a country is company-wide — Super Admin only
  create(user: JwtPayload, dto: CreateCountryDto) {
    if (user.roleName !== 'Super Admin') throw new ForbiddenException('Only Super Admin can add countries');
    return this.prisma.country.create({ data: { ...dto, companyId: user.companyId } });
  }

  async update(user: JwtPayload, id: number, dto: UpdateCountryDto) {
    await this.findOne(user, id); // enforces scope, 404 if outside it
    if (user.roleName !== 'Super Admin') throw new ForbiddenException('Only Super Admin can edit countries');
    return this.prisma.country.update({ where: { id }, data: dto });
  }
}