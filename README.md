# Congressional Trading Transparency Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A modern web platform that aggregates and displays real-time stock trading data from congressional members and corporate insiders, providing transparency and democratizing access to "smart money" investment intelligence.

## 📋 Recent Updates

### 2025-10-18 - UI & Data Accuracy Improvements
- **Fixed stock detail page statistics**: Stock pages now show accurate trade counts from database instead of limited subset
- **Removed redundant UI**: Simplified stock detail pages from 3 tabs to 2 by removing duplicate "Stock Details" tab
- **Improved data fetching**: Increased trade fetch limit from 50 to 5000 for complete statistics
- See [SESSION_2025-10-18_FIXES.md](SESSION_2025-10-18_FIXES.md) for technical details

## 🎯 Mission

Democratize access to trading data from politicians and corporate executives, promoting transparency and providing retail investors with insights previously available only to institutional players.

## ✨ Features

### 🔍 **Smart Search**
- Find congressional members by name, state, or party
- Search stocks by ticker symbol or company name
- Unified search across politicians and securities

### 📊 **Trading Intelligence**
- Real-time congressional and insider trading feeds
- Daily data refresh from reliable sources
- Historical trading data (7-year retention)
- Transaction details with estimated values

### 🎯 **Alert System**
- Create alerts for specific politicians
- Stock-specific trading notifications  
- In-app notification delivery
- Custom alert management

### 📈 **Portfolio Analytics**
- Portfolio concentration analysis
- Top holdings visualization
- Sector allocation insights
- Trading pattern recognition

### 💰 **Flexible Pricing**
- **Free Access**: Full platform access including search, trading feeds, alerts, and analytics
- **Premium Follows**: Pay-per-follow pricing for enhanced tracking ($X/month per followed politician)
- No hidden fees or subscription tiers

## 🏗 Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library

### Backend  
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **TypeScript** - End-to-end type safety
- **JWT Authentication** - Secure token-based auth with subscription validation
- **Express-validator** - Comprehensive input validation and sanitization
- **Advanced Middleware** - Rate limiting, error handling, security features

### Database & Caching
- **PostgreSQL** - Primary database for relational data
- **Redis** - Caching and session management

### Data & APIs
- **Financial Modeling Prep API** - Congressional and insider trading data
- **Daily data synchronization** - Automated data pipeline
- **RESTful API design** - Clean, documented endpoints

### Infrastructure & Deployment
- **Vercel** - Frontend deployment and hosting (FREE tier)
- **Render.com** - Backend API hosting (FREE tier)
- **Neon** - PostgreSQL database (FREE tier, 500 MB)
- **Upstash** - Redis cache (FREE tier, 10K commands/day)
- **GitHub Actions** - Automated daily data sync (FREE)
- **Total Cost**: **$0/month** on free tiers!

## 🚀 Getting Started

### 🌐 Production Deployment (100% FREE)

Want to deploy your own instance? We have a **complete guide** for deploying on 100% free tier services:

👉 **[Read the Full Deployment Guide](docs/DEPLOYMENT.md)**

**Quick Summary:**
- **Frontend**: Vercel (FREE - 100 GB bandwidth/month)
- **Backend**: Render.com (FREE - 750 hours/month)
- **Database**: Neon PostgreSQL (FREE - 500 MB)
- **Cache**: Upstash Redis (FREE - 10K commands/day)
- **Estimated time**: 2 hours
- **Total cost**: $0/month

### Quick Start for Local Development

The fastest way to get started locally is using Docker:

```bash
# Clone the repository
git clone https://github.com/yourusername/congresstracker.git
cd congresstracker

# Run the setup script (creates databases, runs migrations, starts services)
./scripts/setup-local.sh

# Or manually with Docker Compose:
docker compose --profile dev up
```

That's it! The application will be available at:
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **Backend API**: http://localhost:3001
- 📊 **API Docs**: http://localhost:3001/api/v1/docs

### Prerequisites

#### Using Docker (Recommended)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Compose)
- 8GB RAM minimum
- 10GB free disk space

#### Manual Installation
- Node.js 20+ (LTS version)
- PostgreSQL 15+
- Redis 7+
- Financial Modeling Prep API key

### Installation Options

#### Option 1: Docker (Recommended)

**Development Mode** (with hot-reload):
```bash
# Start all services in development mode
docker compose --profile dev up

# View logs
docker compose --profile dev logs -f

# Stop services
docker compose --profile dev down
```

**Production Mode** (optimized builds):
```bash
# Build and start production services
docker compose --profile prod up -d

# View logs
docker compose --profile prod logs -f

# Stop services
docker compose --profile prod down
```

**Database Only** (for local development):
```bash
# Start just PostgreSQL and Redis
docker compose up -d postgres redis

# Then run backend/frontend locally
cd backend && npm run dev
cd frontend && npm run dev
```

#### Option 2: Manual Installation

