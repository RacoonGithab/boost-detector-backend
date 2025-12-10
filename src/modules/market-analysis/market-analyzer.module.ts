import { Module } from '@nestjs/common';

import { MarketAnalyzerService } from './market-analyzer.service';
import { PumpScheduler } from './pump-scheduler.service';
import { RedisModule } from '../../infrastructure/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [MarketAnalyzerService, PumpScheduler],
  exports: [MarketAnalyzerService]
})
export class MarketAnalyzerModule {}