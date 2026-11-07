import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// Load DATABASE_URL from api/.env before Nest builds PrismaService.
// (The Prisma CLI reads .env itself, but a running app does not.)
try {
  process.loadEnvFile();
} catch {
  // No .env file: fall back to real environment variables (e.g. in production).
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
