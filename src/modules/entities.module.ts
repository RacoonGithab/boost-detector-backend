import { Module } from '@nestjs/common';

import { MarketDataModule } from './market-data/market-data.module';
import { MarketAnalyzerModule } from './market-analysis/market-analyzer.module';

@Module({
  imports: [
    MarketDataModule,
    MarketAnalyzerModule
  ]
})
export class EntitiesModule {}