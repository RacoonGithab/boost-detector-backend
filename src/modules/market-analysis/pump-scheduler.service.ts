import { Injectable, OnModuleInit } from '@nestjs/common';
import { MarketAnalyzerService } from './market-analyzer.service';

@Injectable()
export class PumpScheduler implements OnModuleInit {
  constructor(private readonly analyzer: MarketAnalyzerService) {}

  onModuleInit() {
    setInterval(async () => {
      await this.analyzer.monitorAllSymbols();
    }, 15000);
  }
}