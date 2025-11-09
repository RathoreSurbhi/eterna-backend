import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '30', 10),
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  api: {
    dexscreener: process.env.DEXSCREENER_BASE_URL || 'https://api.dexscreener.com/latest/dex',
    jupiter: process.env.JUPITER_BASE_URL || 'https://price.jup.ag/v4',
    geckoterminal: process.env.GECKOTERMINAL_BASE_URL || 'https://api.geckoterminal.com/api/v2',
  },
  websocket: {
    updateInterval: parseInt(process.env.WS_UPDATE_INTERVAL || '5000', 10),
  },
  retry: {
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.RETRY_DELAY || '1000', 10),
    backoffMultiplier: 2,
  },
};

export const SOLANA_NETWORK = 'solana';
export const SOL_TOKEN_ADDRESS = 'So11111111111111111111111111111111111111112';

// Popular Solana tokens for initial data
export const POPULAR_TOKENS = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // BONK
];
