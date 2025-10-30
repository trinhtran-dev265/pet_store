import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { JwtGuard } from '@/features/auth/guard/jwt.guard';
import { UserService } from '../service/user.service';
import { UpdateUserDTO } from '../dto/update.user.dto';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
}

@UseGuards(JwtGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@Req() req: RequestWithUser) {
    const userId = req.user?.sub;
    if (!userId) throw new NotFoundException('User not found in token');
    const user = await this.userService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch('me')
  async updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateUserDTO) {
    const userId = req.user?.sub;
    if (!userId) throw new NotFoundException('User not found in token');
    return this.userService.update(userId, dto);
  }
}
