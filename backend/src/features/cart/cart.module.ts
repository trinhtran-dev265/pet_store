import { Module } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CartController } from './controller/cart.controller';
import { CartService } from './service/cart.service';

@Module({
  controllers: [CartController],
  providers: [CartService, PrismaService],
  exports: [CartService],
})
export class CartModule {}
