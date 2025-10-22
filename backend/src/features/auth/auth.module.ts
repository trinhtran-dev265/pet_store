import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { RedisService } from '@/core/redis/redis.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-secret',
      signOptions: { issuer: 'petstore', audience: 'petstore-app' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisService],
})
export class AuthModule {}
