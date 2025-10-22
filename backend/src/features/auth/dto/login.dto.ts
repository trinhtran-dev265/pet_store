import { IsEmail, IsNotEmpty, IsString } from '@nestjs/class-validator';

export class LoginDTO {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
