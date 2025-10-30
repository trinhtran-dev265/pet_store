import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtGuard } from '@/features/auth/guard/jwt.guard';
import { RolesGuard } from '@/features/auth/guard/role.guard';
import { Roles } from '@/features/auth/decorator/role.decorator';
import { Role } from '@prisma/client';
import { UserService } from '../service/user.service';
import { CreateUserDTO } from '../dto/create.user.dto';
import { UpdateUserDTO } from '../dto/update.user.dto';
import * as argon from 'argon2';
import { GetUser } from '@/features/auth/decorator/get.user.decorator';

@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  async findAll(@GetUser() user: any) {
    const { role } = user as { role: Role };
    if (role == Role.MANAGER) return this.userService.findAllUsersOnly();
    return this.userService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async findOne(@Param('id') id: string, @GetUser() user: any) {
    const { role } = user as { role: Role };
    const target = await this.userService.findOne(id);

    if (role === Role.MANAGER && target.role !== Role.USER) {
      throw new ForbiddenException('Managers can only view USER accounts');
    }
    return target;
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateUserDTO) {
    const passwordHash = dto.passwordHash
      ? await argon.hash(dto.passwordHash)
      : await argon.hash('Password123');

    return this.userService.create({
      ...dto,
      passwordHash,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDTO,
    @GetUser() user: any,
  ) {
    const { role } = user as { role: Role };
    const target = await this.userService.findOne(id);
    if (role === Role.MANAGER && target.role !== Role.USER) {
      throw new ForbiddenException('Managers can only edit USER accounts');
    }
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async remove(@Param('id') id: string, @GetUser() user: any) {
    const { role } = user as { role: Role };
    const target = await this.userService.findOne(id);

    if (role === Role.MANAGER && target.role !== Role.USER) {
      throw new ForbiddenException('Managers can only delete USER accounts');
    }

    return this.userService.remove(id);
  }
}
