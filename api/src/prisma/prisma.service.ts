// api/src/prisma/prisma.service.ts
// Wraps PrismaClient as an injectable Nest provider. This is the only place
// PrismaClient is instantiated; every other service injects PrismaService.
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // Nest calls this once at startup, so the database connection is open
  // before any request tries to use it.
  async onModuleInit() {
    await this.$connect();
  }
}
