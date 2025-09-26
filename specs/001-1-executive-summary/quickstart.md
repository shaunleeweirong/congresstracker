# Quickstart Guide: Congressional Trading Transparency Platform

**Purpose**: Validate core user scenarios through end-to-end testing  
**Target**: Both manual testing and automated test scenarios  
**Phase**: 1 - Contract Validation

## Prerequisites

### Development Environment
```bash
# Backend setup
cd backend
npm install
cp .env.example .env
# Configure: DATABASE_URL, REDIS_URL, FMP_API_KEY, JWT_SECRET
npm run db:migrate
npm run db:seed
npm run dev # Port 3001

# Frontend setup (new terminal)
cd frontend  
npm install
cp .env.local.example .env.local
# Configure: NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
npm run dev # Port 3000
```

### Test Data
```sql
-- Insert test congressional members
INSERT INTO congressional_members (id, name, position, state_code, district, party_affiliation) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'Nancy Pelosi', 'representative', 'CA', 5, 'democratic'),
('123e4567-e89b-12d3-a456-426614174001', 'Ted Cruz', 'senator', 'TX', NULL, 'republican'),
('123e4567-e89b-12d3-a456-426614174002', 'Alexandria Ocasio-Cortez', 'representative', 'NY', 14, 'democratic');

-- Insert test stock tickers
INSERT INTO stock_tickers (symbol, company_name, sector, last_price) VALUES 
('AAPL', 'Apple Inc.', 'Technology', 150.00),
('TSLA', 'Tesla Inc.', 'Consumer Discretionary', 250.00),
('AMZN', 'Amazon.com Inc.', 'Consumer Discretionary', 3200.00);

-- Insert test trades
INSERT INTO stock_trades (trader_type, trader_id, ticker_symbol, transaction_date, transaction_type, amount_range, estimated_value) VALUES
('congressional', '123e4567-e89b-12d3-a456-426614174000', 'AAPL', '2025-09-20', 'buy', '$15,001 - $50,000', 32500.00),
('congressional', '123e4567-e89b-12d3-a456-426614174001', 'TSLA', '2025-09-22', 'sell', '$1,001 - $15,000', 8000.00),
('congressional', '123e4567-e89b-12d3-a456-426614174002', 'AMZN', '2025-09-23', 'buy', '$1,001 - $15,000', 8000.00);
```

## Core User Journey Tests

### 1. User Registration & Authentication

**Scenario**: New user creates account and logs in  
**Expected Result**: User can access protected platform features

#### Manual Test Steps
1. **Navigate to Registration**
   - Open http://localhost:3000/register
   - Fill form: email, password, name
   - Submit registration
   - ✅ **PASS**: User created, redirected to dashboard

2. **Login Validation**
   - Navigate to http://localhost:3000/login
   - Enter registered credentials
   - ✅ **PASS**: JWT token received, user authenticated

#### API Contract Test
```bash
# Registration
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Expected Response: 201 Created
# {
#   "user": { "id": "...", "email": "test@example.com", "name": "Test User" },
#   "token": "eyJ..."
# }

# Login  
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com", 
    "password": "password123"
  }'

# Expected Response: 200 OK with same structure
```

### 2. Search Politicians and Stocks

**Scenario**: User searches for specific politician by name  
**Expected Result**: Relevant politician appears in search results

#### Manual Test Steps
1. **Search Politician**
   - Navigate to dashboard search box
   - Type "Nancy Pelosi"
   - ✅ **PASS**: Nancy Pelosi appears in dropdown results

2. **Search Stock**
   - Clear search, type "AAPL"
   - ✅ **PASS**: Apple Inc. appears in stock results

3. **View Politician Profile**
   - Click on Nancy Pelosi from search results
   - ✅ **PASS**: Profile page shows recent trades, party affiliation, district

#### API Contract Test  
```bash
# Get auth token from login response above
TOKEN="eyJ..."

# Search for politician
curl -X GET "http://localhost:3001/api/v1/search?q=Nancy%20Pelosi&type=politician" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response: 200 OK
# {
#   "politicians": [
#     {
#       "id": "123e4567-e89b-12d3-a456-426614174000",
#       "name": "Nancy Pelosi",
#       "position": "representative",
#       "stateCode": "CA",
#       "district": 5,
#       "partyAffiliation": "democratic"
#     }
#   ],
#   "stocks": []
# }

# Search for stock
curl -X GET "http://localhost:3001/api/v1/search?q=AAPL&type=stock" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response: 200 OK with Apple stock data
```

