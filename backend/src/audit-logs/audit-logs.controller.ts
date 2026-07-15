import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { JwtPayload } from '../auth/auth.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_audit_logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(@Req() req: { user: JwtPayload }, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.auditLogsService.findAll(req.user, page ? Number(page) : 1, pageSize ? Number(pageSize) : 30);
  }
}