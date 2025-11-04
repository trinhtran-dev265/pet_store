import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import type { CreateOrderDTO } from '../dto/create.order.dto';
import { ORDER_MESSAGES } from '@/shared/contants/messages/order.messages';

@Injectable()
export class OrderTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrderWithTransaction(
    userId: string,
    dto: CreateOrderDTO,
    total: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart?.items?.length) {
        throw new BadRequestException(ORDER_MESSAGES.ERROR.CART_EMPTY);
      }

      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: OrderStatus.PENDING,
          items: {
            create: dto.items.map((i) => ({
              itemId: i.itemId,
              itemType: i.itemType,
              quantity: i.quantity,
              price: i.price,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
  }
}
