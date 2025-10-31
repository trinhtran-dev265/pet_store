import { Module } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { ProfileController } from './controller/profile.controller';

@Module({
  controllers: [UserController, ProfileController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
