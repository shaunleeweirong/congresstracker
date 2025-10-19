# FMP API Limit Discovery - Test Results

**Date:** October 3, 2025
**Test:** Systematic testing of limit parameter from 10 to 10,000

---

## 🎯 Key Discovery

**The FMP API has a HARD CAP of 250 records per request, regardless of the `limit` parameter!**

---

## Test Results Summary

| Requested Limit | Records Received | Status | Observation |
|-----------------|------------------|--------|-------------|
| 10 | 10 | ✅ | Got what we asked for |
| 50 | 50 | ✅ | Got what we asked for |
| 100 | 100 | ✅ | Got what we asked for |
| 200 | 200 | ✅ | Got what we asked for |
| **500** | **250** | ⚠️ | **CAPPED at 250!** |
| 1,000 | 250 | ⚠️ | CAPPED at 250 |
| 5,000 | 250 | ⚠️ | CAPPED at 250 |
| 10,000 | 250 | ⚠️ | CAPPED at 250 |

---

## What This Means

### 1. **My Initial Assumption Was Wrong** ❌

**I said:** "100 records per request limit"
**Truth:** **250 records per request limit**

### 2. **The API Accepts Any Limit Value** ✅

You can request `limit=10000` and the API won't reject it. But it will only return maximum 250 records.

### 3. **Performance is Consistent** ⚡

```
limit=100  → 295ms (100 records)
limit=200  → 312ms (200 records)
limit=250  → ~310ms (250 records, estimated)
limit=1000 → 274ms (250 records)
limit=10000 → 271ms (250 records)
```

**Observation:** Response time doesn't increase much with higher limits because it caps at 250.

---

## Visual Representation

```
What You Request vs What You Get:

limit=10    ████████           → 10 records  ✅
limit=50    ████████████████   → 50 records  ✅
limit=100   ██████████████████ → 100 records ✅
limit=200   ███████████████████████ → 200 records ✅
limit=500   ███████████████████████ → 250 records ⚠️ (CAPPED)
limit=1000  ███████████████████████ → 250 records ⚠️ (CAPPED)
limit=10000 ███████████████████████ → 250 records ⚠️ (CAPPED)
                                    ↑
                            Hard limit at 250
```

---

## Why Does This Matter?

### Scenario: Getting All Congressional Trades

Let's say there are **5,000 total Senate trades** in the database.

### ❌ **Old Assumption (limit=100):**

```javascript
// Need 50 requests to get all 5,000 trades
for (let page = 0; page < 50; page++) {
  const trades = await fmpClient.getLatestSenateTrades(100);
  // Each request gets 100 records
}

Total Requests: 50
Total Time: ~15 seconds (50 × 300ms)
```

### ✅ **New Discovery (limit=250):**

```javascript
// Only need 20 requests to get all 5,000 trades
for (let page = 0; page < 20; page++) {
  const trades = await fmpClient.getLatestSenateTrades(250);
  // Each request gets 250 records
}

Total Requests: 20
Total Time: ~6 seconds (20 × 300ms)
Improvement: 2.5x FASTER! 🚀
```

---

## How Pagination Works with limit=250

```javascript
// Request 1
GET /stable/senate-latest?page=0&limit=250
// Returns trades 1-250

// Request 2
GET /stable/senate-latest?page=1&limit=250
// Returns trades 251-500

// Request 3
GET /stable/senate-latest?page=2&limit=250
// Returns trades 501-750

// ... continue until you get fewer than 250 records
```

---

## Updated Understanding

### Previous Understanding (WRONG):
```
┌─────────────┐
│ 100 max     │  ← I thought this was the limit
│ per request │
└─────────────┘
```

### Actual Reality (CORRECT):
```
┌─────────────┐
│ 250 max     │  ← This is the REAL limit
│ per request │
└─────────────┘
```

### Why I Was Wrong:

1. **Didn't test thoroughly** - I only tested with `limit=100` initially
2. **Made assumptions** - Saw 100 records returned and assumed that was the max
3. **Common API pattern** - Many APIs use 100, so I assumed FMP did too

**Lesson:** Always test edge cases! 🎓

---

## Implications for Our Code

### Current Code (FMPClient.ts)

```typescript
// Line 287-295
async getLatestSenateTrades(limit?: number): Promise<FMPSenateTradeResponse[]> {
  try {
    const params: any = { page: 0 };
    if (limit) params.limit = limit;  // ← We can pass any limit!

    const data = await this.makeRequest<FMPSenateTradeResponse[]>({
      method: 'GET',
      url: '/stable/senate-latest',
      params
    });
```

**Good news:** Our code already supports custom limits! ✅

### Optimization Opportunity

**Before (default behavior):**
```typescript
await fmpClient.getLatestSenateTrades(); // No limit specified
// API probably defaults to 100 records
```

**After (optimized):**
```typescript
await fmpClient.getLatestSenateTrades(250); // Max limit
// Get 2.5x more data per request!
```

---

## Updated Sync Strategy

### OLD: Syncing with limit=100

```javascript
async syncAllData() {
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const trades = await fmpClient.getLatestSenateTrades(100);

    if (trades.length < 100) {
      hasMore = false;
    }

    await saveTradesToDatabase(trades);
    page++;
  }
}

// For 5,000 trades:
// - 50 requests
// - ~15 seconds
// - Uses 50 of 300/minute rate limit
```

### NEW: Syncing with limit=250

```javascript
async syncAllData() {
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const trades = await fmpClient.getLatestSenateTrades(250); // ← Changed!

    if (trades.length < 250) { // ← Changed!
      hasMore = false;
    }

    await saveTradesToDatabase(trades);
    page++;
  }
}

// For 5,000 trades:
// - 20 requests (2.5x fewer!)
// - ~6 seconds (2.5x faster!)
// - Uses 20 of 300/minute rate limit (more headroom!)
```

**Benefits:**
- ✅ 2.5x fewer API calls
- ✅ 2.5x faster sync time
- ✅ Less rate limit pressure
- ✅ Same result (all data synced)

---

## Why Does FMP Cap at 250?

This is an educated guess based on common API design patterns:

### 1. **Balance Between Performance & Usability**

```
Too Small (50):
- More requests needed
- Slower for users
- More server load (handling many small requests)

Too Large (10,000):
- Single request might timeout
- Massive JSON payloads
- Memory intensive

Sweet Spot (250):
- Reasonable payload size (~50-100KB)
- Fast response time (~300ms)
- Good balance for most use cases
```

### 2. **Database Query Efficiency**

```sql
-- This is fast
SELECT * FROM senate_trades LIMIT 250;

-- This might be slow
SELECT * FROM senate_trades LIMIT 10000;
```

Large result sets require more database resources.

### 3. **Fair Resource Allocation**

If one user requests 10,000 records, it might slow down the server for other users. Capping at 250 keeps things fair.

---

## Comparison to Other Financial APIs

| API | Max Records Per Request |
|-----|------------------------|
| **FMP (Financial Modeling Prep)** | **250** |
| Alpha Vantage | 100 |
| IEX Cloud | 100-1000 (tier-dependent) |
| Polygon.io | 50,000 (premium) |
| Yahoo Finance | ~100 |

FMP's limit of 250 is actually pretty generous compared to competitors!

---

## Practical Example: Real Sync Job

Let's calculate real numbers for our app:

### Assumptions:
- Senate has ~100 active traders
- House has ~435 active traders
- Average 10 trades per politician per year
- Total trades: ~5,350 per year

### Using limit=100 (old approach):
```
Requests needed: 5,350 ÷ 100 = 54 requests
Time: 54 × 300ms = ~16 seconds
```