### 3. View Trading Data with Filters

**Scenario**: User views chronological feed of trading data with filters applied  
**Expected Result**: Trades display correctly with functional filtering

#### Manual Test Steps
1. **View Recent Trades Feed**
   - Navigate to main trades page
   - ✅ **PASS**: Shows chronological list of recent trades with trader names, stocks, dates, values

2. **Apply Date Filter**
   - Set date range to last 7 days
   - Click apply filter
   - ✅ **PASS**: Results update to show only trades within date range

3. **Apply Transaction Type Filter**
   - Select "Buy" transactions only
   - ✅ **PASS**: Results show only buy transactions

#### API Contract Test
```bash
# Get all recent trades
curl -X GET "http://localhost:3001/api/v1/trades?limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response: 200 OK
# {
#   "data": [
#     {
#       "id": "...",
#       "traderType": "congressional", 
#       "tickerSymbol": "AAPL",
#       "transactionDate": "2025-09-20",
#       "transactionType": "buy",
#       "estimatedValue": 32500.00,
#       "trader": { "name": "Nancy Pelosi", ... },
#       "stock": { "symbol": "AAPL", "companyName": "Apple Inc.", ... }
#     }
#   ],
#   "pagination": { "page": 1, "total": 3, ... }
# }

# Filter by transaction type
curl -X GET "http://localhost:3001/api/v1/trades?transactionType=buy&startDate=2025-09-20" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. View Politician-Specific Trading Data  

**Scenario**: User clicks on specific politician to see all their trading activity  
**Expected Result**: Politician-specific page shows comprehensive trading history

#### Manual Test Steps
1. **Navigate to Politician Page**
   - From search results, click Nancy Pelosi
   - ✅ **PASS**: Dedicated page loads with politician info and trade history

2. **View Trade Details**  
   - Examine individual trade entries
   - ✅ **PASS**: Each trade shows stock ticker, company name, transaction type, estimated value, date

#### API Contract Test
```bash
# Get trades for specific politician
curl -X GET "http://localhost:3001/api/v1/trades/politician/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response: 200 OK with politician's trades
```

### 5. View Stock-Specific Trading Data

**Scenario**: User clicks on stock ticker to see all congressional/insider activity for that stock  
**Expected Result**: Stock-specific page shows all trades across politicians

#### Manual Test Steps  
1. **Navigate to Stock Page**
   - From trades feed, click on AAPL ticker
   - ✅ **PASS**: Stock page shows all AAPL trades from different politicians

2. **Verify Cross-Politician Data**
   - Check that multiple politicians' AAPL trades appear
   - ✅ **PASS**: Trades from different sources aggregated correctly

#### API Contract Test
```bash
# Get all trades for specific stock
curl -X GET "http://localhost:3001/api/v1/trades/stock/AAPL" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response: 200 OK with all AAPL trades across politicians
```

### 6. Create and Manage Alerts

**Scenario**: User creates alert for specific politician and receives notification when new trade occurs  
**Expected Result**: Alert system functions correctly with in-app notifications

#### Manual Test Steps
1. **Create Politician Alert**
   - Navigate to Nancy Pelosi's profile  
   - Click "Create Alert" button
   - ✅ **PASS**: Alert created successfully, appears in user's alert list

2. **Test Notification Delivery**
   - Simulate new trade for Nancy Pelosi (via admin interface or API)
   - Check in-app notifications
   - ✅ **PASS**: New notification appears in notification dropdown

#### API Contract Test
```bash
# Create alert for politician
curl -X POST http://localhost:3001/api/v1/alerts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "politician",
    "politicianId": "123e4567-e89b-12d3-a456-426614174000"
  }'

# Expected Response: 201 Created
# {
#   "id": "...",
#   "alertType": "politician", 
#   "politicianId": "123e4567-e89b-12d3-a456-426614174000",
#   "alertStatus": "active",
#   "createdAt": "..."
# }

# Get user's alerts
curl -X GET http://localhost:3001/api/v1/alerts \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Follow Politicians (Billing Feature)

**Scenario**: User follows politician to get detailed tracking, triggering billing  
**Expected Result**: Follow relationship created, billing status tracked

#### Manual Test Steps
1. **Follow Politician**
   - On Nancy Pelosi's profile, click "Follow" button
   - ✅ **PASS**: Follow button changes to "Following", user charged for this follow

