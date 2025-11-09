import { AggregationService } from '../services/aggregation.service';
import { TokenData } from '../types';

describe('AggregationService', () => {
  let aggregationService: AggregationService;

  beforeAll(() => {
    aggregationService = new AggregationService();
  });

  describe('Token Merging', () => {
    it('should merge duplicate tokens correctly', () => {
      const tokens: TokenData[] = [
        {
          token_address: 'ABC123',
          token_name: 'Test Token',
          token_ticker: 'TEST',
          price_sol: 0.001,
          market_cap_sol: 1000,
          volume_sol: 500,
          liquidity_sol: 200,
          transaction_count: 100,
          price_1hr_change: 5.0,
          protocol: 'Raydium',
          source: 'dexscreener',
          last_updated: Date.now(),
        },
        {
          token_address: 'ABC123',
          token_name: 'Test Token',
          token_ticker: 'TEST',
          price_sol: 0.0012,
          market_cap_sol: 1200,
          volume_sol: 600,
          liquidity_sol: 250,
          transaction_count: 120,
          price_1hr_change: 5.5,
          protocol: 'Orca',
          source: 'geckoterminal',
          last_updated: Date.now() + 1000,
        },
      ];

      // Access private method through any
      const merged = (aggregationService as any).mergeTokens(tokens);

      expect(merged).toHaveLength(1);
      expect(merged[0].token_address).toBe('ABC123');
      expect(merged[0].volume_sol).toBe(600); // Takes max
      expect(merged[0].source).toBe('aggregated');
    });

    it('should not merge tokens with different addresses', () => {
      const tokens: TokenData[] = [
        {
          token_address: 'ABC123',
          token_name: 'Token A',
          token_ticker: 'TKA',
          price_sol: 0.001,
          market_cap_sol: 1000,
          volume_sol: 500,
          liquidity_sol: 200,
          transaction_count: 100,
          price_1hr_change: 5.0,
          protocol: 'Raydium',
          source: 'dexscreener',
        },
        {
          token_address: 'XYZ789',
          token_name: 'Token B',
          token_ticker: 'TKB',
          price_sol: 0.002,
          market_cap_sol: 2000,
          volume_sol: 1000,
          liquidity_sol: 400,
          transaction_count: 200,
          price_1hr_change: 10.0,
          protocol: 'Orca',
          source: 'geckoterminal',
        },
      ];

      const merged = (aggregationService as any).mergeTokens(tokens);

      expect(merged).toHaveLength(2);
    });
  });

  describe('Filtering', () => {
    it('should filter by minimum volume', () => {
      const tokens: TokenData[] = [
        {
          token_address: 'A',
          token_name: 'Token A',
          token_ticker: 'TKA',
          price_sol: 0.001,
          market_cap_sol: 1000,
          volume_sol: 100,
          liquidity_sol: 200,
          transaction_count: 50,
          price_1hr_change: 5.0,
          protocol: 'Raydium',
        },
        {
          token_address: 'B',
          token_name: 'Token B',
          token_ticker: 'TKB',
          price_sol: 0.002,
          market_cap_sol: 2000,
          volume_sol: 500,
          liquidity_sol: 400,
          transaction_count: 100,
          price_1hr_change: 10.0,
          protocol: 'Orca',
        },
      ];

      const filtered = (aggregationService as any).applyFilters(tokens, {
        min_volume: 200,
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].token_address).toBe('B');
    });

    it('should filter by protocol', () => {
      const tokens: TokenData[] = [
        {
          token_address: 'A',
          token_name: 'Token A',
          token_ticker: 'TKA',
          price_sol: 0.001,
          market_cap_sol: 1000,
          volume_sol: 100,
          liquidity_sol: 200,
          transaction_count: 50,
          price_1hr_change: 5.0,
          protocol: 'Raydium',
        },
        {
          token_address: 'B',
          token_name: 'Token B',
          token_ticker: 'TKB',
          price_sol: 0.002,
          market_cap_sol: 2000,
          volume_sol: 500,
          liquidity_sol: 400,
          transaction_count: 100,
          price_1hr_change: 10.0,
          protocol: 'Orca',
        },
      ];

      const filtered = (aggregationService as any).applyFilters(tokens, {
        protocol: 'Raydium',
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].protocol).toBe('Raydium');
    });
  });

  describe('Sorting', () => {
    it('should sort by volume descending', () => {
      const tokens: TokenData[] = [
        {
          token_address: 'A',
          token_name: 'Token A',
          token_ticker: 'TKA',
          price_sol: 0.001,
          market_cap_sol: 1000,
          volume_sol: 100,
          liquidity_sol: 200,
          transaction_count: 50,
          price_1hr_change: 5.0,
          protocol: 'Raydium',
        },
        {
          token_address: 'B',
          token_name: 'Token B',
          token_ticker: 'TKB',
          price_sol: 0.002,
          market_cap_sol: 2000,
          volume_sol: 500,
          liquidity_sol: 400,
          transaction_count: 100,
          price_1hr_change: 10.0,
          protocol: 'Orca',
        },
        {
          token_address: 'C',
          token_name: 'Token C',
          token_ticker: 'TKC',
          price_sol: 0.003,
          market_cap_sol: 3000,
          volume_sol: 300,
          liquidity_sol: 600,
          transaction_count: 150,
          price_1hr_change: 15.0,
          protocol: 'Jupiter',
        },
      ];

      const sorted = (aggregationService as any).applySorting(tokens, {
        field: 'volume',
        order: 'desc',
      });

      expect(sorted[0].token_address).toBe('B');
      expect(sorted[1].token_address).toBe('C');
      expect(sorted[2].token_address).toBe('A');
    });

    it('should sort by market cap ascending', () => {
      const tokens: TokenData[] = [
        {
          token_address: 'A',
          token_name: 'Token A',
          token_ticker: 'TKA',
          price_sol: 0.001,
          market_cap_sol: 3000,
          volume_sol: 100,
          liquidity_sol: 200,
          transaction_count: 50,
          price_1hr_change: 5.0,
          protocol: 'Raydium',
        },
        {
          token_address: 'B',
          token_name: 'Token B',
          token_ticker: 'TKB',
          price_sol: 0.002,
          market_cap_sol: 1000,
          volume_sol: 500,
          liquidity_sol: 400,
          transaction_count: 100,
          price_1hr_change: 10.0,
          protocol: 'Orca',
        },
      ];

      const sorted = (aggregationService as any).applySorting(tokens, {
        field: 'market_cap',
        order: 'asc',
      });

      expect(sorted[0].token_address).toBe('B');
      expect(sorted[1].token_address).toBe('A');
    });
  });
});
