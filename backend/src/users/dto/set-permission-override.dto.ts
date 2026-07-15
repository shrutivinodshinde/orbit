import { IsBoolean, IsInt } from 'class-validator';

export class SetPermissionOverrideDto {
  @IsInt()
  permissionId: number;

  @IsBoolean()
  granted: boolean; // true = extra grant, false = explicit revoke
}