import { NestFactory } from '@nestjs/core';
import { AppModule } from './features/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3010);
}
bootstrap().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