2. **View Follow List** 
   - Navigate to account/follows page
   - ✅ **PASS**: Nancy Pelosi appears in followed politicians list with billing status

3. **Unfollow Politician**
   - Click "Unfollow" button on follows page
   - ✅ **PASS**: Follow removed, billing will stop next cycle

#### API Contract Test
```bash
# Follow politician
curl -X POST http://localhost:3001/api/v1/follows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "traderType": "congressional",
    "traderId": "123e4567-e89b-12d3-a456-426614174000"
  }'

# Expected Response: 201 Created
# {
#   "id": "...",
#   "traderType": "congressional",
#   "traderId": "123e4567-e89b-12d3-a456-426614174000", 
#   "billingStatus": "active",
#   "followedAt": "..."
# }

# Get user's follows
curl -X GET http://localhost:3001/api/v1/follows \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Portfolio Concentration Analytics

**Scenario**: User views portfolio concentration analytics for followed politician  
**Expected Result**: Analytics show top holdings and concentration percentages

#### Manual Test Steps
1. **View Portfolio Analytics**
   - Navigate to followed politician's detailed view
   - Click "Portfolio Analytics" tab
   - ✅ **PASS**: Shows top 10 holdings with percentages, concentration metrics

2. **Verify Calculation Accuracy**
   - Check that percentages add up correctly
   - Verify sorting by position size
   - ✅ **PASS**: Mathematical calculations are accurate

#### API Contract Test
```bash
# Get portfolio concentration for politician
curl -X GET "http://localhost:3001/api/v1/analytics/portfolio-concentration/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response: 200 OK
# {
#   "traderId": "123e4567-e89b-12d3-a456-426614174000",
#   "traderType": "congressional", 
#   "holdings": [
#     {
#       "tickerSymbol": "AAPL",
#       "companyName": "Apple Inc.",
#       "netPositionValue": 32500.00,
#       "positionPercentage": 100.0,
#       "transactionCount": 1,
#       "latestTransaction": "2025-09-20"
#     }
#   ]
# }
```

## Performance & Scale Tests

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Test API under load (create artillery.yml config)
artillery run load-test.yml

# Target: API should handle 100 concurrent users
# Success criteria: < 500ms p95 response time, < 1% error rate
```

### Data Volume Testing
```sql
-- Generate larger test dataset
INSERT INTO stock_trades (trader_type, trader_id, ticker_symbol, transaction_date, transaction_type, estimated_value)
SELECT 
  'congressional',
  (SELECT id FROM congressional_members ORDER BY RANDOM() LIMIT 1),
  (SELECT symbol FROM stock_tickers ORDER BY RANDOM() LIMIT 1), 
  CURRENT_DATE - (RANDOM() * 365)::integer,
  (ARRAY['buy', 'sell'])[FLOOR(RANDOM() * 2) + 1]::transaction_type,
  (RANDOM() * 100000 + 1000)::decimal
FROM generate_series(1, 10000);

-- Test query performance with larger dataset
EXPLAIN ANALYZE SELECT * FROM stock_trades 
WHERE trader_id = '123e4567-e89b-12d3-a456-426614174000' 
ORDER BY transaction_date DESC 
LIMIT 20;

-- Success criteria: < 50ms query time with 10k+ records
```

## Success Criteria Summary

**✅ All tests must pass for Phase 1 completion:**

1. **Authentication**: User registration and login work correctly
2. **Search**: Politicians and stocks are discoverable via search
3. **Trade Display**: Trading data displays in chronological feeds with accurate filtering
4. **Politician Pages**: Individual politician pages show comprehensive trade history  
5. **Stock Pages**: Stock-specific pages aggregate trades across politicians
6. **Alerts**: Alert creation and notification delivery function correctly
7. **Follows**: Follow/unfollow functionality works with billing tracking
8. **Analytics**: Portfolio concentration calculations are accurate
9. **Performance**: API responses under 500ms, handles 100+ concurrent users
10. **Data Integrity**: All database constraints enforced, no data corruption

**Next Phase**: Execute these tests, validate all contracts, then proceed to task generation in Phase 2.

## Automated Test Implementation

The above scenarios should be converted to automated tests using:
- **Backend**: Jest + Supertest for API contract testing  
- **Frontend**: React Testing Library + Jest for component testing
- **E2E**: Playwright for full user journey testing
- **Load**: Artillery for performance validation

Each manual test step above represents a test case that should be automated before moving to implementation phase.