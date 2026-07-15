import { IsEnum, IsOptional } from 'class-validator';
import { ShipmentStatus, CustomsStatus } from '@prisma/client';

export class UpdateShipmentStatusDto {
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @IsEnum(CustomsStatus)
  customsStatus?: CustomsStatus;
}