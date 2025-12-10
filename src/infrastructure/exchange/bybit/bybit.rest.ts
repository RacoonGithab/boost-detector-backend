import axios from 'axios';

export class BybitRest {
  private readonly baseUrl = 'https://api.bybit.com';

  async getUSDCFuturesSymbols(): Promise<string[]> {
    const url = `${this.baseUrl}/v5/market/instruments-info?category=linear`;

    const { data } = await axios.get(url);

    return data.result.list
      .filter((s: any) => s.quoteCoin === 'USDT')
      .map((s: any) => s.symbol);
  }
}