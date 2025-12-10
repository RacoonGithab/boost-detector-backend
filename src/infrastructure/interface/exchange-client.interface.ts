export interface ExchangeClient {
  id: string;

  getSymbols(): Promise<string[]>;

  subscribeTickers(symbols: string[], onMessage: (msg: any) => void): void;

  subscribeTrades(symbols: string[], onMessage: (msg: any) => void): void;

  subscribeOrderbooks(symbols: string[], onMessage: (msg: any) => void): void;
}