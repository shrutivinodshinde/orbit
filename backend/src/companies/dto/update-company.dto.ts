import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  activeModules?: string[];
}