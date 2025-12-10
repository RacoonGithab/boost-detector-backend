import WebSocket from 'ws';

type SubType = 'tickers' | 'trades' | 'orderbooks';

export class BybitWsManager {
  private wsLists: Record<SubType, WebSocket[]> = {
    tickers: [],
    trades: [],
    orderbooks: []
  };

  private readonly CHUNK_SIZE: Record<SubType, number> = {
    tickers: 100,
    trades: 80,
    orderbooks: 50
  };

  private readonly WS_URL = 'wss://stream.bybit.com/v5/public/linear';

  public onTicker?: (msg: any) => void;
  public onTrade?: (msg: any) => void;
  public onOrderbook?: (msg: any) => void;

  subscribeTickers(symbols: string[]) {
    this.createChunkedWS('tickers', symbols, this.onTicker);
  }

  subscribeTrades(symbols: string[]) {
    this.createChunkedWS('trades', symbols, this.onTrade);
  }

  subscribeOrderbooks(symbols: string[]) {
    this.createChunkedWS('orderbooks', symbols, this.onOrderbook);
  }

  private createChunkedWS(type: SubType, symbols: string[], onMsg?: (msg: any) => void) {
    const chunkSize = this.CHUNK_SIZE[type];
    const chunks = this.toChunks(symbols, chunkSize);
    const wsList = this.wsLists[type];

    chunks.forEach(chunk => {
      const ws = new WebSocket(this.WS_URL);

      ws.on('open', () => {
        ws.send(JSON.stringify(this.buildSubPayload(type, chunk)));
        this.startPing(ws);
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        onMsg?.(msg);
      });

      ws.on('close', () => setTimeout(() => this.reconnect(ws, type, chunk, onMsg), 1000));
      ws.on('error', () => ws.close());

      wsList.push(ws);
    });
  }

  private reconnect(ws: WebSocket, type: SubType, chunk: string[], onMsg?: (msg: any) => void) {
    const wsList = this.wsLists[type];
    const index = wsList.indexOf(ws);
    if (index !== -1) wsList.splice(index, 1);
    this.createChunkedWS(type, chunk, onMsg);
  }

  private buildSubPayload(type: SubType, chunk: string[]) {
    switch (type) {
      case 'tickers':
        return { op: 'subscribe', args: chunk.map(s => `tickers.${s}`) };
      case 'trades':
        return { op: 'subscribe', args: chunk.map(s => `publicTrade.${s}`) };
      case 'orderbooks':
        return { op: 'subscribe', args: chunk.map(s => `orderbook.50.${s}`) };
    }
  }

  private startPing(ws: WebSocket) {
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 'ping' }));
    }, 20000);
  }

  private toChunks(arr: string[], size: number): string[][] {
    const out: string[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
}