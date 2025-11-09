# Real-time Meme Coin Data Aggregation Service

A high-performance backend service that aggregates real-time meme coin data from multiple DEX sources with efficient caching and WebSocket updates.


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

### Data Flow
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

## Installation

- Node.js 18+
- Redis (local or remote)
- npm or yarn

### Steps

```bash

git clone https://github.com/RathoreSurbhi/eterna-backend.git
cd eterna-backend

npm install

cp .env.example .env

npm run dev

npm run build
npm start
```


## 📄 License
![MIT license](./LICENSE)

## 🔗 Links

- GitHub Repository: https://github.com/RathoreSurbhi/eterna-backend
- Postman Collection: `./postman_collection.json`
