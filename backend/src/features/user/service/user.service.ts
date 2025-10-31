import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateUserDTO } from '../dto/create.user.dto';
import { UpdateUserDTO } from '../dto/update.user.dto';
import { USER_MESSAGES } from '@/shared/contants/messages/user.messages';
import { PRISMA_ERROR_CODES } from '@/shared/contants/prisma.contants';

function isPrismaError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDTO) {
    try {
      return await this.prisma.user.create({
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
    } catch (error: unknown) {
      if (
        isPrismaError(error) &&
        error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException(USER_MESSAGES.ERROR.EMAIL_EXISTS);
      }
      throw new InternalServerErrorException(USER_MESSAGES.ERROR.CREATE_FAIL);
    }
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    } catch {
      throw new InternalServerErrorException(USER_MESSAGES.SUCCESS.FETCH_ALL);
    }
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
    if (!user) throw new NotFoundException(USER_MESSAGES.ERROR.NOT_FOUND);
    return user;
  }

  async findAllUsersOnly() {
    try {
      return await this.prisma.user.findMany({
        where: { role: Role.USER },
      });
    } catch {
      throw new InternalServerErrorException(USER_MESSAGES.SUCCESS.FETCH_ALL);
    }
  }

  async update(id: string, dto: UpdateUserDTO) {
    try {
      return await this.prisma.user.update({
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
    } catch (error: unknown) {
      if (
        isPrismaError(error) &&
        error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException(USER_MESSAGES.ERROR.EMAIL_EXISTS);
      }
      throw new InternalServerErrorException(USER_MESSAGES.ERROR.UPDATE_FAIL);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.user.delete({ where: { id } });
    } catch {
      throw new InternalServerErrorException(USER_MESSAGES.ERROR.DELETE_FAIL);
    }
  }
}
