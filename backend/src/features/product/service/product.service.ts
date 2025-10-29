import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { Product } from '@prisma/client';
import { CreateProductDTO } from '../dto/create.product.dto';
import { UpdateProductDTO } from '../dto/update.product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDTO): Promise<Product> {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        image: dto.image,
        description: dto.description,
        stock: dto.stock ?? 0,
      },
    });
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDTO): Promise<Product> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Product> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
