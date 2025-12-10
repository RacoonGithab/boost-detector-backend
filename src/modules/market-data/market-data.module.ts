import { Module } from '@nestjs/common';

import { RedisModule } from '../../infrastructure/redis/redis.module';
import { MarketDataService } from './market-data.service';
import { ExchangeModule } from '../../infrastructure/exchange/exchange.module';

@Module({
  imports: [
    RedisModule,
    ExchangeModule
  ],
  providers: [MarketDataService]
})
export class MarketDataModule {}