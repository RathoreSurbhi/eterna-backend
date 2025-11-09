import { DexScreenerClient } from '../clients/dexscreener';
import { GeckoTerminalClient } from '../clients/geckoterminal';
import { cacheService } from './cache.service';
import { TokenData, TokenFilter, TokenSort, PaginatedResponse } from '../types';
import { logger } from '../utils/logger';
import { POPULAR_TOKENS } from '../config';

export class AggregationService {
  private dexScreenerClient: DexScreenerClient;
  private geckoTerminalClient: GeckoTerminalClient;
  private readonly CACHE_KEY_PREFIX = 'tokens:';
  private readonly AGGREGATED_CACHE_KEY = 'tokens:aggregated';

  constructor() {
    this.dexScreenerClient = new DexScreenerClient();
    this.geckoTerminalClient = new GeckoTerminalClient();
  }

  /**
   * Merge duplicate tokens from multiple sources
   * Prioritizes data completeness and recency
   */
  private mergeTokens(tokens: TokenData[]): TokenData[] {
    const tokenMap = new Map<string, TokenData>();

    tokens.forEach((token) => {
      const existing = tokenMap.get(token.token_address);

      if (!existing) {
        tokenMap.set(token.token_address, token);
      } else {
        // Merge: prefer non-zero values and more recent data
        const merged: TokenData = {
          ...existing,
          token_name: token.token_name || existing.token_name,
          token_ticker: token.token_ticker || existing.token_ticker,
          price_sol: token.price_sol || existing.price_sol,
          market_cap_sol: Math.max(token.market_cap_sol, existing.market_cap_sol),
          volume_sol: Math.max(token.volume_sol, existing.volume_sol),
          liquidity_sol: Math.max(token.liquidity_sol, existing.liquidity_sol),
          transaction_count: Math.max(token.transaction_count, existing.transaction_count),
          price_1hr_change: token.price_1hr_change || existing.price_1hr_change,
          price_24hr_change: token.price_24hr_change || existing.price_24hr_change,
          price_7d_change: token.price_7d_change || existing.price_7d_change,
          protocol: token.source === 'dexscreener' ? token.protocol : existing.protocol,
          source: 'aggregated',
          last_updated: Math.max(token.last_updated || 0, existing.last_updated || 0),
        };

        tokenMap.set(token.token_address, merged);
      }
    });

    return Array.from(tokenMap.values());
  }

