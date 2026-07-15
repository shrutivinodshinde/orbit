import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/auth.service';
import { buildCountryScopeFilter } from '../common/scope.util';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll(@Req() req: { user: JwtPayload }) {
    return this.prisma.customer.findMany({
      where: buildCountryScopeFilter(req.user),
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  }
}