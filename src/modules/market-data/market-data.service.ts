import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { ExchangeClient } from '../../infrastructure/interface/exchange-client.interface';

@Injectable()
export class MarketDataService implements OnModuleInit {
  private readonly logger = new Logger(MarketDataService.name);
  private tickerCache: Map<string, any> = new Map();
  private orderbookCache: Map<string, any> = new Map();

  constructor(
    private readonly redis: RedisService,
    @Inject('EXCHANGE_CLIENTS') private readonly clients: ExchangeClient[],
  ) {}

  async onModuleInit() {
    for (const client of this.clients) {
      const symbols = await client.getSymbols();
      this.logger.log(`EXCHANGE ${client.id} symbols loaded: ${symbols.length}`);

      client.subscribeTickers(symbols, async msg => {
        const s = msg.data?.symbol;
        if (!s) return;
        const key = `${client.id}:ticker:${s}`;
        const current = this.tickerCache.get(key) || {};
        const isSnapshot = msg.type === 'snapshot';
        const data = msg.data;
        const updated = isSnapshot
          ? {
            exchange: client.id,
            symbol: s,
            bid: Number(data.bid1Price || 0),
            ask: Number(data.ask1Price || 0),
            lastPrice: Number(data.lastPrice || 0),
            vol24h: Number(data.turnover24h || 0),
            change24h: Number(data.price24hPcnt || 0),
            markPrice: Number(data.markPrice || 0),
            indexPrice: Number(data.indexPrice || 0),
            fundingRate: Number(data.fundingRate || 0),
            nextFundingTime: data.nextFundingTime || null,
            ts: msg.ts
          }
          : {
            ...current,
            bid: data.bid1Price ? Number(data.bid1Price) : current.bid,
            ask: data.ask1Price ? Number(data.ask1Price) : current.ask,
            lastPrice: data.lastPrice ? Number(data.lastPrice) : current.lastPrice,
            vol24h: data.turnover24h ? Number(data.turnover24h) : current.vol24h,
            change24h: data.price24hPcnt ? Number(data.price24hPcnt) : current.change24h,
            markPrice: data.markPrice ? Number(data.markPrice) : current.markPrice,
            indexPrice: data.indexPrice ? Number(data.indexPrice) : current.indexPrice,
            fundingRate: data.fundingRate ? Number(data.fundingRate) : current.fundingRate,
            nextFundingTime: data.nextFundingTime || current.nextFundingTime,
            ts: msg.ts
          };
        this.tickerCache.set(key, updated);
        try {
          await this.redis.set(key, JSON.stringify(updated), 30);
        } catch (err) {
          this.logger.warn(`Redis error for ${key}: ${err}`);
        }
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
          } catch (err) {
            this.logger.warn(`Redis error for ${key}: ${err}`);
          }
        }
      });

      client.subscribeOrderbooks(symbols, async msg => {
        if (!msg.data || !msg.topic) return;
        const parts = msg.topic.split('.');
        if (parts.length < 3) return;
        const symbol = parts[2];
        const key = `${client.id}:orderbook:${symbol}`;
        const current = this.orderbookCache.get(key) || { bids: [], asks: [] };
        const data = msg.data;
        if (data.b) {
          data.b.forEach(([price, qty]: [string, string]) => {
            const idx = current.bids.findIndex(b => b[0] === price);
            if (Number(qty) === 0) {
              if (idx !== -1) current.bids.splice(idx, 1);
            } else {
              if (idx !== -1) current.bids[idx][1] = qty;
              else current.bids.push([price, qty]);
            }
          });
          current.bids.sort((a, b) => Number(b[0]) - Number(a[0]));
        }
        if (data.a) {
          data.a.forEach(([price, qty]: [string, string]) => {
            const idx = current.asks.findIndex(a => a[0] === price);
            if (Number(qty) === 0) {
              if (idx !== -1) current.asks.splice(idx, 1);
            } else {
              if (idx !== -1) current.asks[idx][1] = qty;
              else current.asks.push([price, qty]);
            }
          });
          current.asks.sort((a, b) => Number(a[0]) - Number(b[0]));
        }
        current.updateId = data.u;
        current.ts = msg.ts;
        this.orderbookCache.set(key, current);
        try {
          await this.redis.set(key, JSON.stringify(current), 5);
        } catch (err) {
          this.logger.warn(`Redis error for orderbook ${symbol}: ${err}`);
        }
      });
    }
  }
}