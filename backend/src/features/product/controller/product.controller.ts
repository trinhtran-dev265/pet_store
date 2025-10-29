import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '@/features/auth/guard/jwt.guard';
import { RolesGuard } from '@/features/auth/guard/role.guard';
import { Roles } from '@/features/auth/decorator/role.decorator';
import { Role } from '@prisma/client';
import { ProductService } from '../service/product.service';
import { CreateProductDTO } from '../dto/create.product.dto';
import { UpdateProductDTO } from '../dto/update.product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  getAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDTO) {
    return this.productService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDTO) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
