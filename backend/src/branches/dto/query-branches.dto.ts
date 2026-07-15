import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class QueryBranchesDto {
  @IsOptional() @Type(() => Number) @IsInt()
  countryId?: number;
}