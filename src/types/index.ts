export interface TokenData {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_sol: number;
  market_cap_sol: number;
  volume_sol: number;
  liquidity_sol: number;
  transaction_count: number;
  price_1hr_change: number;
  price_24hr_change?: number;
  price_7d_change?: number;
  protocol: string;
  source?: string;
  last_updated?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    next_cursor?: string;
    has_more: boolean;
    total?: number;
  };
}

export interface TokenFilter {
  time_period?: '1h' | '24h' | '7d';
  min_volume?: number;
  max_volume?: number;
  min_price_change?: number;
  protocol?: string;
}

export interface TokenSort {
  field: 'volume' | 'price_change' | 'market_cap' | 'liquidity' | 'transaction_count';
  order: 'asc' | 'desc';
}

export interface QueryParams {
  limit?: number;
  cursor?: string;
  filter?: TokenFilter;
  sort?: TokenSort;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  volume: {
    h24: number;
    h6: number;
    h1: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
  };
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
  };
}

export interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

export interface JupiterPriceData {
  data: {
    [key: string]: {
      id: string;
      mintSymbol: string;
      vsToken: string;
      vsTokenSymbol: string;
      price: number;
    };
  };
  timeTaken: number;
}

export interface GeckoTerminalToken {
  id: string;
  type: string;
  attributes: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    total_supply: string;
    price_usd: string;
    fdv_usd: string;
    total_reserve_in_usd: string;
    volume_usd: {
      h24: string;
    };
    market_cap_usd: string | null;
  };
}

export interface GeckoTerminalResponse {
  data: GeckoTerminalToken[];
}

export interface CacheConfig {
  ttl: number;
  prefix: string;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

export interface WebSocketMessage {
  type: 'initial' | 'update' | 'error';
  data?: TokenData[];
  error?: string;
  timestamp: number;
}
