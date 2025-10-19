# Congressional Trading Tracker - Backend

Express.js REST API for tracking congressional and insider stock trades with PostgreSQL database and Redis caching.

## 🏗 Tech Stack

- **Node.js 20+** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe development
- **PostgreSQL** - Relational database
- **Redis** - Caching and session management
- **JWT** - Authentication tokens
- **Financial Modeling Prep API** - Congressional trading data source

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/               # Database models
│   │   ├── User.ts          # User authentication model
│   │   ├── CongressionalMember.ts
│   │   ├── StockTicker.ts
│   │   ├── StockTrade.ts
│   │   ├── UserAlert.ts
│   │   └── UserFollow.ts
│   ├── services/             # Business logic layer
│   │   ├── AuthService.ts   # Authentication (bcrypt, JWT)
│   │   ├── SearchService.ts # Search politicians & stocks
│   │   ├── TradeService.ts  # Trading data with filters
│   │   ├── AlertService.ts  # User alerts management
│   │   ├── FollowService.ts # Follow politicians/stocks
│   │   ├── CongressionalDataService.ts  # FMP API sync
│   │   └── AnalyticsService.ts
│   ├── controllers/          # Request handlers
│   │   ├── AuthController.ts
│   │   ├── SearchController.ts
│   │   ├── TradeController.ts
│   │   └── ...
│   ├── routes/               # Express routes
│   │   ├── auth.ts          # /api/v1/auth
│   │   ├── search.ts        # /api/v1/search
│   │   ├── trades.ts        # /api/v1/trades
│   │   ├── sync.ts          # /api/v1/sync
│   │   └── ...
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── rateLimit.ts     # Rate limiting
│   │   ├── validation.ts    # Input validation
│   │   └── errorHandler.ts  # Error handling
│   ├── clients/              # External API clients
│   │   └── FMPClient.ts     # Financial Modeling Prep API
│   ├── jobs/                 # Background jobs
│   │   └── dailySync.ts     # Daily FMP data sync
│   ├── config/               # Configuration
│   │   ├── database.ts      # PostgreSQL connection pool
│   │   └── redis.ts         # Redis client
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
├── migrations/               # Database migrations
│   └── 001_initial_schema.sql
└── package.json
```

## ✨ Key Features

### 🔒 Authentication & Security
- **JWT tokens** - Secure authentication
- **bcrypt** - Password hashing (10 rounds)
- **Rate limiting** - Subscription-based tiers
- **Input validation** - express-validator
- **Error handling** - Custom error classes

### 🔍 Search
- **Unified search** - Politicians and stocks
- **Type filtering** - Filter by politician/stock
- **Fuzzy matching** - Partial name/symbol matching
- **Pagination** - Limit and offset support

### 📊 Trading Data
- **3,542 trades** - From 2022-2025 (as of last sync)
- **Multi-page sync** - Fetches 10 pages from FMP API (~2,500 trades)
- **Daily sync jobs** - Automated data refresh
- **Filtering** - By date, type, trader, stock, value
- **Sorting** - By date, value, or trader name
- **Pagination** - Efficient offset-based pagination

### 🔔 Alerts & Follows
- **User alerts** - Custom trading alerts
- **Follow politicians** - Track specific members
- **Billing integration** - Pay-per-follow pricing
- **Notification system** - In-app notifications

### 📈 Analytics
- **Portfolio concentration** - Top holdings analysis
- **Trading patterns** - Frequency and volume
- **Market trends** - Sector-based insights
- **Rankings** - Most active traders

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (LTS)
- PostgreSQL 15+
- Redis 7+
- Financial Modeling Prep API key

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
DATABASE_URL=postgresql://postgres:password@localhost:5432/congresstracker
REDIS_URL=redis://localhost:6379
FMP_API_KEY=your_fmp_api_key
JWT_SECRET=your_jwt_secret_minimum_32_characters
NODE_ENV=development

# Run database migrations
psql -U postgres -d congresstracker -f migrations/001_initial_schema.sql

# Start development server
npm run dev
```

Server will be available at **http://localhost:3001**

### Docker

```bash
# Start with Docker Compose (from project root)
docker compose --profile dev up

# Backend will be available at http://localhost:3001
```

## 🔧 Development Commands

```bash
npm run dev          # Start development server (port 3001)
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm test             # Run tests
npm run lint         # Lint code with ESLint
npm run type-check   # TypeScript type checking
```

## 📚 API Endpoints

### Authentication
```bash
POST   /api/v1/auth/register     # User registration
POST   /api/v1/auth/login        # User login
GET    /api/v1/auth/profile      # Get profile (authenticated)
POST   /api/v1/auth/refresh      # Refresh JWT token
```

### Search
```bash
GET    /api/v1/search?q={query}&type={politician|stock|all}
# Returns: { politicians: { items: [], total: N }, stocks: { items: [], total: N } }
```

### Trading Data
```bash
GET    /api/v1/trades              # All trades with filters
GET    /api/v1/trades/recent       # Recent trades (alias for /trades)
GET    /api/v1/trades/:id          # Get trade by ID
GET    /api/v1/trades/trader/:id   # Trades by politician
GET    /api/v1/trades/stock/:symbol # Trades by stock
GET    /api/v1/trades/top-stocks   # Most traded stocks
GET    /api/v1/trades/active-traders # Most active traders
GET    /api/v1/trades/statistics   # Trading statistics

# Query parameters for filtering:
# - traderId, traderType, tickerSymbol, transactionType
# - startDate, endDate, minValue, maxValue
# - limit, offset, sortBy, sortOrder
```

