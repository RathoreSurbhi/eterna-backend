import { HttpClient } from '../utils/httpClient';
import { GeckoTerminalResponse, TokenData } from '../types';
import { config, SOLANA_NETWORK } from '../config';
import { logger } from '../utils/logger';

export class GeckoTerminalClient {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(config.api.geckoterminal, 15000);
  }

  async getTrendingTokens(page: number = 1): Promise<TokenData[]> {
    try {
      logger.info(`Fetching trending tokens from GeckoTerminal, page: ${page}`);
      const response = await this.httpClient.get<GeckoTerminalResponse>(
        `/networks/${SOLANA_NETWORK}/tokens`,
        { page }
      );

      if (!response.data || response.data.length === 0) {
        logger.warn('No tokens found from GeckoTerminal');
        return [];
      }

      return response.data.map((token) => {
        const volumeH24 = parseFloat(token.attributes.volume_usd.h24);
        const priceUsd = parseFloat(token.attributes.price_usd);
        const liquidityUsd = parseFloat(token.attributes.total_reserve_in_usd);
        const marketCapUsd = token.attributes.market_cap_usd 
          ? parseFloat(token.attributes.market_cap_usd) 
          : 0;

        // Approximate SOL price (you might want to fetch this dynamically)
        const solPriceUsd = 100; // Placeholder

        return {
          token_address: token.attributes.address,
          token_name: token.attributes.name,
          token_ticker: token.attributes.symbol,
          price_sol: priceUsd / solPriceUsd,
          market_cap_sol: marketCapUsd / solPriceUsd,
          volume_sol: volumeH24 / solPriceUsd,
          liquidity_sol: liquidityUsd / solPriceUsd,
          transaction_count: 0, // Not available from GeckoTerminal
          price_1hr_change: 0, // Not available from this endpoint
          price_24hr_change: 0,
          protocol: 'Multiple',
          source: 'geckoterminal',
          last_updated: Date.now(),
        };
      });
    } catch (error) {
      logger.error('Error fetching from GeckoTerminal', { error });
      return [];
    }
  }

  async getTokenByAddress(address: string): Promise<TokenData | null> {
    try {
      logger.info(`Fetching token from GeckoTerminal: ${address}`);
      const response = await this.httpClient.get<{ data: GeckoTerminalResponse['data'][0] }>(
        `/networks/${SOLANA_NETWORK}/tokens/${address}`
      );

      if (!response.data) {
        return null;
      }

      const token = response.data;
      const volumeH24 = parseFloat(token.attributes.volume_usd.h24);
      const priceUsd = parseFloat(token.attributes.price_usd);
      const liquidityUsd = parseFloat(token.attributes.total_reserve_in_usd);
      const marketCapUsd = token.attributes.market_cap_usd 
        ? parseFloat(token.attributes.market_cap_usd) 
        : 0;

      const solPriceUsd = 100; // Placeholder

      return {
        token_address: token.attributes.address,
        token_name: token.attributes.name,
        token_ticker: token.attributes.symbol,
        price_sol: priceUsd / solPriceUsd,
        market_cap_sol: marketCapUsd / solPriceUsd,
        volume_sol: volumeH24 / solPriceUsd,
        liquidity_sol: liquidityUsd / solPriceUsd,
        transaction_count: 0,
        price_1hr_change: 0,
        price_24hr_change: 0,
        protocol: 'Multiple',
        source: 'geckoterminal',
        last_updated: Date.now(),
      };
    } catch (error) {
      logger.error('Error fetching token from GeckoTerminal', { address, error });
      return null;
    }
  }
}
