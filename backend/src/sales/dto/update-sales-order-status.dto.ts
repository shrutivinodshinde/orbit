import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateSalesOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}