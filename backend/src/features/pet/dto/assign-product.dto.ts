import { IsNotEmpty, IsString } from 'class-validator';

export class AssignProductDTO {
  @IsNotEmpty()
  @IsString()
  productId: string;
}