### Using limit=250 (new approach):
```
Requests needed: 5,350 ÷ 250 = 22 requests
Time: 22 × 300ms = ~6.6 seconds
Savings: 60% faster! ⚡
```

---

## What Happens with Very Large Datasets?

Let's say Congress is super active and there are **100,000 trades** total.

### Using limit=250:
```javascript
Total requests: 100,000 ÷ 250 = 400 requests

With rate limit (300/minute):
- Minute 1: 300 requests (75,000 trades)
- Wait 1 minute for rate limit reset
- Minute 2: 100 requests (25,000 trades)

Total Time: ~2 minutes
```

Still very manageable!

---

## Response Time Analysis

Interesting observation from the tests:

| Limit | Avg Response Time |
|-------|------------------|
| 10 | 900ms |
| 50 | 1,250ms |
| 100 | 305ms |
| 200 | 352ms |
| 250 | ~310ms (estimated) |
| 1000 | 292ms |
| 10000 | 283ms |

**Why does limit=10 take LONGER than limit=100?**

Possible reasons:
1. **Cold start** - First request might initialize connections
2. **Query optimization** - Database might have optimizations for common limits
3. **Random variance** - Network latency fluctuations

**Takeaway:** Response time is relatively stable between 100-250 records (~300ms).

---

## Action Items

### ✅ Update FMPClient.ts (Recommended)

Change default limits from 100 to 250:

```typescript
// OLD
async getLatestSenateTrades(limit?: number): Promise<FMPSenateTradeResponse[]> {
  const params: any = { page: 0 };
  if (limit) params.limit = limit;
  // ... defaults to API's default (probably 100)
}

// NEW
async getLatestSenateTrades(limit: number = 250): Promise<FMPSenateTradeResponse[]> {
  const params: any = { page: 0, limit };
  // ... explicitly use 250 as default
}
```

### ✅ Update Pagination Logic

```typescript
// OLD
if (trades.length < 100) {
  hasMore = false;
}

// NEW
if (trades.length < 250) {
  hasMore = false;
}
```

### ✅ Update Documentation

Update comments and docs to reflect 250 limit, not 100.

---

## Testing Recommendations

### 1. Test Empty Results
```javascript
// What happens when you request page 1000?
const trades = await fmpClient.getLatestSenateTrades(250, 1000);
// Probably returns [] (empty array)
```

### 2. Test Exact Boundary
```javascript
// What if there are exactly 250 trades?
// Does it return 250 or does it indicate "no more pages"?
```

### 3. Test Very Old Data
```javascript
// How far back does the data go?
// Keep paginating until you hit empty results
```

---

## Final Recommendations

### 1. **Use limit=250 Everywhere** ✅

This is the sweet spot for FMP API.

### 2. **Update Default Parameters** ✅

Make 250 the default in all FMP client methods.

### 3. **Document the Limit** ✅

Add comments explaining the 250 cap.

### 4. **Monitor Performance** ✅

Track how many requests your sync jobs make to optimize further.

### 5. **Consider Caching Strategy** ✅

With 2.5x faster syncs, you could:
- Sync more frequently
- Sync more data types (insiders, etc.)
- Still stay well within rate limits

---

## Summary

### What We Learned:

1. ✅ **FMP API limit is 250, not 100**
2. ✅ **You can request any limit value, but it caps at 250**
3. ✅ **Using limit=250 is 2.5x more efficient**
4. ✅ **Response time stays consistent ~300ms**
5. ✅ **Our code already supports custom limits**

### What We Should Do:

1. 🔧 Update default limit to 250 in FMPClient
2. 🔧 Update pagination logic to check for < 250
3. 🔧 Update documentation
4. 🔧 Run optimized sync jobs

### Impact:

- ⚡ **2.5x faster data syncing**
- 📉 **60% fewer API calls**
- 🎯 **More rate limit headroom**
- ✅ **Better performance overall**

---

**Test Script:** `test-fmp-limits.js`
**Run Test:** `node test-fmp-limits.js`
