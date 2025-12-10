import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { ExchangeClient } from '../../infrastructure/interface/exchange-client.interface';

@Injectable()
export class MarketDataService implements OnModuleInit {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly redis: RedisService,
    @Inject('EXCHANGE_CLIENTS') private readonly clients: ExchangeClient[],
  ) {}

  async onModuleInit() {
    for (const client of this.clients) {
      const symbols = await client.getSymbols();
      this.logger.log(`EXCHANGE ${client.id} symbols loaded: ${symbols.length}`);

      client.subscribeTickers(symbols, async msg => {
        if (!msg.data?.symbol) return;
        const s = msg.data.symbol;
        const data = {
          exchange: client.id,
          symbol: s,
          bid: Number(msg.data.bid1Price),
          ask: Number(msg.data.ask1Price),
          lastPrice: Number(msg.data.lastPrice),
          vol24h: Number(msg.data.turnover24h || 0),
          change24h: Number(msg.data.price24hPcnt || 0),
          ts: msg.ts,
        };
        try {
        await this.redis.set(`${client.id}:ticker:${s}`, JSON.stringify(data), 30);
        } catch (error) { /* empty */ }
      });

      client.subscribeTrades(symbols, async msg => {
        if (!msg.data) return;
        for (const tr of msg.data) {
          const symbol = tr.s;
          const price = Number(tr.p);
          const qty = Number(tr.v);
          const ts = tr.T;
          const tradeRecord = {
            exchange: client.id,
            symbol,
            price,
            qty,
            quoteVolume: price * qty,
            side: tr.S === 'Buy' ? 'buy' : 'sell',
            ts,
          };
          const key = `${client.id}:trades:${symbol}`;
          try {
          await this.redis.zadd(key, ts, JSON.stringify(tradeRecord));
          await this.redis.expire(key, 60);
          await this.redis.zremrangebyscore(key, 0, Date.now() - 60000);
          } catch (error) { /* empty */ }
        }
      });

      client.subscribeOrderbooks(symbols, async msg => {
        if (!msg.data?.b || !msg.data?.a) return;
        const symbol = msg.topic.split(".")[2];
        const depth = {
          exchange: client.id,
          symbol,
          bids: msg.data.b.slice(0, 10),
          asks: msg.data.a.slice(0, 10),
          updateId: msg.data.u,
          ts: msg.ts
        };
        try {
        await this.redis.set(`${client.id}:orderbook:${symbol}`, JSON.stringify(depth), 5);
        } catch (error) { /* empty */ }
      });
    }
  }
}