import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { JwtGuard } from '@/features/auth/guard/jwt.guard';
import { RolesGuard } from '@/features/auth/guard/role.guard';
import { Roles } from '@/features/auth/decorator/role.decorator';
import { CartService } from '../service/cart.service';
import { GetUser } from '@/features/auth/decorator/get.user.decorator';
import { AddCartItemDTO } from '../dto/add.cart.dto';
import { UpdateCartItemDTO } from '../dto/update.cart.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Roles(Role.USER, Role.STAFF, Role.MANAGER)
  async get(@GetUser() user: { sub?: string; id?: string }) {
    const userId = user.sub ?? user.id;
    if (!userId) throw new BadRequestException('No user in token');
    return this.cartService.getCart(userId);
  }

  @Post('add')
  @Roles(Role.USER, Role.STAFF, Role.MANAGER)
  async create(
    @GetUser() user: { sub?: string; id?: string },
    @Body() dto: AddCartItemDTO,
  ) {
    const userId = user.sub ?? user.id;
    if (!userId) throw new BadRequestException('No user in token');
    return this.cartService.addItem(userId, dto);
  }

  @Patch('update/:id')
  @Roles(Role.USER, Role.STAFF, Role.MANAGER)
  async update(
    @GetUser() user: { sub?: string; id?: string },
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDTO,
  ) {
    const userId = user.sub ?? user.id;
    if (!userId) throw new BadRequestException('No user in token');
    return this.cartService.updateItem(userId, id, dto);
  }

  @Delete('remove/:id')
  @Roles(Role.USER, Role.STAFF, Role.MANAGER)
  async remove(
    @GetUser() user: { sub?: string; id?: string },
    @Param('id') id: string,
  ) {
    const userId = user.sub ?? user.id;
    if (!userId) throw new BadRequestException('No user in token');
    return this.cartService.removeItem(userId, id);
  }

  @Delete('clear')
  @Roles(Role.USER, Role.STAFF, Role.MANAGER)
  async clear(@GetUser() user: { sub?: string; id?: string }) {
    const userId = user.sub ?? user.id;
    if (!userId) throw new BadRequestException('No user in token');
    return this.cartService.clearCart(userId);
  }
}
