import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AddCartItemDTO } from '../dto/add.cart.dto';
import { UpdateCartItemDTO } from '../dto/update.cart.dto';
import { CartItemType } from '@prisma/client';
import { PrismaService } from '@/core/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}
  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }
    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDTO) {
    const { itemId, itemType, quantity } = dto;
    if (!Object.values(CartItemType).includes(itemType)) {
      throw new BadRequestException('Invalid item type');
    }
    if (itemType === CartItemType.PET) {
      const pet = await this.prisma.pet.findUnique({ where: { id: itemId } });
      if (!pet) throw new NotFoundException('Pet not found');
    } else if (itemType === CartItemType.PRODUCT) {
      const product = await this.prisma.product.findUnique({
        where: { id: itemId },
        include: { pets: true },
      });
      if (!product) throw new NotFoundException('Product not found');
      const relatedPetIds = product.pets.map((p) => p.petId);
      if (relatedPetIds.length === 0) {
        throw new BadRequestException('This product is not linked to any pet');
      }
      const ownsPet = await this.prisma.userPet.findFirst({
        where: {
          userId,
          petId: { in: relatedPetIds },
        },
      });
      if (!ownsPet) {
        throw new BadRequestException(
          'You must own a related pet to buy this product',
        );
      }
    }
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }
    const existingItem = cart.items.find(
      (i) => i.itemId === itemId && i.itemType === itemType,
    );
    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    }
    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        itemId,
        itemType,
        quantity,
      },
    });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDTO) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!cart) throw new NotFoundException('Cart not found');
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Item not found in cart');
    if (dto.quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
      return { message: 'Item removed from cart' };
    }
    return this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!cart) throw new NotFoundException('Cart not found');
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Item not found in cart');
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return { message: 'Item removed' };
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });
    if (!cart) throw new NotFoundException('Cart not found');
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { message: 'Cart cleared' };
  }
}