1. **Clone and Setup**
   ```bash
   git clone https://github.com/yourusername/congresstracker.git
   cd congresstracker
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install

   # Create environment file
   cp .env.example .env
   # Edit .env with your credentials

   # Start development server
   npm run dev  # Runs on port 3001
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install

   # Create environment file
   cp .env.local.example .env.local
   # Edit .env.local with API URL

   # Start development server
   npm run dev  # Runs on port 3000
   ```

4. **Database Setup**

   Make sure PostgreSQL and Redis are running, then:
   ```bash
   # Run migrations
   psql -U postgres -d congresstracker -f backend/migrations/001_initial_schema.sql

   # Seed test data
   psql -U postgres -d congresstracker -f backend/seeds/001_test_data.sql
   ```

### Implementation Status

**✅ Completed:**
- Complete database models and relationships
- Authentication & middleware stack (JWT, rate limiting, validation, error handling)
- All service layer implementations (auth, search, trading, alerts, follows, analytics)
- RESTful API controllers and Express routing
- Server infrastructure with graceful shutdown
- Comprehensive test coverage (contract, integration, and component tests)
- Frontend components and pages (SearchBar, TradeFeed, dark mode toggle)
- API integration layer with real-time data
- FMP API integration with multi-page sync (3,542 trades from 2022-2025)
- Daily data synchronization jobs
- Docker deployment setup
- Production-ready builds
- Pagination for historical trades (50 trades/page with Load More)

### Environment Variables

#### Backend (.env)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/congresstracker
REDIS_URL=redis://localhost:6379
FMP_API_KEY=your_financial_modeling_prep_api_key
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
NODE_ENV=development

# Optional: Rate limiting configuration
RATE_LIMIT_WHITELIST=127.0.0.1,::1
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🔧 Development Commands

### Docker Commands
```bash
# Start development environment
docker compose --profile dev up

# Start production environment
docker compose --profile prod up -d

# View logs
docker compose logs -f [service-name]

# Restart a service
docker compose restart [service-name]

# Stop all services
docker compose down

# Clean up (remove volumes and images)
docker compose down -v --rmi all

# Shell access
docker compose exec backend-dev sh
docker compose exec frontend-dev sh
docker compose exec postgres psql -U postgres -d congresstracker
```

### Local Development
```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
npm run type-check   # TypeScript type checking

# Frontend
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
```

### Database Commands
```bash
# Using Docker
docker compose exec postgres psql -U postgres -d congresstracker

# Run migrations
docker compose exec postgres psql -U postgres -d congresstracker -f /docker-entrypoint-initdb.d/migrations/001_initial_schema.sql

# Access Redis
docker compose exec redis redis-cli
```

## 📚 API Documentation

**Full API documentation**: [docs/api.md](./docs/api.md)

The API follows RESTful conventions with comprehensive OpenAPI documentation:

- **API Schema**: [/specs/001-1-executive-summary/contracts/api-schema.yaml](./specs/001-1-executive-summary/contracts/api-schema.yaml)
- **Base URL**: `http://localhost:3001/api/v1` (development)
- **Authentication**: JWT Bearer tokens

### Key Endpoints
```bash
# Server Status
GET /health                           # Health check endpoint
GET /api/v1                          # API information and endpoint listing
GET /api/v1/docs                     # OpenAPI documentation

# Authentication
POST /api/v1/auth/register           # User registration
POST /api/v1/auth/login              # User login
GET  /api/v1/auth/profile            # User profile (authenticated)

# Search
GET /api/v1/search?q={query}&type={politician|stock|all}

# Trading Data
GET /api/v1/trades                   # All trading data with filtering
GET /api/v1/trades/politician/{id}   # Politician-specific trades
GET /api/v1/trades/stock/{symbol}    # Stock-specific trades
GET /api/v1/trades/recent            # Recent trading activity

# User Features (Authenticated)
GET|POST|PUT|DELETE /api/v1/alerts   # Alert management
GET|POST|PUT|DELETE /api/v1/follows  # Follow management with billing

# Analytics
GET /api/v1/analytics/portfolio-concentration/{traderId}
GET /api/v1/analytics/trading-patterns/{traderId}
GET /api/v1/analytics/market-trends
GET /api/v1/analytics/rankings
```

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
- ✅ **Contract Tests**: Complete API endpoint validation (T015-T021)
- ✅ **Integration Tests**: User flows and core functionality (T022-T029) 
- ✅ **Component Tests**: Frontend component testing infrastructure (T030-T033)
- 📋 **E2E Tests**: End-to-end testing with Playwright (planned)
- 📋 **Unit Tests**: Service layer and business logic (in progress)

## 📋 Development Status

### ✅ Phase 1: Planning & Design (Complete)
- [x] Feature specification and requirements
- [x] Technical architecture and research
- [x] Database schema and data modeling
- [x] API contract design
- [x] Testing strategy and quickstart guide

