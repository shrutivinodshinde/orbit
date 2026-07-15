import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryUsersDto {
  @IsOptional() @IsString()
  search?: string; // matches name or email

  @IsOptional() @Type(() => Number) @IsInt()
  roleId?: number;

  @IsOptional() @Type(() => Number) @IsInt()
  branchId?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pageSize?: number = 20;
}