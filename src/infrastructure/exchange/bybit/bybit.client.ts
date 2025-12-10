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
    return this.rest.getSymbols();
  }

  subscribeTickers(symbols: string[], onMessage: (msg: any) => void) {
    this.ws.onTicker = onMessage;
    this.ws.subscribeTickers(symbols);
  }

  subscribeTrades(symbols: string[], onMessage: (msg: any) => void) {
    this.ws.onTrade = onMessage;
    this.ws.subscribeTrades(symbols);
  }

  subscribeOrderbooks(symbols: string[], onMessage: (msg: any) => void) {
    this.ws.onOrderbook = onMessage;
    this.ws.subscribeOrderbooks(symbols);
  }
}