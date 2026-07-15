import { IsOptional, IsString } from 'class-validator';

export class UpdateBranchDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  city?: string;
}