import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CartItemType, OrderStatus } from '@prisma/client';
import { CreateOrderDTO } from '../dto/create.order.dto';
import { UpdateOrderStatusDTO } from '../dto/update.order.dto';
import { OrderTransactionService } from './order.transaction.service';
import { ORDER_MESSAGES } from '@/shared/contants/messages/order.messages';
import { CART_CONSTANTS } from '@/shared/contants/cart.constants';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: OrderTransactionService,
  ) {}

  async create(userId: string, dto: CreateOrderDTO) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!cart?.items.length) {
      throw new BadRequestException(ORDER_MESSAGES.ERROR.CART_EMPTY);
    }
    const hasPet = cart.items.some(
      (item) => item.itemType === CartItemType.PET,
    );
    if (!hasPet) {
      throw new ForbiddenException(ORDER_MESSAGES.ERROR.MUST_HAVE_PET);
    }
    const cartItems = cart.items;
    const total = await this.calculateTotal(cartItems);

    if (
      !dto.total ||
      Math.abs(total - dto.total) > CART_CONSTANTS.TOTAL_TOLERANCE
    ) {
      throw new BadRequestException(ORDER_MESSAGES.ERROR.MISMATCH);
    }
    const order = await this.transactionService.createOrderWithTransaction(
      userId,
      dto,
      total,
    );
    return {
      message: ORDER_MESSAGES.SUCCESS.CREATE,
      order,
    };
  }

  private async calculateTotal(
    items: { itemId: string; itemType: string; quantity: number }[],
  ) {
    let total = 0;
    for (const item of items) {
      if (item.itemType === CartItemType.PET) {
        const pet = await this.prisma.pet.findUnique({
          where: { id: item.itemId },
          select: { price: true },
        });
        if (!pet)
          throw new NotFoundException(ORDER_MESSAGES.ERROR.PET_NOT_FOUND);
        total += pet.price * item.quantity;
      } else if (item.itemType === CartItemType.PRODUCT) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.itemId },
          select: { price: true },
        });
        if (!product)
          throw new NotFoundException(ORDER_MESSAGES.ERROR.PRODUCT_NOT_FOUND);
        total += product.price * item.quantity;
      }
    }
    return total;
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order)
      throw new NotFoundException(ORDER_MESSAGES.ERROR.ORDER_NOT_FOUND);
    if (order.userId !== userId) {
      throw new BadRequestException(ORDER_MESSAGES.ERROR.CANNOT_ACCESS);
    }
    return order;
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDTO) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order)
      throw new NotFoundException(ORDER_MESSAGES.ERROR.ORDER_NOT_FOUND);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
      include: { items: true },
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order)
      throw new NotFoundException(ORDER_MESSAGES.ERROR.ORDER_NOT_FOUND);
    if (order.userId !== userId) {
      throw new BadRequestException(ORDER_MESSAGES.ERROR.CANNOT_CANCEL);
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(ORDER_MESSAGES.ERROR.ONLY_PENDING);
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELED },
      include: { items: true },
    });
  }
}
