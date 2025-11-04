import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from '@/features/auth/guard/jwt.guard';
import { RolesGuard } from '@/features/auth/guard/role.guard';
import { Roles } from '@/features/auth/decorator/role.decorator';
import { Role } from '@prisma/client';
import { OrderService } from '../service/order.service';
import { CreateOrderDTO } from '../dto/create.order.dto';
import { UpdateOrderStatusDTO } from '../dto/update.order.dto';
import type { RequestWithUser } from '@/shared/types/request-with-user';

@UseGuards(JwtGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Post()
  @Roles(Role.USER, Role.STAFF, Role.MANAGER)
  async createOrder(@Req() req: RequestWithUser, @Body() dto: CreateOrderDTO) {
    const userId: string = req.user.sub;
    return this.orderService.create(userId, dto);
  }

  @Get()
  @Roles(Role.USER, Role.STAFF, Role.MANAGER)
  async getMyOrders(@Req() req: RequestWithUser) {
    const userId: string = req.user.sub;
    return this.orderService.getUserOrders(userId);
  }

  @Get(':id')
  @Roles(Role.USER, Role.STAFF, Role.MANAGER)
  async getOrderDetail(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId: string = req.user.sub;
    return this.orderService.getOrderById(userId, id);
  }

  @Delete(':id/cancel')
  @Roles(Role.STAFF, Role.MANAGER)
  async cancelOrder(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId: string = req.user.sub;
    return this.orderService.cancelOrder(userId, id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.MANAGER)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDTO,
  ) {
    return this.orderService.updateOrderStatus(id, dto);
  }
}
