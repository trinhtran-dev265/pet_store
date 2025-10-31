import { CartItemType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';

export class AddCartItemDTO {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsEnum(CartItemType)
  itemType: CartItemType;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}
