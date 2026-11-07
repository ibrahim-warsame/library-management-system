import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// Global so any feature module (Books, Genres, ...) can inject PrismaService
// without importing PrismaModule each time.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
