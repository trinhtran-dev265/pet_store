import { Module } from '@nestjs/common';
import { OrderService } from './service/order.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CartService } from '../cart/service/cart.service';
import { OrderTransactionService } from './service/order.transaction.service';
import { OrderController } from './controller/order.controller';

@Module({
  controllers: [OrderController],
  providers: [
    OrderService,
    PrismaService,
    CartService,
    OrderTransactionService,
  ],
  exports: [OrderService],
})
export class OrderModule {}