### ✅ Phase 2: Core Infrastructure (Complete)
- [x] **Project Setup & Infrastructure** (T001-T014)
  - [x] Backend/Frontend project structure with TypeScript
  - [x] Database configuration and connection pooling
  - [x] Environment configuration and shared types
- [x] **Test-Driven Development** (T015-T033)
  - [x] API contract tests for all endpoints
  - [x] Integration tests for core user flows
  - [x] Frontend component test infrastructure
- [x] **Database Models** (T034-T040)
  - [x] User authentication and subscription models
  - [x] Congressional member and stock ticker models
  - [x] Trading data with polymorphic relationships
  - [x] Alert and notification system models
- [x] **Authentication & Middleware** (T041-T044)
  - [x] JWT authentication with subscription validation
  - [x] Comprehensive input validation using express-validator
  - [x] Structured error handling with custom error classes
  - [x] Advanced rate limiting with subscription-based tiers

### ✅ Phase 3: Services & API Layer (Complete)
- [x] **Services Layer** (T045-T050)
  - [x] Authentication service with bcrypt password hashing
  - [x] Search service for politicians and stocks
  - [x] Trading data service with filtering and pagination
  - [x] Alert and follow services with billing logic
  - [x] Analytics service for portfolio concentration
- [x] **API Controllers & Routes** (T051-T059)
  - [x] Complete RESTful API controllers for all endpoints
  - [x] Express router with all 6 route modules (auth, search, trades, alerts, follows, analytics)
  - [x] Main Express application with comprehensive middleware stack
  - [x] Server entry point with graceful shutdown capabilities

### ✅ Phase 4: External Integration & Frontend (Complete)
- [x] **FMP API Integration** (T060-T063)
  - [x] Congressional data sync with multi-page fetching (10 pages = ~2,500 trades)
  - [x] Daily data synchronization jobs (dailySync.ts)
  - [x] Real-time data from FMP API (3,542 trades spanning 2022-2025)
- [x] **Frontend Implementation** (T064-T082)
  - [x] Next.js App Router with TypeScript
  - [x] React components (SearchBar with real-time API, TradeFeed with pagination)
  - [x] API client integration (axios with interceptors)
  - [x] Dark mode toggle
  - [x] All main pages (Dashboard, Trades, Politicians, Stocks)

### ✅ Phase 5: Deployment (Complete)
- [x] **Production Deployment** (T088-T101)
  - [x] Docker containerization (dev and prod profiles)
  - [x] Local deployment fully functional
  - [x] PostgreSQL database with Docker volumes
  - [x] Redis caching layer

### 🔮 Future Enhancements
- [ ] **Real-time Features**
  - [ ] Server-sent events for notifications
  - [ ] WebSocket support for live updates
  - [ ] Real-time portfolio analytics with charting
- [ ] **Testing & Quality**
  - [ ] E2E testing with Playwright
  - [ ] Additional unit tests for service layer
- [ ] **Performance & Security**
  - [ ] CDN integration for static assets
  - [ ] Advanced security hardening
  - [ ] Performance monitoring and optimization

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Involved
1. **Fork the repository** and create your feature branch
2. **Follow the coding standards** (TypeScript, ESLint, Prettier)
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Submit a pull request** with clear description

### Development Workflow
1. Check existing issues or create a new one
2. Follow the [Feature Development Guide](./specs/README.md)
3. Use the `.specify/` workflow for new features
4. Ensure all tests pass before submitting PR

### Code Standards
- **TypeScript** for type safety
- **ESLint + Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Test-driven development** where applicable

## 📊 Data Sources

- **Congressional Trading**: Financial Modeling Prep API
- **Stock Information**: Real-time market data via FMP
- **Data Refresh**: Daily synchronization (aligned with disclosure schedules)
- **Historical Data**: 7-year retention for compliance and analysis

## 🔒 Privacy & Security

- **Data Protection**: All user data encrypted in transit and at rest
- **Authentication**: Secure JWT-based authentication with subscription validation
- **API Security**: Advanced rate limiting with subscription tiers, comprehensive input validation
- **Error Handling**: Structured error responses with security-conscious information disclosure
- **Middleware Security**: Request sanitization, SQL injection prevention, XSS protection
- **Compliance**: Adheres to financial data handling best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- **Live Demo**: Coming Soon
- **Documentation**: [/specs](./specs/)
- **API Docs**: [OpenAPI Schema](./specs/001-1-executive-summary/contracts/api-schema.yaml)
- **Roadmap**: [GitHub Issues](https://github.com/yourusername/congresstracker/issues)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/congresstracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/congresstracker/discussions)
- **Email**: support@congresstracker.com

---

**Disclaimer**: This platform aggregates publicly available financial disclosure data. All trading data is sourced from official government filings and regulatory disclosures. This tool is for informational purposes only and should not be considered as financial advice.