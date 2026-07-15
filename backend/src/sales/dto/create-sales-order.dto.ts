import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNumber, IsPositive, IsString, Min, ValidateNested } from 'class-validator';

export class SalesOrderItemDto {
  @IsString()
  productName: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;
}

export class CreateSalesOrderDto {
  @IsInt()
  branchId: number;

  @IsInt()
  customerId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items: SalesOrderItemDto[];
}