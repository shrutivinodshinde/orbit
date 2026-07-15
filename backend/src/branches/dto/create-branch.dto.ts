import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateBranchDto {
  @IsInt()
  countryId: number;

  @IsString()
  name: string;

  @IsOptional() @IsString()
  city?: string;
}