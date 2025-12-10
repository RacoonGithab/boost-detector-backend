import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';

interface PumpSignal {
  exchange: string;
  symbol: string;
  lastPrice: number;
  volumeSpike: number;
  priceSpike: number;
  orderbookPressure: number;
  detectedAt: number;
}

@Injectable()
export class MarketAnalyzerService {
  private readonly logger = new Logger(MarketAnalyzerService.name);
  private readonly EXCHANGE = 'bybit';

  constructor(private readonly redis: RedisService) {}

  async getTicker(symbol: string) {
    const data = await this.redis.get(`${this.EXCHANGE}:ticker:${symbol}`);
    return data ? JSON.parse(data) : null;
  }

  async getTrades(symbol: string, lastMs = 60000) {
    const now = Date.now();
    const data = await this.redis.zrevrange(`${this.EXCHANGE}:trades:${symbol}`, 0, -1);

    return data
      .map(d => JSON.parse(d))
      .filter(t => t.ts >= now - lastMs);
  }

  async getOrderbook(symbol: string) {
    const data = await this.redis.get(`${this.EXCHANGE}:orderbook:${symbol}`);
    return data ? JSON.parse(data) : null;
  }

  async saveVolumeHistory(symbol: string, volume1m: number) {
    const key = `${this.EXCHANGE}:volhist:${symbol}`;
    const now = Date.now();
    await this.redis.zadd(key, now, String(volume1m));
    await this.redis.zremrangebyscore(key, 0, now - 5 * 60 * 1000); // keep 5 min history
  }

  async getAvgVolume(symbol: string) {
    const key = `${this.EXCHANGE}:volhist:${symbol}`;
    const values = await this.redis.zrange(key, 0, -1);
    if (!values.length) return null;
    const nums = values.map(v => Number(v));
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  async analyzeSymbol(symbol: string): Promise<PumpSignal | null> {
    const trades = await this.getTrades(symbol, 60000);
    const current1mVolume = trades.reduce((sum, t) => sum + t.quoteVolume, 0);
    await this.saveVolumeHistory(symbol, current1mVolume);
    const avgVolume = await this.getAvgVolume(symbol);
    if (!avgVolume) return null; // need history
    const volumeSpike = current1mVolume / avgVolume;
    if (trades.length < 2) return null;
    const priceStart = trades[trades.length - 1].price;
    const priceEnd = trades[0].price;
    const priceSpike = ((priceEnd - priceStart) / priceStart) * 100;
    const orderbook = await this.getOrderbook(symbol);
    if (!orderbook) return null;
    const bidSizeNow = orderbook.bids.slice(0, 10).reduce((s, lvl) => s + Number(lvl[1]), 0);
    const histKey = `${this.EXCHANGE}:obprev:${symbol}`;
    const prevRaw = await this.redis.get(histKey);
    let orderbookPressure = 1;
    if (prevRaw) {
      const prev = JSON.parse(prevRaw);
      const bidSizePrev = prev.reduce((s, lvl) => s + Number(lvl[1]), 0);
      orderbookPressure = bidSizePrev === 0 ? 1 : bidSizeNow / bidSizePrev;
    }
    await this.redis.set(histKey, JSON.stringify(orderbook.bids.slice(0, 10)), 120);
    const volumeOk = volumeSpike >= 4;
    const priceOk = Math.abs(priceSpike) >= 2.5;
    const orderbookOk = orderbookPressure >= 1.3;
    if (volumeOk && priceOk && orderbookOk) {
      return {
        exchange: this.EXCHANGE,
        symbol,
        lastPrice: priceEnd,
        volumeSpike,
        priceSpike,
        orderbookPressure,
        detectedAt: Date.now(),
      };
    }
    return null;
  }

  async monitorAllSymbols() {
    const keys = await this.redis.keys(`${this.EXCHANGE}:trades:*`);
    const symbols = keys.map(k => k.split(':')[2]);
    for (const symbol of symbols) {
      try {
        const signal = await this.analyzeSymbol(symbol);
        if (signal) {
          this.logger.warn(
            `🚀 REAL PUMP DETECTED ${signal.symbol} | ` +
            `Vol×${signal.volumeSpike.toFixed(1)} | ` +
            `Price ${signal.priceSpike.toFixed(2)}% | ` +
            `OB×${signal.orderbookPressure.toFixed(1)}`
          );
        }
      } catch (err) {
        this.logger.error(`Error analyzing ${symbol}: ${err}`);
      }
    }
  }
}