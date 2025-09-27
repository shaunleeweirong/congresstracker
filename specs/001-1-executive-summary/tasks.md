# Tasks: Congressional Trading Transparency Platform MVP

**Input**: Design documents from `/specs/001-1-executive-summary/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js + Express + TypeScript + PostgreSQL + Redis
   → Structure: Web app (backend/ + frontend/ directories)
2. Load design documents:
   → data-model.md: 8 entities → model tasks
   → contracts/: API schema → contract test tasks  
   → quickstart.md: 8 scenarios → integration test tasks
3. Generate tasks by category:
   → Setup: project structure, dependencies, database
   → Tests: contract tests, integration tests (TDD approach)
   → Core: models, services, API endpoints
   → Frontend: Next.js components, pages, authentication
   → Integration: FMP API, real-time features, deployment
4. Apply task rules:
   → Different files = mark [P] for parallel execution
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All file paths are absolute from repository root

## Path Conventions
- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Database**: `backend/migrations/`, `backend/seeds/`
- **Shared**: `shared/types/` (for TypeScript interfaces)

---

## Phase 3.1: Project Setup & Infrastructure

### Backend Setup
- [x] **T001** Create backend project structure at `backend/` with Express + TypeScript + Jest configuration
- [x] **T002** [P] Initialize package.json with dependencies: express, typescript, @types/node, jest, supertest, pg, redis, axios, bcrypt, jsonwebtoken
- [x] **T003** [P] Configure TypeScript (tsconfig.json), ESLint, Prettier for backend at `backend/`
- [x] **T004** [P] Set up environment configuration with dotenv for DATABASE_URL, REDIS_URL, JWT_SECRET, FMP_API_KEY

### Frontend Setup  
- [x] **T005** Create Next.js 14+ project at `frontend/` with TypeScript + Tailwind CSS + shadcn/ui
- [x] **T006** [P] Initialize package.json with dependencies: next, react, typescript, tailwindcss, @shadcn/ui, next-auth, axios
- [x] **T007** [P] Configure TypeScript (tsconfig.json), ESLint, Prettier for frontend at `frontend/`
- [x] **T008** [P] Set up environment configuration (.env.local) with NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET

### Database Setup
- [x] **T009** Create PostgreSQL database schema migrations at `backend/migrations/001_initial_schema.sql`
- [x] **T010** Create database seed data at `backend/seeds/001_test_data.sql` with sample congressional members and trades
- [x] **T011** Set up database connection module at `backend/src/config/database.ts` with connection pooling
- [x] **T012** [P] Set up Redis connection module at `backend/src/config/redis.ts` for caching and sessions

### Shared Types
- [x] **T013** [P] Create shared TypeScript interfaces at `shared/types/api.ts` based on OpenAPI schema
- [x] **T014** [P] Create shared TypeScript interfaces at `shared/types/database.ts` based on data model

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE IMPLEMENTATION

### API Contract Tests
- [x] **T015** [P] Create contract test for `/auth/register` endpoint at `backend/tests/contracts/auth.test.ts`
- [x] **T016** [P] Create contract test for `/auth/login` endpoint at `backend/tests/contracts/auth.test.ts`
- [x] **T017** [P] Create contract test for `/search` endpoint at `backend/tests/contracts/search.test.ts`
- [x] **T018** [P] Create contract test for `/trades` endpoints at `backend/tests/contracts/trades.test.ts`
- [x] **T019** [P] Create contract test for `/alerts` endpoints at `backend/tests/contracts/alerts.test.ts`
- [x] **T020** [P] Create contract test for `/follows` endpoints at `backend/tests/contracts/follows.test.ts`
- [x] **T021** [P] Create contract test for `/analytics/portfolio-concentration` at `backend/tests/contracts/analytics.test.ts`

### Integration Tests (Based on Quickstart Scenarios)
- [x] **T022** [P] Create integration test for user registration & authentication flow at `backend/tests/integration/auth.integration.test.ts`
- [x] **T023** [P] Create integration test for search politicians and stocks at `backend/tests/integration/search.integration.test.ts`
- [x] **T024** [P] Create integration test for trading data with filters at `backend/tests/integration/trades.integration.test.ts`
- [x] **T025** [P] Create integration test for politician-specific trading data at `backend/tests/integration/politician-trades.integration.test.ts`
- [x] **T026** [P] Create integration test for stock-specific trading data at `backend/tests/integration/stock-trades.integration.test.ts`
- [x] **T027** [P] Create integration test for alert creation and management at `backend/tests/integration/alerts.integration.test.ts`
- [x] **T028** [P] Create integration test for follow politicians (billing) at `backend/tests/integration/follows.integration.test.ts`
- [x] **T029** [P] Create integration test for portfolio concentration analytics at `backend/tests/integration/analytics.integration.test.ts`

### Frontend Component Tests
- [x] **T030** [P] Create component tests for authentication forms at `frontend/tests/components/auth.test.tsx`
- [x] **T031** [P] Create component tests for search functionality at `frontend/tests/components/search.test.tsx`
- [x] **T032** [P] Create component tests for trading data display at `frontend/tests/components/trades.test.tsx`
- [x] **T033** [P] Create component tests for alert management at `frontend/tests/components/alerts.test.tsx`

---

## Phase 3.3: Core Backend Implementation

### Database Models
- [ ] **T034** [P] Implement User model at `backend/src/models/User.ts` with authentication methods
- [ ] **T035** [P] Implement CongressionalMember model at `backend/src/models/CongressionalMember.ts`
- [ ] **T036** [P] Implement StockTicker model at `backend/src/models/StockTicker.ts`
- [ ] **T037** [P] Implement StockTrade model at `backend/src/models/StockTrade.ts` with polymorphic trader relationships
- [ ] **T038** [P] Implement UserAlert model at `backend/src/models/UserAlert.ts` with polymorphic alert types
- [ ] **T039** [P] Implement UserFollow model at `backend/src/models/UserFollow.ts` for billing tracking
- [ ] **T040** [P] Implement AlertNotification model at `backend/src/models/AlertNotification.ts`

### Authentication & Middleware
- [ ] **T041** Create authentication middleware at `backend/src/middleware/auth.ts` with JWT verification
- [ ] **T042** Create input validation middleware at `backend/src/middleware/validation.ts` using express-validator
- [ ] **T043** Create error handling middleware at `backend/src/middleware/errors.ts` with structured error responses
- [ ] **T044** Create rate limiting middleware at `backend/src/middleware/rateLimit.ts` for API protection

### Services Layer
- [ ] **T045** [P] Implement AuthService at `backend/src/services/AuthService.ts` with bcrypt password hashing
- [ ] **T046** [P] Implement SearchService at `backend/src/services/SearchService.ts` with politician and stock search
- [ ] **T047** [P] Implement TradeService at `backend/src/services/TradeService.ts` with filtering and pagination
- [ ] **T048** [P] Implement AlertService at `backend/src/services/AlertService.ts` with notification triggering
- [ ] **T049** [P] Implement FollowService at `backend/src/services/FollowService.ts` with billing logic
- [ ] **T050** [P] Implement AnalyticsService at `backend/src/services/AnalyticsService.ts` for portfolio concentration

### API Controllers
- [ ] **T051** Implement AuthController at `backend/src/controllers/AuthController.ts` with register/login endpoints
- [ ] **T052** Implement SearchController at `backend/src/controllers/SearchController.ts` with unified search endpoint
- [ ] **T053** Implement TradeController at `backend/src/controllers/TradeController.ts` with all trade endpoints
- [ ] **T054** Implement AlertController at `backend/src/controllers/AlertController.ts` with CRUD operations
- [ ] **T055** Implement FollowController at `backend/src/controllers/FollowController.ts` with billing integration
- [ ] **T056** Implement AnalyticsController at `backend/src/controllers/AnalyticsController.ts` with concentration analytics

### API Routes
- [ ] **T057** Set up Express router and routes at `backend/src/routes/index.ts` connecting all controllers
- [ ] **T058** Create main Express application at `backend/src/app.ts` with middleware and error handling
- [ ] **T059** Create server entry point at `backend/src/server.ts` with graceful shutdown

---

## Phase 3.4: External API Integration

### Financial Modeling Prep Integration
- [ ] **T060** [P] Create FMP API client at `backend/src/services/FMPClient.ts` with axios and rate limiting
- [ ] **T061** [P] Implement congressional data sync at `backend/src/services/CongressionalDataService.ts` using FMP endpoints
- [ ] **T062** [P] Create data synchronization job at `backend/src/jobs/syncTradingData.ts` for daily updates
- [ ] **T063** [P] Implement caching layer at `backend/src/services/CacheService.ts` using Redis for FMP responses

---

## Phase 3.5: Frontend Implementation

### Authentication & Layout
- [ ] **T064** Create authentication context at `frontend/src/contexts/AuthContext.tsx` using NextAuth.js
- [ ] **T065** Implement login page at `frontend/src/app/login/page.tsx` with form validation
- [ ] **T066** Implement registration page at `frontend/src/app/register/page.tsx` with form validation
- [ ] **T067** Create main layout component at `frontend/src/components/layout/Layout.tsx` with navigation
- [ ] **T068** Create protected route wrapper at `frontend/src/components/auth/ProtectedRoute.tsx`

### Core Components
- [ ] **T069** [P] Create search component at `frontend/src/components/search/SearchBar.tsx` with real-time suggestions
- [ ] **T070** [P] Create trading feed component at `frontend/src/components/trades/TradeFeed.tsx` with filtering
- [ ] **T071** [P] Create politician profile component at `frontend/src/components/politicians/PoliticianProfile.tsx`
- [ ] **T072** [P] Create stock profile component at `frontend/src/components/stocks/StockProfile.tsx`
- [ ] **T073** [P] Create alert management component at `frontend/src/components/alerts/AlertManager.tsx`
- [ ] **T074** [P] Create follow management component at `frontend/src/components/follows/FollowManager.tsx`

### Pages
- [ ] **T075** Create dashboard page at `frontend/src/app/page.tsx` with recent trades and search
- [ ] **T076** Create politician detail page at `frontend/src/app/politician/[id]/page.tsx` with trade history
- [ ] **T077** Create stock detail page at `frontend/src/app/stock/[symbol]/page.tsx` with all trader activity
- [ ] **T078** Create alerts page at `frontend/src/app/alerts/page.tsx` with management interface
- [ ] **T079** Create follows page at `frontend/src/app/follows/page.tsx` with billing information

### API Integration
- [ ] **T080** Create API client at `frontend/src/lib/api.ts` with axios and authentication headers
- [ ] **T081** Create React hooks for data fetching at `frontend/src/hooks/useApi.ts` with SWR or React Query
- [ ] **T082** Implement error boundary at `frontend/src/components/ErrorBoundary.tsx` for error handling

---

## Phase 3.6: Advanced Features

### Real-time Notifications
- [ ] **T083** [P] Implement Server-Sent Events at `backend/src/services/NotificationService.ts` for real-time alerts
- [ ] **T084** [P] Create notification component at `frontend/src/components/notifications/NotificationDropdown.tsx`
- [ ] **T085** [P] Implement alert checking job at `backend/src/jobs/checkAlerts.ts` for triggering notifications

### Analytics & Reporting
- [ ] **T086** [P] Create portfolio concentration charts at `frontend/src/components/analytics/PortfolioChart.tsx` using Chart.js
- [ ] **T087** [P] Implement advanced filtering at `frontend/src/components/filters/AdvancedFilters.tsx`

---

## Phase 3.7: Testing & Quality Assurance

### End-to-End Testing
- [ ] **T088** [P] Set up Playwright configuration at `frontend/playwright.config.ts` for E2E testing
- [ ] **T089** [P] Create E2E test for complete user registration and login flow at `frontend/tests/e2e/auth.spec.ts`
- [ ] **T090** [P] Create E2E test for search and view trading data flow at `frontend/tests/e2e/trading-data.spec.ts`
- [ ] **T091** [P] Create E2E test for alert creation and notification flow at `frontend/tests/e2e/alerts.spec.ts`

### Performance & Security
- [ ] **T092** [P] Implement input sanitization and SQL injection prevention in all controllers
- [ ] **T093** [P] Add API response caching with appropriate cache headers
- [ ] **T094** [P] Implement database query optimization and indexing verification

---

## Phase 3.8: Local Deployment & Documentation

### Docker & Local Setup
- [ ] **T095** Create docker-compose.yml at repository root with PostgreSQL, Redis, backend, and frontend services
- [ ] **T096** Create Dockerfile for backend at `backend/Dockerfile` with multi-stage build
- [ ] **T097** Create Dockerfile for frontend at `frontend/Dockerfile` with Next.js optimization
- [ ] **T098** Create setup script at `scripts/setup-local.sh` for one-command local deployment

### Documentation & Polish
- [ ] **T099** [P] Create API documentation at `docs/api.md` based on implemented endpoints
- [ ] **T100** [P] Update README.md with local setup instructions and testing guide
- [ ] **T101** [P] Create development guide at `docs/development.md` with coding standards and workflow

---

## Parallel Execution Examples

### Example 1: Setup Phase (T002, T003, T006, T007 can run together)
```bash
# Terminal 1: Backend dependencies
cd backend && npm init && npm install express typescript @types/node jest supertest

