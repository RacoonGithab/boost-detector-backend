import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ExchangeModule } from './exchange/exchange.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ExchangeModule
  ],
})
export class InfraModule {}