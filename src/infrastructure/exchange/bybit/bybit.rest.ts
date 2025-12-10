import axios, { AxiosInstance } from 'axios';

export class BybitRest {
  private readonly baseUrl = 'https://api.bybit.com';
  private readonly http: AxiosInstance;
  private cache: { ts: number; symbols: string[] } | null = null;
  private readonly cacheTtlMs = 5 * 60 * 1000;

  constructor() {
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 10_000,
      headers: { 'User-Agent': 'boost-detector/1.0' },
    });
  }

  async getSymbols(quoteCoin = 'USDT', forceRefresh = false): Promise<string[]> {
    if (!forceRefresh && this.cache && (Date.now() - this.cache.ts) < this.cacheTtlMs) {
      return this.cache.symbols;
    }
    const all: string[] = [];
    let cursor: string | undefined = undefined;
    try {
      do {
        const params: any = { category: 'linear' };
        if (cursor) params.cursor = cursor;
        const res = await this.http.get('/v5/market/instruments-info', { params });
        const body = res.data;
        if (body.retCode && body.retCode !== 0) {
          throw new Error(`Bybit error: ${body.retMsg || body.retCode}`);
        }
        const list = body.result?.list || [];
        for (const item of list) {
          if (!item || !item.symbol) continue;
          if ((item.quoteCoin === quoteCoin) && (item.status === 'Trading')) {
            all.push(item.symbol);
          }
        }
        cursor = body.result?.nextPageCursor || undefined;
      } while (cursor);
      const uniq = Array.from(new Set(all));
      this.cache = { ts: Date.now(), symbols: uniq };
      return uniq;
    } catch (err) {
      if (this.cache && this.cache.symbols.length) {
        return this.cache.symbols;
      }
      throw err;
    }
  }

  clearCache() {
    this.cache = null;
  }
}