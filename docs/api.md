# Congressional Trading Transparency Platform API Documentation

Version: 1.0.0
Base URL: `http://localhost:3001/api/v1` (Development)
Production URL: `https://api.congresstracker.com/v1`

## Table of Contents

- [Authentication](#authentication)
- [Server Information](#server-information)
- [Authentication Endpoints](#authentication-endpoints)
- [Search Endpoints](#search-endpoints)
- [Trading Data Endpoints](#trading-data-endpoints)
- [Alert Endpoints](#alert-endpoints)
- [Follow Endpoints](#follow-endpoints)
- [Analytics Endpoints](#analytics-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Authentication

This API uses JWT (JSON Web Token) based authentication. Include the JWT token in the `Authorization` header for protected endpoints:

```http
Authorization: Bearer <your_jwt_token>
```

### Token Expiration
- Access tokens expire after 24 hours
- Refresh tokens (if implemented) expire after 7 days

## Server Information

### Health Check
Check the server status and uptime.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development"
}
```

### API Information
Get information about available API endpoints.

```http
GET /api/v1
```

**Response:**
```json
{
  "message": "Congressional Trading Transparency Platform API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/v1/auth",
    "search": "/api/v1/search",
    "trades": "/api/v1/trades",
    "alerts": "/api/v1/alerts",
    "follows": "/api/v1/follows",
    "analytics": "/api/v1/analytics"
  }
}
```

## Authentication Endpoints

### Register
Create a new user account.

```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "subscriptionStatus": "active",
      "createdAt": "2025-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules:**
- Email must be valid format
- Password minimum 8 characters
- Name required

### Login
Authenticate an existing user.

```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "subscriptionStatus": "active",
      "lastLoginAt": "2025-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Profile
Get the authenticated user's profile.

```http
GET /api/v1/auth/profile
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscriptionStatus": "active",
    "createdAt": "2025-01-15T10:30:00Z",
    "lastLoginAt": "2025-01-15T10:30:00Z"
  }
}
```

## Search Endpoints

### Universal Search
Search for politicians, stocks, or both.

```http
GET /api/v1/search?q={query}&type={type}&limit={limit}
```

**Query Parameters:**
- `q` (required): Search query string
- `type` (optional): Search type - `politician`, `stock`, or `all` (default: `all`)
- `limit` (optional): Maximum results (default: 10, max: 50)

**Example:**
```http
GET /api/v1/search?q=pelosi&type=politician&limit=5
```

**Response (200 OK):**
```json
{
  "data": {
    "politicians": [
      {
        "id": "uuid",
        "name": "Nancy Pelosi",
        "position": "representative",
        "stateCode": "CA",
        "district": 12,
        "partyAffiliation": "democratic"
      }
    ],
    "stocks": []
  }
}
```

## Trading Data Endpoints

### Get All Trades
Retrieve trading data with optional filters.

```http
GET /api/v1/trades?startDate={date}&endDate={date}&transactionType={type}&minValue={min}&maxValue={max}&page={page}&limit={limit}
```

**Query Parameters:**
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `transactionType` (optional): `buy`, `sell`, or `exchange`
- `minValue` (optional): Minimum estimated value
- `maxValue` (optional): Maximum estimated value
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "traderType": "congressional",
      "traderId": "uuid",
      "tickerSymbol": "AAPL",
      "transactionDate": "2025-01-15",
      "transactionType": "buy",
      "amountRange": "$1,001 - $15,000",
      "estimatedValue": 8000,
      "trader": {
        "id": "uuid",
        "name": "Nancy Pelosi",
        "position": "representative",
        "stateCode": "CA",
        "partyAffiliation": "democratic"
      },
      "stock": {
        "symbol": "AAPL",
        "companyName": "Apple Inc.",
        "sector": "Technology",
        "lastPrice": 195.50
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1247,
    "pages": 63
  }
}
```

### Get Recent Trades
Get the most recent trading activity.

```http
GET /api/v1/trades/recent?limit={limit}
```

**Query Parameters:**
- `limit` (optional): Number of trades (default: 10, max: 50)

**Response:** Same format as Get All Trades, but without pagination.

### Get Politician Trades
Get all trades for a specific politician.

```http
GET /api/v1/trades/politician/{politicianId}?startDate={date}&endDate={date}&page={page}&limit={limit}
```

**Path Parameters:**
- `politicianId` (required): UUID of the politician

**Query Parameters:** Same as Get All Trades

**Response:** Same format as Get All Trades

### Get Stock Trades
Get all trades for a specific stock ticker.

```http
GET /api/v1/trades/stock/{symbol}?startDate={date}&endDate={date}&page={page}&limit={limit}
```

**Path Parameters:**
- `symbol` (required): Stock ticker symbol (e.g., AAPL, MSFT)

**Query Parameters:** Same as Get All Trades

**Response:** Same format as Get All Trades

## Alert Endpoints

All alert endpoints require authentication.

### Get User Alerts
Retrieve all alerts for the authenticated user.

```http
GET /api/v1/alerts?page={page}&limit={limit}&status={status}
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `status` (optional): Filter by status - `active`, `paused`, `deleted`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "alertType": "politician",
      "alertStatus": "active",
      "politicianId": "uuid",
      "tickerSymbol": null,
      "createdAt": "2025-01-15T10:30:00Z",
      "lastTriggeredAt": "2025-01-16T08:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

### Create Alert
Create a new trading alert.

```http
POST /api/v1/alerts
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "alertType": "politician",
  "politicianId": "uuid"
}
```

**Alert Types:**
- `politician`: Alert for specific politician's trades (requires `politicianId`)
- `stock`: Alert for specific stock trades (requires `tickerSymbol`)
- `pattern`: Alert based on custom patterns (requires `patternConfig`)

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "alertType": "politician",
    "alertStatus": "active",
    "politicianId": "uuid",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Update Alert
Update an existing alert's status.

```http
PUT /api/v1/alerts/{alertId}
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "alertStatus": "paused"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "uuid",
    "alertStatus": "paused",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

### Delete Alert
Delete an alert.

```http
DELETE /api/v1/alerts/{alertId}
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (204 No Content)**

## Follow Endpoints

All follow endpoints require authentication and may incur billing.

### Get Followed Politicians
Get all politicians the user is following.

```http
GET /api/v1/follows?page={page}&limit={limit}&status={status}
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `status` (optional): Filter by billing status - `active`, `suspended`, `cancelled`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "traderType": "congressional",
      "traderId": "uuid",
      "followedAt": "2025-01-15T10:30:00Z",
      "billingStatus": "active",
      "trader": {
        "id": "uuid",
        "name": "Nancy Pelosi",
        "position": "representative",
        "stateCode": "CA",
        "partyAffiliation": "democratic"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  }
}
```

### Follow Politician
Follow a politician (premium feature - billing applies).

```http
POST /api/v1/follows
```

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "traderType": "congressional",
  "traderId": "uuid"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "traderType": "congressional",
    "traderId": "uuid",
    "followedAt": "2025-01-15T10:30:00Z",
    "billingStatus": "active"
  }
}
```

### Unfollow Politician
Stop following a politician.

```http
DELETE /api/v1/follows/{followId}
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (204 No Content)**

## Analytics Endpoints

### Portfolio Concentration
Get portfolio concentration data for a trader.

```http
GET /api/v1/analytics/portfolio-concentration/{traderId}
```

**Path Parameters:**
- `traderId` (required): UUID of the trader (politician or insider)

**Response (200 OK):**
```json
{
  "data": {
    "traderId": "uuid",
    "traderType": "congressional",
    "holdings": [
      {
        "tickerSymbol": "AAPL",
        "companyName": "Apple Inc.",
        "netPositionValue": 150000,
        "positionPercentage": 35.5,
        "transactionCount": 12,
        "latestTransaction": "2025-01-15"
      },
      {
        "tickerSymbol": "MSFT",
        "companyName": "Microsoft Corp.",
        "netPositionValue": 120000,
        "positionPercentage": 28.4,
        "transactionCount": 8,
        "latestTransaction": "2025-01-14"
      }
    ]
  }
}
```

### Trading Patterns
Get trading pattern analysis for a trader.

```http
GET /api/v1/analytics/trading-patterns/{traderId}?timeframe={timeframe}
```

**Path Parameters:**
- `traderId` (required): UUID of the trader

**Query Parameters:**
- `timeframe` (optional): `1m`, `3m`, `6m`, `1y` (default: `6m`)

**Response (200 OK):** Pattern analysis data

### Market Trends
Get overall market trends from congressional trading.

```http
GET /api/v1/analytics/market-trends?timeframe={timeframe}&sector={sector}
```

**Query Parameters:**
- `timeframe` (optional): `1m`, `3m`, `6m`, `1y` (default: `1m`)
- `sector` (optional): Filter by sector (e.g., Technology, Healthcare)

**Response (200 OK):** Market trends data

### Rankings
Get ranked lists of most active traders or stocks.

```http
GET /api/v1/analytics/rankings?metric={metric}&limit={limit}
```

**Query Parameters:**
- `metric` (required): `volume`, `frequency`, `value`
- `limit` (optional): Number of results (default: 10, max: 50)

**Response (200 OK):** Ranked list data

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details if applicable
  }
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content to return
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Codes

- `AUTH_REQUIRED`: Authentication token missing or invalid
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Requested resource not found
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

### Validation Errors

For validation errors (422), the response includes field-specific errors:

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "not-an-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "value": ""
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

### Limits by Subscription Tier

- **Free users**: 100 requests per 15 minutes
- **Premium users**: 500 requests per 15 minutes
- **Unlimited access**: Contact support for higher limits

### Rate Limit Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642258800
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "details": {
    "limit": 100,
    "reset": 1642258800
  }
}
```

## Best Practices

1. **Use pagination**: Always use pagination for list endpoints to improve performance
2. **Cache responses**: Cache non-real-time data to reduce API calls
3. **Handle errors gracefully**: Implement proper error handling for all error codes
4. **Use filters**: Apply filters to reduce response sizes
5. **Monitor rate limits**: Track rate limit headers to avoid being throttled
6. **Keep tokens secure**: Never expose JWT tokens in client-side code or version control

## Examples

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login example
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  const { token } = response.data.data;
  localStorage.setItem('token', token);
  return response.data.data;
};

// Get trades example
const getTrades = async (filters = {}) => {
  const response = await api.get('/trades', { params: filters });
  return response.data;
};
```

### cURL Examples

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get trades (with auth)
curl -X GET http://localhost:3001/api/v1/trades?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Search
curl -X GET "http://localhost:3001/api/v1/search?q=pelosi&type=politician"
```

## Support

For API support, issues, or feature requests:

- GitHub Issues: https://github.com/yourusername/congresstracker/issues
- Email: support@congresstracker.com
- Documentation: https://docs.congresstracker.com

---

**Last Updated:** January 2025
**API Version:** 1.0.0
