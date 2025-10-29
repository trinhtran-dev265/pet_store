import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
} from 'class-validator';

export class CreateProductDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  stock?: number;
}
