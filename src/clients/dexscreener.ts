import { HttpClient } from '../utils/httpClient';
import { DexScreenerResponse, TokenData } from '../types';
import { config } from '../config';
import { logger } from '../utils/logger';

export class DexScreenerClient {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(config.api.dexscreener, 15000);
  }

  async getTokensByAddress(address: string): Promise<TokenData[]> {
    try {
      logger.info(`Fetching token data from DexScreener for address: ${address}`);
      const response = await this.httpClient.get<DexScreenerResponse>(`/tokens/${address}`);

      if (!response.pairs || response.pairs.length === 0) {
        logger.warn(`No pairs found for token: ${address}`);
        return [];
      }

      // Filter for Solana chain and convert to our format
      const solanaPairs = response.pairs.filter((pair) => pair.chainId === 'solana');
      
      return solanaPairs.map((pair) => ({
        token_address: pair.baseToken.address,
        token_name: pair.baseToken.name,
        token_ticker: pair.baseToken.symbol,
        price_sol: parseFloat(pair.priceNative),
        market_cap_sol: pair.marketCap ? pair.marketCap / (pair.priceUsd ? parseFloat(pair.priceUsd) : 1) : 0,
        volume_sol: pair.volume.h24 / (pair.priceUsd ? parseFloat(pair.priceUsd) : 1),
        liquidity_sol: pair.liquidity?.quote || 0,
        transaction_count: pair.txns.h24.buys + pair.txns.h24.sells,
        price_1hr_change: pair.priceChange.h1,
        price_24hr_change: pair.priceChange.h24,
        protocol: pair.dexId,
        source: 'dexscreener',
        last_updated: Date.now(),
      }));
    } catch (error) {
      logger.error('Error fetching from DexScreener', { address, error });
      return [];
    }
  }

  async searchTokens(query: string): Promise<TokenData[]> {
    try {
      logger.info(`Searching tokens on DexScreener: ${query}`);
      const response = await this.httpClient.get<DexScreenerResponse>(`/search`, { q: query });

      if (!response.pairs || response.pairs.length === 0) {
        return [];
      }

      const solanaPairs = response.pairs.filter((pair) => pair.chainId === 'solana');

      return solanaPairs.slice(0, 50).map((pair) => ({
        token_address: pair.baseToken.address,
        token_name: pair.baseToken.name,
        token_ticker: pair.baseToken.symbol,
        price_sol: parseFloat(pair.priceNative),
        market_cap_sol: pair.marketCap ? pair.marketCap / (pair.priceUsd ? parseFloat(pair.priceUsd) : 1) : 0,
        volume_sol: pair.volume.h24 / (pair.priceUsd ? parseFloat(pair.priceUsd) : 1),
        liquidity_sol: pair.liquidity?.quote || 0,
        transaction_count: pair.txns.h24.buys + pair.txns.h24.sells,
        price_1hr_change: pair.priceChange.h1,
        price_24hr_change: pair.priceChange.h24,
        protocol: pair.dexId,
        source: 'dexscreener',
        last_updated: Date.now(),
      }));
    } catch (error) {
      logger.error('Error searching DexScreener', { query, error });
      return [];
    }
  }
}