### Politicians & Stocks
```bash
GET    /api/v1/politicians          # List all politicians
GET    /api/v1/politicians/:id      # Get politician by ID
GET    /api/v1/stocks                # List all stocks
GET    /api/v1/stocks/:symbol        # Get stock by symbol
```

### Alerts (Authenticated)
```bash
GET    /api/v1/alerts              # Get user alerts
POST   /api/v1/alerts              # Create alert
PUT    /api/v1/alerts/:id          # Update alert
DELETE /api/v1/alerts/:id          # Delete alert
```

### Follows (Authenticated)
```bash
GET    /api/v1/follows             # Get user follows
POST   /api/v1/follows             # Follow politician/stock
DELETE /api/v1/follows/:id         # Unfollow
```

### Analytics
```bash
GET    /api/v1/analytics/portfolio-concentration/:traderId
GET    /api/v1/analytics/trading-patterns/:traderId?timeframe={day|week|month}
GET    /api/v1/analytics/market-trends?sector={sector}
GET    /api/v1/analytics/rankings?metric={trades|value}
```

### Data Sync (Admin)
```bash
POST   /api/v1/sync/now            # Trigger manual data sync
# Runs dailySync job in background, fetches latest trades from FMP API
```

## 🗄 Database

### Models

**User**
- Authentication and subscription management
- Fields: id, email, passwordHash, subscriptionTier, createdAt

**CongressionalMember**
- Congressional members (House & Senate)
- Fields: id, name, position, stateCode, district, partyAffiliation

**StockTicker**
- Stock information
- Fields: symbol, companyName, sector, industry, marketCap, lastPrice

**StockTrade**
- Trading transactions
- Fields: id, traderId, tickerSymbol, transactionDate, transactionType, estimatedValue

**UserAlert**
- Custom user alerts
- Fields: id, userId, targetType, targetId, conditions, isActive

**UserFollow**
- User follows with billing
- Fields: id, userId, targetType, targetId, billingAmount, isActive

### Connection Pooling

PostgreSQL connection pool configured in `src/config/database.ts`:
```typescript
const pool = new Pool({
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   # 30 seconds
  connectionTimeoutMillis: 2000,
})
```

## 🔄 Data Synchronization

### FMP API Client

**Location:** `src/clients/FMPClient.ts`

Fetches congressional trading data from Financial Modeling Prep API:

```typescript
import { FMPClient } from './clients/FMPClient'

const client = new FMPClient(process.env.FMP_API_KEY!)

// Fetch single page (250 trades)
const trades = await client.getLatestSenateTrades(250, 1)

// Fetch multiple pages
const allTrades = await client.getAllSenateTrades(10, 250) // 10 pages = ~2,500 trades
```

### Daily Sync Job

**Location:** `src/jobs/dailySync.ts`

Automatically runs to fetch latest trading data:

```typescript
import { runDailySync } from './jobs/dailySync'

// Run manual sync
await runDailySync()

// Result: Syncs 10 pages of Senate + House trades
// ~2,500 trades total, stores in PostgreSQL
```

**Current data:**
- 3,542 total trades in database
- Date range: 2022-03-09 to 2025-09-24
- 93 congressional members
- Updated via daily sync

### Manual Sync

Trigger via API endpoint:
```bash
POST http://localhost:3001/api/v1/sync/now

# Response: { success: true, message: "Data sync started in background" }
# Check server logs for progress
```

## 🔐 Authentication

### JWT Implementation

**Token generation:**
```typescript
import jwt from 'jsonwebtoken'

const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
)
```

**Protected routes:**
```typescript
import { authenticate } from './middleware/auth'

router.get('/protected', authenticate, async (req, res) => {
  // req.user is populated with decoded JWT payload
  res.json({ user: req.user })
})
```

## ⚡ Rate Limiting

Subscription-based rate limits configured in `src/middleware/rateLimit.ts`:

```typescript
// Free tier: 100 requests/15min
// Premium tier: 1000 requests/15min
// Enterprise tier: Unlimited

rateLimiters.api       // General API endpoints
rateLimiters.auth      // Authentication endpoints
rateLimiters.data      // Data-heavy endpoints (trades, search)
```

## 🐛 Error Handling

Custom error classes in `src/middleware/errorHandler.ts`:

```typescript
// Usage in controllers
if (!user) {
  throw new NotFoundError('User not found')
}

// Error responses
{
  success: false,
  error: "User not found",
  code: "NOT_FOUND",
  statusCode: 404
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test src/services/AuthService.test.ts

# Run with coverage
npm test -- --coverage
```

## 🚢 Deployment

### Build for Production

```bash
# Build TypeScript
npm run build

# Output in dist/ directory
# Start production server
NODE_ENV=production npm start
```

### Environment Variables (Production)

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
FMP_API_KEY=your_production_key
JWT_SECRET=your_strong_secret_key
NODE_ENV=production
PORT=3001
```

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up

# Set environment variables in Railway dashboard
```

## 📊 Performance

- **Connection pooling** - PostgreSQL max 20 connections
- **Redis caching** - Session and frequently accessed data
- **Indexed queries** - Database indexes on traderId, tickerSymbol, transactionDate
- **Pagination** - Offset-based pagination for large datasets
- **Rate limiting** - Prevents API abuse

## 🔗 Related Documentation

- [Main Project README](../README.md)
- [Frontend Documentation](../frontend/README.md)
- [API Documentation](../docs/api.md)
- [Database Schema](../migrations/001_initial_schema.sql)
- [FMP API Docs](https://financialmodelingprep.com/developer/docs)
