import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/auth.service';
import { buildBranchScopeFilter } from '../common/scope.util';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { QueryShipmentsDto } from './dto/query-shipments.dto';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: JwtPayload, query: QueryShipmentsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ExportShipmentWhereInput = {
      ...buildBranchScopeFilter(user),
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.status && { status: query.status }),
      ...(query.customsStatus && { customsStatus: query.customsStatus }),
    };

    const [shipments, total] = await Promise.all([
      this.prisma.exportShipment.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true, country: { select: { name: true, code: true } } } },
          items: true,
        },
        orderBy: { shipmentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.exportShipment.count({ where }),
    ]);

    return { data: shipments, total, page, pageSize };
  }

  async findOne(user: JwtPayload, id: number) {
    const shipment = await this.prisma.exportShipment.findFirst({
      where: { id, ...buildBranchScopeFilter(user) },
      include: { branch: true, items: true, createdBy: { select: { id: true, name: true } } },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async create(user: JwtPayload, dto: CreateShipmentDto) {
    const branch = await this.assertBranchInScope(user, dto.branchId);

    return this.prisma.exportShipment.create({
      data: {
        branchId: dto.branchId,
        originCountryId: branch.countryId,
        destinationCountry: dto.destinationCountry,
        createdById: user.sub,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
        items: { create: dto.items },
      },
      include: { items: true },
    });
  }

  async updateStatus(user: JwtPayload, id: number, dto: UpdateShipmentStatusDto) {
    await this.findOne(user, id); // throws 404 if out of scope or missing
    return this.prisma.exportShipment.update({
      where: { id },
      data: { ...(dto.status && { status: dto.status }), ...(dto.customsStatus && { customsStatus: dto.customsStatus }) },
    });
  }

  private async assertBranchInScope(user: JwtPayload, branchId: number) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, countryId: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    if (user.roleName === 'Super Admin') return branch;

    if (user.roleName === 'Country Admin') {
      if (branch.countryId !== user.countryId) {
        throw new ForbiddenException('Branch is outside your country scope');
      }
      return branch;
    }

    if (branch.id !== user.branchId) {
      throw new ForbiddenException('Branch is outside your scope');
    }
    return branch;
  }
}