import { Module } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { PetService } from './service/pet.service';
import { PetController } from './controller/pet.controller';

@Module({
  controllers: [PetController],
  providers: [PetService, PrismaService],
  exports: [PetService],
})
export class PetModule {}
