import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { JwtPayload } from '../auth/auth.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetPermissionOverrideDto } from './dto/set-permission-override.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('manage_users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Must be before :id routes so Express doesn't treat 'roles' as an id
  @Get('roles')
  getRoles() {
    return this.usersService.getRoles();
  }

  @Get()
  findAll(@Req() req: { user: JwtPayload }, @Query() query: QueryUsersDto) {
    return this.usersService.findAll(req.user, query);
  }

  @Get(':id')
  findOne(@Req() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(req.user, id);
  }

  @Patch(':id')
  update(@Req() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user, id, dto);
  }

  @Get(':id/permissions')
  getPermissions(@Req() req: { user: JwtPayload }, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.getPermissions(req.user, id);
  }

  @Post(':id/permissions')
  setPermissionOverride(
    @Req() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetPermissionOverrideDto,
  ) {
    return this.usersService.setPermissionOverride(req.user, id, dto);
  }

  @Delete(':id/permissions/:permissionId')
  removePermissionOverride(
    @Req() req: { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.usersService.removePermissionOverride(req.user, id, permissionId);
  }
}