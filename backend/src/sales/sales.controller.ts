import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { JwtPayload } from '../auth/auth.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';
import { QuerySalesOrdersDto } from './dto/query-sales-orders.dto';

@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequirePermissions('view_sales')
  findAll(@Req() req: { user: JwtPayload }, @Query() query: QuerySalesOrdersDto) {
    return this.salesService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions('view_sales')
  findOne(@Req() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(req.user, id);
  }

  @Post()
  @RequirePermissions('edit_sales')
  create(@Req() req: { user: JwtPayload }, @Body() dto: CreateSalesOrderDto) {
    return this.salesService.create(req.user, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('edit_sales')
  updateStatus(
    @Req() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalesOrderStatusDto,
  ) {
    return this.salesService.updateStatus(req.user, id, dto);
  }
}