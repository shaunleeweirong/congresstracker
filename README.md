# Congressional Trading Transparency Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A modern web platform that aggregates and displays real-time stock trading data from congressional members and corporate insiders, providing transparency and democratizing access to "smart money" investment intelligence.

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

### Database & Caching
- **PostgreSQL** - Primary database for relational data
- **Redis** - Caching and session management

### Data & APIs
- **Financial Modeling Prep API** - Congressional and insider trading data
- **Daily data synchronization** - Automated data pipeline
- **RESTful API design** - Clean, documented endpoints

### Infrastructure
- **Vercel** - Frontend deployment and hosting
- **Railway** - Backend deployment and database hosting
- **Sentry** - Error tracking and performance monitoring

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS version)
- PostgreSQL database
- Redis instance
- Financial Modeling Prep API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/congresstracker.git
   cd congresstracker
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your database URL, Redis URL, FMP API key, JWT secret
   
   # Run database migrations
   npm run db:migrate
   npm run db:seed
   
   # Start development server
   npm run dev  # Runs on port 3001
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Configure environment  
   cp .env.local.example .env.local
   # Edit .env.local with API URL: NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   
   # Start development server
   npm run dev  # Runs on port 3000
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/v1

### Environment Variables

#### Backend (.env)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/congresstracker
REDIS_URL=redis://localhost:6379
FMP_API_KEY=your_financial_modeling_prep_api_key
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 📚 API Documentation

The API follows RESTful conventions with comprehensive OpenAPI documentation:

- **API Schema**: [/specs/001-1-executive-summary/contracts/api-schema.yaml](./specs/001-1-executive-summary/contracts/api-schema.yaml)
- **Base URL**: `http://localhost:3001/api/v1` (development)
- **Authentication**: JWT Bearer tokens

### Key Endpoints
```bash
# Authentication
POST /auth/register
POST /auth/login

# Search
GET /search?q={query}&type={politician|stock|all}

# Trading Data
GET /trades
GET /trades/politician/{id}
GET /trades/stock/{symbol}

# User Features  
GET|POST /alerts
GET|POST /follows
GET /analytics/portfolio-concentration/{traderId}
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
- Unit tests for all business logic
- Integration tests for API endpoints
- Contract tests for external API integration
- End-to-end tests for critical user journeys

## 📋 Development Status

### ✅ Phase 1: Planning & Design (Complete)
- [x] Feature specification and requirements
- [x] Technical architecture and research
- [x] Database schema and data modeling
- [x] API contract design
- [x] Testing strategy and quickstart guide

### 🚧 Phase 2: Core Development (In Progress)
- [ ] Backend API implementation
- [ ] Frontend UI components
- [ ] Database setup and migrations
- [ ] Authentication system
- [ ] FMP API integration

### 📋 Phase 3: Advanced Features (Planned)
- [ ] Real-time notification system
- [ ] Portfolio analytics dashboard
- [ ] Billing and subscription management
- [ ] Performance optimization
- [ ] Production deployment

### 🔮 Phase 4: Enhancements (Future)
- [ ] Corporate insider data integration
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] API rate limiting and caching
- [ ] Admin dashboard

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
- **Authentication**: Secure JWT-based authentication
- **API Security**: Rate limiting and input validation
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