import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/auth.service';
import { buildBranchScopeFilter } from '../common/scope.util';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';
import { QuerySalesOrdersDto } from './dto/query-sales-orders.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: JwtPayload, query: QuerySalesOrdersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.SalesOrderWhereInput = {
      ...buildBranchScopeFilter(user),
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.status && { status: query.status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true, country: { select: { name: true, code: true } } } },
          items: true,
        },
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    return { data: orders, total, page, pageSize };
  }

  async findOne(user: JwtPayload, id: number) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, ...buildBranchScopeFilter(user) },
      include: { customer: true, branch: true, items: true, createdBy: { select: { id: true, name: true } } },
    });
    if (!order) throw new NotFoundException('Sales order not found');
    return order;
  }

  async create(user: JwtPayload, dto: CreateSalesOrderDto) {
    await this.assertBranchInScope(user, dto.branchId);

    const amount = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    return this.prisma.salesOrder.create({
      data: {
        branchId: dto.branchId,
        customerId: dto.customerId,
        createdById: user.sub,
        amount,
        items: { create: dto.items },
      },
      include: { items: true },
    });
  }

  async updateStatus(user: JwtPayload, id: number, dto: UpdateSalesOrderStatusDto) {
    await this.findOne(user, id); // throws 404 if out of scope or missing
    return this.prisma.salesOrder.update({ where: { id }, data: { status: dto.status } });
  }

  /** Blocks creating orders for a branch outside the user's allowed scope. */
  private async assertBranchInScope(user: JwtPayload, branchId: number) {
    if (user.roleName === 'Super Admin') return;

    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, countryId: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    if (user.roleName === 'Country Admin') {
      if (branch.countryId !== user.countryId) {
        throw new ForbiddenException('Branch is outside your country scope');
      }
      return;
    }

    if (branch.id !== user.branchId) {
      throw new ForbiddenException('Branch is outside your scope');
    }
  }
}