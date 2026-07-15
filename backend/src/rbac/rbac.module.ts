import { Global, Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  providers: [RbacService, JwtAuthGuard, PermissionsGuard],
  exports: [RbacService, JwtAuthGuard, PermissionsGuard],
})
export class RbacModule {}