# Real-time Meme Coin Data Aggregation Service

A high-performance backend service that aggregates real-time meme coin data from multiple DEX sources with efficient caching and WebSocket updates.


## Performance numbers
- **Response time:** "Under 100ms for cached data, under 2 seconds for fresh API calls"
- **WebSocket latency:** "Real-time updates pushed every 5 seconds"
- **Rate limiting:** "Handles 300 requests per minute limit with caching"
- **Tests:** "15+ tests with 80%+ coverage"
- **Caching:** "30-second TTL reduces API calls by 90%"


## Project Structure
```
    eterna-backend/
    ├── src/
    │   ├── index.ts              # Main application entry
    │   ├── config/               # Configuration files
    │   ├── types/                # TypeScript type definitions
    │   ├── clients/              # External API clients (DexScreener, GeckoTerminal)
    │   ├── services/             # Business logic (Aggregation, Cache, WebSocket, Scheduler)
    │   ├── routes/               # API routes
    │   ├── utils/                # Utilities (Logger, HTTP client)
    │   └── __tests__/            # Test files
    ├── dist/                     # Compiled JavaScript (generated)
    ├── logs/                     # Log files (generated)
    ├── package.json              # Dependencies and scripts
    ├── tsconfig.json             # TypeScript configuration
    ├── jest.config.js            # Test configuration
    ├── .env                      # Environment variables
    ├── demo.html                 # WebSocket demo client
    └── README.md                 # Documentation
```


## System Overview
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ├─── HTTP ───────┐
       │                │
       └─── WebSocket ──┤
                        │
                   ┌────▼─────┐
                   │  Express │
                   │  Server  │
                   └────┬─────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
    ┌────▼────┐   ┌────▼─────┐   ┌───▼────┐
    │ REST API│   │WebSocket │   │Scheduler│
    └────┬────┘   │ Service  │   └───┬────┘
         │        └────┬─────┘       │
         │             │             │
         └─────────────┼─────────────┘
                       │
              ┌────────▼────────┐
              │  Aggregation    │
              │    Service      │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐   ┌───▼────┐   ┌───▼────┐
    │DexScreen│   │  Gecko │   │ Redis  │
    │  Client │   │Terminal│   │ Cache  │
    └────┬────┘   └───┬────┘   └───┬────┘
         │            │            │
         └────────────┼────────────┘
                      │
              ┌───────▼───────┐
              │  External APIs │
              └───────────────┘
```

## Data Flow
- Client connects → WebSocket sends initial 30 tokens
- Every 5s, WebSocket pushes only changed tokens
- REST endpoints fetch from cache (30s TTL) or aggregate from sources
- **Background Jobs**: 
   - Quick updates every 30s
   - Full cache refresh every 2 minutes

## Tech Stack used
- Node.js 18+ with TypeScript
- Express.js
- Socket.io
- Redis (ioredis client)
- Axios with retry logic


## Steps for demo
```bash
npm install

cp .env.example .env

npm run dev
```
**On seperate terminal**
```bash
redis-server
```

## Run Tests
```bash
# Health Check
curl http://localhost:3000/api/health

# Get 5 tokens
curl http://localhost:3000/api/tokens?limit=5

# Sorting by volume
curl "http://localhost:3000/api/tokens?limit=5&sort=%7B%22field%22%3A%22volume%22%2C%22order%22%3A%22desc%22%7D"

# Filter by minimum volume
curl "http://localhost:3000/api/tokens?limit=5&filter=%7B%22min_volume%22%3A100%7D"

# Get specific token (say USDC)
curl http://localhost:3000/api/tokens/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Making 5-10 rapid calls
for i in {1..10}; do
  echo "Request $i:"
  time curl -s http://localhost:3000/api/tokens?limit=5 > /dev/null
done
```

**Outputs**
json ouput are saved [here](./json_outputs/)

**force a cache refresh**
```bash
   curl -X POST http://localhost:3000/api/refresh
```

**run test**
```bash
npm test
```

**test coverage**
```bash
npm test -- --coverage
```

**browser live update(not functional yet)**
```bash
xdg-open demo.html
```


## License
[MIT license](./LICENSE)

## Links

- GitHub Repository: https://github.com/RathoreSurbhi/eterna-backend
- youtube link: https://youtu.be/p3LZrnMel7s?si=KohbgZAFaY1qqyNt
- Postman Collection: `./postman_collection.json`
- Json Outputs: [folder link](./json_outputs/)
