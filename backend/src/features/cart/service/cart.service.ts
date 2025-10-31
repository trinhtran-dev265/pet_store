import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AddCartItemDTO } from '../dto/add.cart.dto';
import { UpdateCartItemDTO } from '../dto/update.cart.dto';
import { CartItemType } from '@prisma/client';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CART_MESSAGES } from '@/shared/contants/messages/cart.messages';
import { CART_LIMITS } from '@/shared/contants/cart.contants';

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
      throw new BadRequestException(CART_MESSAGES.ERROR.INVALID_ITEM_TYPE);
    }
    if (itemType === CartItemType.PET) {
      const pet = await this.prisma.pet.findUnique({ where: { id: itemId } });
      if (!pet) throw new NotFoundException(CART_MESSAGES.ERROR.PET_NOT_FOUND);
    } else if (itemType === CartItemType.PRODUCT) {
      const product = await this.prisma.product.findUnique({
        where: { id: itemId },
        include: { pets: true },
      });
      if (!product)
        throw new NotFoundException(CART_MESSAGES.ERROR.PRODUCT_NOT_FOUND);
      const relatedPetIds = product.pets.map((p) => p.petId);
      if (!relatedPetIds?.length) {
        throw new BadRequestException(CART_MESSAGES.ERROR.PRODUCT_NOT_LINKED);
      }
      const ownsPet = await this.prisma.userPet.findFirst({
        where: {
          userId,
          petId: { in: relatedPetIds },
        },
      });
      if (!ownsPet) {
        throw new BadRequestException(CART_MESSAGES.REQUIREMENT.MUST_OWN_PET);
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
    if (!cart) throw new NotFoundException(CART_MESSAGES.ERROR.CART_NOT_FOUND);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException(CART_MESSAGES.ERROR.ITEM_NOT_FOUND);
    if (dto.quantity <= CART_LIMITS.MIN_QUANTITY) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
      return { message: CART_MESSAGES.SUCCESS.ITEM_REMOVED };
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
    if (!cart) throw new NotFoundException(CART_MESSAGES.ERROR.CART_NOT_FOUND);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException(CART_MESSAGES.ERROR.ITEM_NOT_FOUND);
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return { message: CART_MESSAGES.SUCCESS.ITEM_REMOVED };
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });
    if (!cart) throw new NotFoundException(CART_MESSAGES.ERROR.CART_NOT_FOUND);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { message: CART_MESSAGES.SUCCESS.CART_CLEAR };
  }
}
