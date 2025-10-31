import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PetModule } from './pet/pet.module';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    PetModule,
    ProductModule,
    CartModule,
  ],
})
export class AppModule {}
