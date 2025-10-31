import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RegisDTO } from '../dto/register.dto';
import { LoginDTO } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt';
import * as argon from 'argon2';
import {
  isPrismaKnownError,
  isPrismaValidationError,
  isErrorWithMessage,
} from '../../../shared/error/prisma.guard';
import { RedisService } from '../../../core/redis/redis.service';
import { Role } from '@prisma/client';
import { UserService } from '@/features/user/service/user.service';
import { AUTH_MESSAGES } from '@/shared/contants/messages/auth.messages';
import { PRISMA_ERROR_CODES } from '@/shared/contants/prisma.contants';
import type { ConfigType } from '@nestjs/config';

type Tokens = { accessToken: string; refreshToken: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly userService: UserService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
  ) {}

  async register(dto: RegisDTO): Promise<{ message: string }> {
    const passwordHash = await argon.hash(dto.password);

    try {
      await this.userService.create({
        email: dto.email,
        passwordHash,
        role: Role.USER,
      });
      return { message: AUTH_MESSAGES.SUCCESS.REGISTER_SUCCESS };
    } catch (error: unknown) {
      if (
        isPrismaKnownError(error) &&
        error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException(AUTH_MESSAGES.ERROR.EMAIL_EXISTS);
      }
      if (isPrismaValidationError(error)) {
        throw new ConflictException(AUTH_MESSAGES.ERROR.INVALID_DATA);
      }
      if (isErrorWithMessage(error)) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException(AUTH_MESSAGES.ERROR.CREATE_FAIL);
    }
  }

  async login(dto: LoginDTO): Promise<{ message: string; tokens: Tokens }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user)
      throw new UnauthorizedException(
        AUTH_MESSAGES.ERROR.INVALID_EMAIL_PASSWORD,
      );

    const ok = await argon.verify(user.passwordHash, dto.password);
    if (!ok)
      throw new UnauthorizedException(
        AUTH_MESSAGES.ERROR.INVALID_EMAIL_PASSWORD,
      );

    const tokens = await this.signTokens(user.id, user.email, user.role);
    await this.saveRefresh(user.id, tokens.refreshToken);
    return { message: AUTH_MESSAGES.SUCCESS.LOGIN_SUCCESS, tokens };
  }

  async refresh(
    userId: string,
    provided: string,
  ): Promise<{ message: string; tokens: Tokens }> {
    const key = this.refreshKey(userId);
    const stored = await this.redis.get(key);
    if (!stored)
      throw new UnauthorizedException(AUTH_MESSAGES.ERROR.REFRESH_EXPIRED);

    const match = await argon.verify(stored, provided);
    if (!match)
      throw new UnauthorizedException(AUTH_MESSAGES.ERROR.INVALID_REFRESH);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new UnauthorizedException(AUTH_MESSAGES.ERROR.USER_NOT_FOUND);

    const tokens = await this.signTokens(user.id, user.email, user.role);
    await this.saveRefresh(user.id, tokens.refreshToken);
    return { message: AUTH_MESSAGES.SUCCESS.REFRESH_SUCCESS, tokens };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.redis.del(this.refreshKey(userId));
    return { message: AUTH_MESSAGES.SUCCESS.LOGOUT_SUCCESS };
  }

  private async signTokens(
    userId: string,
    email: string,
    role: Role,
  ): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email, role: role.toString() },
        {
          secret: this.jwtConf.accessSecret,
          expiresIn: Number(this.jwtConf.accessTtl),
        },
      ),
      this.jwt.signAsync(
        { sub: userId },
        {
          secret: this.jwtConf.refreshSecret,
          expiresIn: Number(this.jwtConf.refreshTtl),
        },
      ),
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
