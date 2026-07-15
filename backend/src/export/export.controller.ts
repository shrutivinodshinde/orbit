import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { JwtPayload } from '../auth/auth.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { QueryShipmentsDto } from './dto/query-shipments.dto';

@Controller('export')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  @RequirePermissions('view_export')
  findAll(@Req() req: { user: JwtPayload }, @Query() query: QueryShipmentsDto) {
    return this.exportService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions('view_export')
  findOne(@Req() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    return this.exportService.findOne(req.user, id);
  }

  @Post()
  @RequirePermissions('edit_export')
  create(@Req() req: { user: JwtPayload }, @Body() dto: CreateShipmentDto) {
    return this.exportService.create(req.user, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('edit_export')
  updateStatus(
    @Req() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.exportService.updateStatus(req.user, id, dto);
  }
}