import { NestFactory } from '@nestjs/core';
import { AppModule } from './features/app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './core/filter/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3010);
  console.log(`Server running on http://localhost:${process.env.PORT ?? 3010}`);
}
bootstrap().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
