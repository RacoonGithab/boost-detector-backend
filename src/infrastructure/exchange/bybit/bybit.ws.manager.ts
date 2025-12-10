import WebSocket from 'ws';

export class BybitWsManager {
  private tickerWS: WebSocket;
  private detailWS: WebSocket;
  public onTickerMessage?: (msg: any) => void;

  constructor() {
    this.tickerWS = new WebSocket('wss://stream.bybit.com/v5/public/linear');
    this.detailWS = new WebSocket('wss://stream.bybit.com/v5/public/linear');

    this.tickerWS.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      this.onTickerMessage?.(msg);
    });
  }

  subscribeTickers(symbols: string[]) {
    if (this.tickerWS.readyState === WebSocket.OPEN) {
      this.sendTickers(symbols);
    } else {
      this.tickerWS.on('open', () => {
        this.sendTickers(symbols);
      });
    }
  }

  private sendTickers(symbols: string[]) {
    const args = symbols.map(s => `tickers.${s}`);
    this.tickerWS.send(JSON.stringify({ op: "subscribe", args }));
  }

  subscribeDetail(symbol: string) {
    if (this.detailWS.readyState === WebSocket.OPEN) {
      this.sendDetail(symbol);
    } else {
      this.detailWS.on('open', () => {
        this.sendDetail(symbol);
      });
    }
  }

  private sendDetail(symbol: string) {
    this.detailWS.send(JSON.stringify({
      op: "subscribe",
      args: [
        `publicTrade.${symbol}`,
        `orderbook.50.${symbol}`
      ]
    }));
  }
}