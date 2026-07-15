import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsInt()
  roleId?: number;

  @IsOptional() @IsInt()
  countryId?: number;

  @IsOptional() @IsInt()
  branchId?: number;
}