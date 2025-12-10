import { Injectable, Logger } from '@nestjs/common';

import { BybitRest } from './bybit.rest';
import { BybitWsManager } from './bybit.ws.manager';
import { ExchangeClient } from '../../interface/exchange-client.interface';

@Injectable()
export class BybitClient implements ExchangeClient {
  id = 'bybit';
  private readonly logger = new Logger(BybitClient.name);

  public readonly rest: BybitRest;
  public readonly ws: BybitWsManager;

  constructor() {
    this.rest = new BybitRest();
    this.ws = new BybitWsManager();
  }

  async getSymbols(): Promise<string[]> {
    return this.rest.getUSDCFuturesSymbols();
  }

  /** Подписка на тикеры */
  subscribeTicker(symbols: string[], onMessage: (_: any) => void) {
    this.ws.onTickerMessage = onMessage;
    this.ws.subscribeTickers(symbols);
  }

  /** Подписка на сделки и стакан */
  subscribeDetail(symbol: string) {
    this.ws.subscribeDetail(symbol);
  }
}