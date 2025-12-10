import { Module } from '@nestjs/common';
import { BybitClient } from './bybit/bybit.client';
import { RedisService } from '../redis/redis.service';

@Module({
  providers: [
    RedisService,
    BybitClient,
    {
      provide: 'EXCHANGE_CLIENTS',
      useFactory: (bybit: BybitClient) => [bybit], // массив клиентов
      inject: [BybitClient],
    },
  ],
  exports: ['EXCHANGE_CLIENTS', RedisService],
})
export class ExchangeModule {}