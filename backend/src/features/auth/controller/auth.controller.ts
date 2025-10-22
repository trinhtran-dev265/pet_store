import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { RegisDTO } from '../dto/register.dto';
import { LoginDTO } from '../dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisDTO): Promise<{ message: string }> {
    await this.auth.register(dto);
    return { message: 'ok' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDTO) {
    return this.auth.login(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.auth.refresh(body.userId, body.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() body: { userId: string }) {
    await this.auth.logout(body.userId);
    return { message: 'ok' };
  }
}
