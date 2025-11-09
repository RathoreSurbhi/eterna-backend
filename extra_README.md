# Things apart from actual README that are important


## Important Design choices
#### 1. **Caching Strategy**
- **Why**: Reduce API calls to respect rate limits (300 req/min for DexScreener)
- **How**: Redis with 30s TTL for aggregated data, separate cache for individual tokens
- **Trade-off**: 30s stale data vs. API rate limit compliance

#### 2. **Exponential Backoff**
- **Why**: Handle transient failures and rate limits gracefully
- **How**: Retry with increasing delays (1s, 2s, 4s) up to 3 attempts
- **Trade-off**: Slower response on failures vs. better reliability

#### 3. **Intelligent Token Merging**
- **Why**: Same token appears on multiple DEXs with different data
- **How**: Merge by address, prefer non-zero values and max for metrics
- **Trade-off**: More accurate data vs. increased processing time

#### 4. **WebSocket Over Polling**
- **Why**: More efficient for real-time updates
- **How**: Server pushes only changed tokens (>1% price or >10% volume change)
- **Trade-off**: More complex implementation vs. better performance

#### 5. **Cursor-based Pagination**
- **Why**: Efficient for large datasets, consistent results
- **How**: Use offset as cursor (simple but effective)
- **Alternative**: Could use token address as cursor for more robustness


## API Documentation
### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Get Tokens (Paginated)

```http
GET /api/tokens
```

**Query Parameters:**
- `limit` (optional): Number of tokens per page (default: 20)
- `cursor` (optional): Pagination cursor
- `filter` (optional): JSON string with filter options
- `sort` (optional): JSON string with sort options

**Filter Options:**
```json
{
  "time_period": "1h|24h|7d",
  "min_volume": 100,
  "max_volume": 10000,
  "min_price_change": 5.0,
  "protocol": "Raydium"
}
```

**Sort Options:**
```json
{
  "field": "volume|price_change|market_cap|liquidity|transaction_count",
  "order": "asc|desc"
}
```

**Example Request:**
```bash
curl "http://localhost:3000/api/tokens?limit=20"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "token_address": "576P1t7XsRL4ZVj38LV2eYWxXRPguBADA8BxcNz1xo8y",
      "token_name": "PIPE CTO",
      "token_ticker": "PIPE",
      "price_sol": 4.4141209798877615e-7,
      "market_cap_sol": 441.41,
      "volume_sol": 1322.43,
      "liquidity_sol": 149.36,
      "transaction_count": 2205,
      "price_1hr_change": 120.61,
      "protocol": "Raydium CLMM"
    }
  ],
  "pagination": {
    "limit": 20,
    "next_cursor": "20",
    "has_more": true,
    "total": 150
  }
}
```

#### 2. Get Token by Address

```http
GET /api/tokens/:address
```

**Example:**
```bash
curl http://localhost:3000/api/tokens/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

#### 3. Refresh Cache

```http
POST /api/refresh
```

#### 4. Health Check

```http
GET /api/health
```

## 🔌 WebSocket Events

### Connection

```javascript
const socket = io('http://localhost:3000');
```

### Events

- `tokens` - Initial data (30 tokens)
- `tokens:update` - Real-time updates (only changed tokens)
- `tokens:refresh` - Full refresh after cache update
- `error` - Error events

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

Test suite includes 10+ tests covering:
- Cache operations
- HTTP client retry logic
- Token merging and filtering
- Sorting and pagination
