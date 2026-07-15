import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { JwtPayload } from '../auth/auth.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { QueryBranchesDto } from './dto/query-branches.dto';

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(@Req() req: { user: JwtPayload }, @Query() query: QueryBranchesDto) {
    return this.branchesService.findAll(req.user, query);
  }

  @Get(':id')
  findOne(@Req() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    return this.branchesService.findOne(req.user, id);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('manage_org_structure')
  create(@Req() req: { user: JwtPayload }, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(req.user, dto);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('manage_org_structure')
  update(@Req() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(req.user, id, dto);
  }
}