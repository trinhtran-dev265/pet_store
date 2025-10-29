import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePetDTO } from '../dto/create.pet.dto';
import { UpdatePetDTO } from '../dto/update.pet.dto';

@Injectable()
export class PetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePetDTO) {
    return this.prisma.pet.create({
      data: {
        name: dto.name,
        type: dto.type,
        breed: dto.breed,
        price: dto.price ?? 1000,
        image: dto.image,
        description: dto.description,
      },
    });
  }

  async findAll(type?: string, breed?: string) {
    const where: Prisma.PetWhereInput = {};
    if (type) where.type = type;
    if (breed) where.breed = breed;

    return this.prisma.pet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
      include: { products: { include: { product: true } } },
    });
    if (!pet) throw new NotFoundException('Pet not found');
    return pet;
  }

  async update(id: string, dto: UpdatePetDTO) {
    const exists = await this.prisma.pet.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Pet not found');

    return this.prisma.pet.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.pet.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Pet not found');

    return this.prisma.pet.delete({ where: { id } });
  }

  async getProducts(petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: { products: { include: { product: true } } },
    });
    if (!pet) throw new NotFoundException('Pet not found');
    return pet.products.map((p) => p.product);
  }

  async assignProduct(petId: string, productId: string) {
    return this.prisma.petProduct.upsert({
      where: { petId_productId: { petId, productId } },
      create: { petId, productId },
      update: {},
    });
  }

  async removeProduct(petId: string, productId: string) {
    return this.prisma.petProduct.delete({
      where: { petId_productId: { petId, productId } },
    });
  }
}
