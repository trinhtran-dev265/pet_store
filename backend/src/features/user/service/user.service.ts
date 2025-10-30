import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateUserDTO } from '../dto/create.user.dto';
import { UpdateUserDTO } from '../dto/update.user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDTO) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: dto.passwordHash,
        role: dto.role ?? Role.USER,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAllUsersOnly() {
    return this.prisma.user.findMany({
      where: { role: Role.USER },
    });
  }

  async update(id: string, dto: UpdateUserDTO) {
    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
