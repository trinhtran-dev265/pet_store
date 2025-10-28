import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RegisDTO } from '../dto/register.dto';
import { LoginDTO } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import {
  isPrismaKnownError,
  isPrismaValidationError,
  isErrorWithMessage,
} from '../../../shared/error/prisma.guard';
import { RedisService } from '../../../core/redis/redis.service';
import { Role } from '@prisma/client';

type Tokens = { accessToken: string; refreshToken: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisDTO): Promise<void> {
    const passwordHash = await argon.hash(dto.password);

    try {
      await this.prisma.user.create({
        data: { email: dto.email, passwordHash, role: Role.USER },
      });
    } catch (error: unknown) {
      if (isPrismaKnownError(error)) {
        if (error.code === 'P2002')
          throw new ConflictException('Email already registered');
      } else if (isPrismaValidationError(error)) {
        throw new ConflictException('Invalid data');
      } else if (isErrorWithMessage(error)) {
        throw new InternalServerErrorException(error.message);
      } else
        throw new InternalServerErrorException(
          isErrorWithMessage(error) ? error.message : 'Failed to create user',
        );
    }
  }

  async login(dto: LoginDTO): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const ok = await argon.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    const tokens = await this.signTokens(user.id, user.email, user.role);
    await this.saveRefresh(user.id, tokens.refreshToken);
    return tokens;
  }

  async refresh(userId: string, provided: string): Promise<Tokens> {
    const key = this.refreshKey(userId);
    const stored = await this.redis.get(key);
    if (!stored) throw new UnauthorizedException('Refresh expired');
    const match = await argon.verify(stored, provided);
    if (!match) throw new UnauthorizedException('Invalid refresh');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User no longer exists');

    const tokens = await this.signTokens(user.id, user.email, user.role);
    await this.saveRefresh(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(this.refreshKey(userId));
  }

  private async signTokens(
    userId: string,
    email: string,
    role: Role,
  ): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ sub: userId, email, role }, { expiresIn: '15m' }),
      this.jwt.signAsync({ sub: userId }, { expiresIn: '7d' }),
    ]);
    return { accessToken, refreshToken };
  }

  private refreshKey(userId: string): string {
    return `refresh:${userId}`;
  }

  private async saveRefresh(userId: string, token: string): Promise<void> {
    const hashed = await argon.hash(token);
    await this.redis.set(this.refreshKey(userId), hashed, 7 * 24 * 60 * 60);
  }
}
