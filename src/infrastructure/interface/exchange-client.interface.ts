export interface ExchangeClient {
  id: string;
  getSymbols(): Promise<string[]>;
  subscribeTicker(symbols: string[], onMessage: (msg: any) => void): void;
  subscribeDetail(symbol: string, onMessage?: (msg: any) => void): void;
}