# Terminal 2: Backend tooling  
cd backend && npm install -D eslint prettier @types/jest

# Terminal 3: Frontend dependencies
cd frontend && npx create-next-app@latest . --typescript --tailwind --app

# Terminal 4: Frontend tooling
cd frontend && npm install next-auth axios @shadcn/ui
```

### Example 2: Model Creation (T034-T040 can run in parallel)
```bash
# Different developers can work on different models simultaneously
# T034: backend/src/models/User.ts
# T035: backend/src/models/CongressionalMember.ts  
# T036: backend/src/models/StockTicker.ts
# T037: backend/src/models/StockTrade.ts
# T038: backend/src/models/UserAlert.ts
# T039: backend/src/models/UserFollow.ts
# T040: backend/src/models/AlertNotification.ts
```

### Example 3: Frontend Components (T069-T074 can run in parallel)
```bash
# Multiple developers can work on different components
# T069: frontend/src/components/search/SearchBar.tsx
# T070: frontend/src/components/trades/TradeFeed.tsx
# T071: frontend/src/components/politicians/PoliticianProfile.tsx
# T072: frontend/src/components/stocks/StockProfile.tsx
# T073: frontend/src/components/alerts/AlertManager.tsx
# T074: frontend/src/components/follows/FollowManager.tsx
```

## Dependencies & Critical Path

### Critical Dependencies:
1. **T001-T014** (Setup) must complete before any implementation
2. **T015-T033** (Tests) must complete before corresponding implementation tasks
3. **T009-T012** (Database) must complete before any model/service work
4. **T034-T040** (Models) must complete before services (T045-T050)
5. **T045-T050** (Services) must complete before controllers (T051-T056)
6. **T064** (Auth Context) must complete before any protected pages

### Estimated Timeline:
- **Setup (T001-T014)**: 1-2 days
- **Tests (T015-T033)**: 2-3 days  
- **Backend Core (T034-T059)**: 4-5 days
- **Frontend Core (T064-T082)**: 3-4 days
- **Integration & Polish (T083-T101)**: 2-3 days

**Total MVP Development Time**: 12-17 days with parallel execution

---

## Success Criteria

✅ **MVP Complete When:**
1. All contract tests pass (T015-T021)
2. All integration tests pass (T022-T029)
3. User can register, login, and access protected features
4. Search functionality works for politicians and stocks
5. Trading data displays with filtering capabilities
6. Alert system creates and manages user alerts
7. Following system tracks billing relationships
8. Portfolio concentration analytics display correctly
9. Local deployment works via docker-compose
10. All E2E tests pass (T089-T091)

**Next Phase**: Production deployment, advanced analytics, mobile responsiveness