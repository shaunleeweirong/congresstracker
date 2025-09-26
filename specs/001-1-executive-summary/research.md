# Research Report: Congressional Trading Transparency Platform

**Date**: 2025-09-24  
**Phase**: 0 - Technology Research & Best Practices

## Research Areas

### 1. Next.js + TypeScript Web Application Architecture

**Decision**: Next.js 14+ with App Router, TypeScript, Tailwind CSS, shadcn/ui  
**Rationale**: 
- App Router provides modern React patterns with server components
- TypeScript ensures type safety across frontend/backend boundary
- shadcn/ui provides consistent, accessible component library
- Tailwind CSS enables rapid, maintainable styling
- Vercel deployment optimized for Next.js applications

**Alternatives considered**: 
- Create React App: Less features, maintenance mode
- Vite + React: Good alternative but less integrated deployment story
- Remix: Strong alternative but less ecosystem maturity

### 2. Backend API Architecture (Node.js + Express)

**Decision**: Express.js with TypeScript, RESTful API design  
**Rationale**:
- Express.js mature, widely adopted, extensive middleware ecosystem
- TypeScript shared types between frontend/backend
- RESTful patterns well-suited for CRUD operations on trading data
- Railway deployment platform optimized for Node.js apps

**Alternatives considered**:
- Fastify: Better performance but smaller ecosystem
- Next.js API routes: Would couple frontend/backend deployment
- NestJS: Over-engineered for MVP scope

### 3. Database Strategy (PostgreSQL + Redis)

**Decision**: PostgreSQL primary, Redis for caching and session storage  
**Rationale**:
- PostgreSQL excellent for relational trading data, complex queries
- JSON columns support flexible data from FMP API
- Redis ideal for user sessions, API response caching
- Both well-supported on Railway infrastructure

**Alternatives considered**:
- MongoDB: Poor fit for relational trading/user data
- SQLite: Not suitable for multi-tenant production scale
- MySQL: PostgreSQL superior JSON support and features

### 4. Financial Modeling Prep (FMP) API Integration

**Decision**: Axios HTTP client with structured error handling, Redis caching  
**Rationale**:
- FMP provides comprehensive congressional and insider trading data
- Axios mature HTTP client with interceptors for auth/rate limiting
- Daily refresh aligns with FMP data update frequency
- Caching reduces API costs and improves response times

**Key FMP Endpoints Validated**:
- `/stable/senate-latest` - Recent Senate trading activity
- `/stable/house-latest` - Recent House trading activity  
- `/stable/senate-trades?symbol={SYMBOL}` - Stock-specific Senate trades
- `/stable/senate-trades-by-name?name={NAME}` - Politician-specific trades

**Rate Limiting Strategy**: 
- Cache responses for 24 hours (daily refresh requirement)
- Implement exponential backoff for failed requests
- Monitor usage to stay within API quotas

### 5. Authentication & User Management (NextAuth.js)

**Decision**: NextAuth.js v4+ with JWT strategy, database sessions  
**Rationale**:
- NextAuth.js industry standard for Next.js authentication
- Multiple provider support (email, Google, etc.) for user flexibility
- Database sessions enable user tracking for billing
- JWT tokens for stateless API authentication

**Session Storage**: PostgreSQL (user accounts) + Redis (session data)

### 6. Pay-Per-Follow Billing Architecture

**Decision**: Event-driven subscription tracking with PostgreSQL  
**Rationale**:
- Track user "follows" as discrete billable events
- Monthly billing cycle based on active follows
- Audit trail for billing transparency
- Deactivate follows on payment failure

**Billing Flow**:
1. User follows politician/insider → Create subscription record
2. Daily job calculates active follows per user
3. Monthly billing based on follow count
4. Payment failure → Suspend follows, maintain data access

**Alternatives considered**:
- Stripe Subscriptions: Over-complex for simple per-follow pricing
- Usage-based billing APIs: Unnecessary complexity for MVP

### 7. Real-time Notifications (In-App)

**Decision**: Server-Sent Events (SSE) for in-app notifications  
**Rationale**:
- Simpler than WebSockets for one-way notifications
- Browser native support, automatic reconnection
- Scales well with Redis pub/sub for multi-instance deployment

**Implementation**:
- Background job checks for new trades matching user alerts
- Publish notifications to Redis channels
- Frontend SSE endpoint subscribes to user-specific channel

**Alternatives considered**:
- WebSockets: Overkill for one-way notifications
- Push notifications: Requires additional service setup
- Email notifications: User specified in-app preference

### 8. Data Processing & Analytics (Portfolio Concentration)

**Decision**: PostgreSQL materialized views for portfolio concentration analytics  
**Rationale**:
- Materialized views provide fast aggregated queries
- Refresh daily alongside FMP data sync
- Native PostgreSQL aggregation functions for concentration calculations

**Portfolio Concentration Metrics**:
- Top 10 holdings by value per politician/insider
- Sector allocation percentages
- Recent activity trends (30/90 day windows)
- Concentration risk indicators (HHI, Gini coefficient)

### 9. Testing Strategy

**Decision**: Jest + React Testing Library + Playwright E2E  
**Rationale**:
- Jest standard for Node.js/React testing
- React Testing Library promotes accessible component testing
- Playwright reliable cross-browser E2E testing
- Contract testing validates API schemas

**Test Architecture**:
- Unit tests: Individual components, utilities, services
- Integration tests: API endpoints, database operations
- Contract tests: FMP API integration, frontend/backend communication
- E2E tests: Critical user journeys (search, alerts, billing)

### 10. Deployment & Monitoring

**Decision**: Vercel (frontend) + Railway (backend) + Sentry (monitoring)  
**Rationale**:
- Vercel optimized for Next.js with zero-config deployment
- Railway simple PostgreSQL + Redis + Node.js hosting
- Sentry comprehensive error tracking and performance monitoring
- Vercel Analytics for user behavior insights

**CI/CD Pipeline**:
- GitHub Actions for automated testing
- Vercel automatic deployment on push to main
- Railway automatic deployment with health checks
- Database migrations via Railway CLI

## Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| FMP API rate limits | Service degradation | Redis caching, request queuing |
| Database scaling | Performance issues | Connection pooling, query optimization |
| Payment processing | Revenue loss | Stripe integration, retry logic |
| Data accuracy | User trust | FMP API validation, error handling |
| Security vulnerabilities | Data breach | Regular security audits, input validation |

## Implementation Readiness

✅ **All technical decisions resolved**  
✅ **Architecture validated against requirements**  
✅ **Technology stack confirmed**  
✅ **Integration patterns established**  
✅ **Testing strategy defined**

**Next Phase**: Design data models and API contracts