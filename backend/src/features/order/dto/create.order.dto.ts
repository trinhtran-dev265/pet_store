import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CartItemType } from '@prisma/client';

export class CreateOrderItemDTO {
  @IsString()
  itemId: string;

  @IsString()
  itemType: CartItemType;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;
}

export class CreateOrderDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDTO)
  items: CreateOrderItemDTO[];

  @IsNumber()
  total: number;
}