  /**
   * Fetch and aggregate tokens from all sources
   */
  async aggregateTokens(forceRefresh: boolean = false): Promise<TokenData[]> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await cacheService.get<TokenData[]>(this.AGGREGATED_CACHE_KEY);
        if (cached) {
          logger.info('Returning cached aggregated tokens');
          return cached;
        }
      }

      logger.info('Aggregating tokens from all sources');
      const allTokens: TokenData[] = [];

      // Fetch from DexScreener - search for trending tokens
      const dexScreenerPromises = POPULAR_TOKENS.map((address) =>
        this.dexScreenerClient.getTokensByAddress(address)
      );

      // Also do a general search
      const searchPromises = [
        this.dexScreenerClient.searchTokens('solana meme'),
        this.dexScreenerClient.searchTokens('bonk'),
      ];

      // Fetch from GeckoTerminal
      const geckoPromises = [
        this.geckoTerminalClient.getTrendingTokens(1),
        this.geckoTerminalClient.getTrendingTokens(2),
      ];

      // Execute all requests in parallel
      const results = await Promise.allSettled([
        ...dexScreenerPromises,
        ...searchPromises,
        ...geckoPromises,
      ]);

      // Collect successful results
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          allTokens.push(...result.value);
        }
      });

      logger.info(`Fetched ${allTokens.length} tokens before merging`);

      // Merge duplicates
      const mergedTokens = this.mergeTokens(allTokens);
      logger.info(`Merged to ${mergedTokens.length} unique tokens`);

      // Cache the result
      await cacheService.set(this.AGGREGATED_CACHE_KEY, mergedTokens);

      return mergedTokens;
    } catch (error) {
      logger.error('Error aggregating tokens', { error });
      throw error;
    }
  }

  /**
   * Apply filters to token list
   */
  private applyFilters(tokens: TokenData[], filter?: TokenFilter): TokenData[] {
    if (!filter) return tokens;

    return tokens.filter((token) => {
      if (filter.min_volume && token.volume_sol < filter.min_volume) return false;
      if (filter.max_volume && token.volume_sol > filter.max_volume) return false;
      if (filter.protocol && token.protocol !== filter.protocol) return false;
      
      if (filter.min_price_change) {
        const priceChange = filter.time_period === '24h' 
          ? token.price_24hr_change 
          : filter.time_period === '7d'
          ? token.price_7d_change
          : token.price_1hr_change;
        
        if (!priceChange || priceChange < filter.min_price_change) return false;
      }

      return true;
    });
  }

  /**
   * Apply sorting to token list
   */
  private applySorting(tokens: TokenData[], sort?: TokenSort): TokenData[] {
    if (!sort) {
      // Default: sort by volume descending
      return tokens.sort((a, b) => b.volume_sol - a.volume_sol);
    }

    const sortedTokens = [...tokens];
    const multiplier = sort.order === 'asc' ? 1 : -1;

    sortedTokens.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sort.field) {
        case 'volume':
          aValue = a.volume_sol;
          bValue = b.volume_sol;
          break;
        case 'price_change':
          aValue = a.price_1hr_change;
          bValue = b.price_1hr_change;
          break;
        case 'market_cap':
          aValue = a.market_cap_sol;
          bValue = b.market_cap_sol;
          break;
        case 'liquidity':
          aValue = a.liquidity_sol;
          bValue = b.liquidity_sol;
          break;
        case 'transaction_count':
          aValue = a.transaction_count;
          bValue = b.transaction_count;
          break;
        default:
          aValue = a.volume_sol;
          bValue = b.volume_sol;
      }

      return (aValue - bValue) * multiplier;
    });

    return sortedTokens;
  }

  /**
   * Get paginated, filtered, and sorted tokens
   */
  async getTokens(
    limit: number = 20,
    cursor?: string,
    filter?: TokenFilter,
    sort?: TokenSort
  ): Promise<PaginatedResponse<TokenData>> {
    try {
      // Get all tokens
      let tokens = await this.aggregateTokens();

      // Apply filters
      tokens = this.applyFilters(tokens, filter);

      // Apply sorting
      tokens = this.applySorting(tokens, sort);

      // Handle pagination
      const startIndex = cursor ? parseInt(cursor, 10) : 0;
      const endIndex = startIndex + limit;
      const paginatedTokens = tokens.slice(startIndex, endIndex);

      const hasMore = endIndex < tokens.length;
      const nextCursor = hasMore ? endIndex.toString() : undefined;

      return {
        data: paginatedTokens,
        pagination: {
          limit,
          next_cursor: nextCursor,
          has_more: hasMore,
          total: tokens.length,
        },
      };
    } catch (error) {
      logger.error('Error getting tokens', { error });
      throw error;
    }
  }

  /**
   * Get a single token by address
   */
  async getTokenByAddress(address: string): Promise<TokenData | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${address}`;
      
      // Check cache
      const cached = await cacheService.get<TokenData>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from multiple sources
      const [dexScreenerTokens, geckoToken] = await Promise.all([
        this.dexScreenerClient.getTokensByAddress(address),
        this.geckoTerminalClient.getTokenByAddress(address),
      ]);

      const allTokens = [...dexScreenerTokens];
      if (geckoToken) {
        allTokens.push(geckoToken);
      }

      if (allTokens.length === 0) {
        return null;
      }

      // Merge data
      const merged = this.mergeTokens(allTokens)[0];

      // Cache the result
      await cacheService.set(cacheKey, merged);

      return merged;
    } catch (error) {
      logger.error('Error getting token by address', { address, error });
      return null;
    }
  }

  /**
   * Force refresh all cached data
   */
  async refreshCache(): Promise<void> {
    logger.info('Forcing cache refresh');
    await cacheService.delPattern('tokens:*');
    await this.aggregateTokens(true);
  }
}

export const aggregationService = new AggregationService();
