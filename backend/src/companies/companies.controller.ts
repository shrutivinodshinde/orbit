import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { JwtPayload } from '../auth/auth.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  findMine(@Req() req: { user: JwtPayload }) {
    return this.companiesService.findMine(req.user);
  }

  @Patch('me')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('manage_org_structure')
  update(@Req() req: { user: JwtPayload }, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(req.user, dto);
  }
}