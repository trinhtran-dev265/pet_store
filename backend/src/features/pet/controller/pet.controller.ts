import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '@/features/auth/guard/jwt.guard';
import { RolesGuard } from '@/features/auth/guard/role.guard';
import { Roles } from '@/features/auth/decorator/role.decorator';
import { Role } from '@prisma/client';
import { PetService } from '../service/pet.service';
import { CreatePetDTO } from '../dto/create.pet.dto';
import { UpdatePetDTO } from '../dto/update.pet.dto';
import { AssignProductDTO } from '../dto/assign-product.dto';

@Controller('pets')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get()
  getAll(@Query('type') type?: string, @Query('breed') breed?: string) {
    return this.petService.findAll(type, breed);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.petService.findOne(id);
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreatePetDTO) {
    return this.petService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePetDTO) {
    return this.petService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.petService.remove(id);
  }

  @Get(':id/products')
  getProducts(@Param('id') id: string) {
    return this.petService.getProducts(id);
  }

  @Post(':id/products')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  assignProduct(@Param('id') id: string, @Body() dto: AssignProductDTO) {
    return this.petService.assignProduct(id, dto.productId);
  }

  @Delete(':id/products/:productId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.petService.removeProduct(id, productId);
  }
}
