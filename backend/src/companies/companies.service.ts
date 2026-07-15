import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/auth.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(user: JwtPayload) {
    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      include: { countries: { select: { id: true, name: true, code: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  update(user: JwtPayload, dto: UpdateCompanyDto) {
    return this.prisma.company.update({ where: { id: user.companyId }, data: dto });
  }
}