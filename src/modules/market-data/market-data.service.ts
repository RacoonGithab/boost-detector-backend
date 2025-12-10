import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { RedisService } from '../../infrastructure/redis/redis.service';
import { ExchangeClient } from '../../infrastructure/interface/exchange-client.interface';

@Injectable()
export class MarketDataService implements OnModuleInit {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly redisService: RedisService,
    @Inject('EXCHANGE_CLIENTS') private readonly exchangeClients: ExchangeClient[],
  ) {}

  async onModuleInit() {
    for (const client of this.exchangeClients) {
      const symbols = await client.getSymbols();
      this.logger.log(`Subscribing to symbols from client: ${symbols.join(', ')}`);

      client.subscribeTicker(symbols, async (msg) => {
        if (msg.topic?.startsWith('tickers.') && msg.data?.symbol) {
          const d = msg.data;
          const tickerData = {
            exchange: client.id,
            symbol: d.symbol,
            bid1Price: parseFloat(d.bid1Price || '0'),
            bid1Size: parseFloat(d.bid1Size || '0'),
            ask1Price: parseFloat(d.ask1Price || '0'),
            ask1Size: parseFloat(d.ask1Size || '0'),
            timestamp: msg.ts,
          };
          const key = `${client.id}:${tickerData.symbol}`;
          try {
            await this.redisService.set(key, JSON.stringify(tickerData), 60);
          } catch (error) { /* empty */ }
        }
      });
    }
  }
}