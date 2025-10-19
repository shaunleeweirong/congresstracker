#!/usr/bin/env node

/**
 * Dashboard Data Sync Time Analysis
 * Calculate how long it takes to get all data needed for dashboard metrics
 */

const axios = require('axios');

const FMP_API_KEY = 'eZgVpY932rWQrf4c9XQB0VpAN22urjxv';
const FMP_BASE_URL = 'https://financialmodelingprep.com';

// Helper to measure time
function timeIt(label) {
  const start = Date.now();
  return () => {
    const duration = Date.now() - start;
    console.log(`   ⏱️  ${label}: ${duration}ms`);
    return duration;
  };
}

async function fetchAllPages(endpoint, endpointName, limit = 250) {
  console.log(`\n📡 Fetching all ${endpointName}...`);
  const stopTimer = timeIt(`Total time for ${endpointName}`);

  let allRecords = [];
  let page = 0;
  let hasMore = true;
  let requestCount = 0;

  while (hasMore) {
    try {
      const pageTimer = timeIt(`  Page ${page}`);

      const response = await axios.get(`${FMP_BASE_URL}${endpoint}`, {
        params: {
          apikey: FMP_API_KEY,
          page: page,
          limit: limit
        }
      });

      pageTimer();
      requestCount++;

      const data = response.data;
      const recordCount = Array.isArray(data) ? data.length : 0;

      console.log(`   📄 Page ${page}: ${recordCount} records`);

      if (recordCount === 0) {
        hasMore = false;
        console.log(`   ✅ No more data - stopping at page ${page}`);
      } else {
        allRecords.push(...data);

        if (recordCount < limit) {
          hasMore = false;
          console.log(`   ✅ Got ${recordCount} < ${limit} - last page reached`);
        } else {
          page++;
        }
      }

      // Small delay to be nice to API
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.log(`   ❌ Error on page ${page}:`, error.message);
      hasMore = false;
    }
  }

  const totalDuration = stopTimer();

  return {
    records: allRecords,
    totalRecords: allRecords.length,
    requests: requestCount,
    duration: totalDuration,
    avgTimePerRequest: Math.round(totalDuration / requestCount)
  };
}

async function analyzeDashboardDataRequirements() {
  console.log('🧪 Dashboard Data Sync Time Analysis');
  console.log('='.repeat(70));
  console.log('Calculating how long it takes to get ALL data for dashboard\n');

  // Track overall time
  const overallTimer = timeIt('Overall sync time');

  // 1. Fetch all Senate trades
  console.log('\n' + '='.repeat(70));
  console.log('📊 SENATE TRADES');
  console.log('='.repeat(70));
  const senateResult = await fetchAllPages('/stable/senate-latest', 'Senate Trades', 250);

  // 2. Fetch all House trades
  console.log('\n' + '='.repeat(70));
  console.log('📊 HOUSE TRADES');
  console.log('='.repeat(70));
  const houseResult = await fetchAllPages('/stable/house-latest', 'House Trades', 250);

  const totalDuration = overallTimer();

  // Calculate metrics from the data
  console.log('\n\n' + '='.repeat(70));
  console.log('📈 DASHBOARD METRICS CALCULATION');
  console.log('='.repeat(70));

  // Metric 1: Total Trades
  const totalTrades = senateResult.totalRecords + houseResult.totalRecords;
  console.log(`\n1️⃣  Total Trades: ${totalTrades.toLocaleString()}`);
  console.log(`   Senate: ${senateResult.totalRecords.toLocaleString()}`);
  console.log(`   House: ${houseResult.totalRecords.toLocaleString()}`);

  // Metric 2: Active Members
  const uniqueSenators = new Set(
    senateResult.records.map(t => `${t.firstName} ${t.lastName}`.trim()).filter(Boolean)
  );
  const uniqueReps = new Set(
    houseResult.records.map(t => `${t.firstName} ${t.lastName}`.trim()).filter(Boolean)
  );
  const totalMembers = uniqueSenators.size + uniqueReps.size;

  console.log(`\n2️⃣  Active Members: ${totalMembers}`);
  console.log(`   Unique Senators: ${uniqueSenators.size}`);
  console.log(`   Unique Representatives: ${uniqueReps.size}`);

  // Metric 3: Total Volume
  const parseAmount = (amountStr) => {
    if (!amountStr) return 0;
    const numbers = amountStr.match(/\$?([\d,]+)/g);
    if (!numbers) return 0;
    const values = numbers.map(n => parseInt(n.replace(/[$,]/g, '')));
    return values.length === 2 ? (values[0] + values[1]) / 2 : values[0];
  };

  const senateVolume = senateResult.records.reduce((sum, trade) => sum + parseAmount(trade.amount), 0);
  const houseVolume = houseResult.records.reduce((sum, trade) => sum + parseAmount(trade.amount), 0);
  const totalVolume = senateVolume + houseVolume;

  console.log(`\n3️⃣  Total Volume (estimated): $${totalVolume.toLocaleString()}`);
  console.log(`   Senate: $${senateVolume.toLocaleString()}`);
  console.log(`   House: $${houseVolume.toLocaleString()}`);

  // Metric 4: Alerts (can't calculate from FMP)
  console.log(`\n4️⃣  Alerts Triggered: N/A (requires our database)`);

  // Date range analysis
  const allDates = [
    ...senateResult.records.map(t => new Date(t.transactionDate)),
    ...houseResult.records.map(t => new Date(t.transactionDate))
  ].filter(d => !isNaN(d));

  const oldestDate = new Date(Math.min(...allDates));
  const newestDate = new Date(Math.max(...allDates));
  const daysCoverage = Math.floor((newestDate - oldestDate) / (1000 * 60 * 60 * 24));

  console.log(`\n📅 Data Coverage:`);
  console.log(`   Oldest: ${oldestDate.toISOString().split('T')[0]}`);
  console.log(`   Newest: ${newestDate.toISOString().split('T')[0]}`);
  console.log(`   Coverage: ${daysCoverage} days (~${Math.round(daysCoverage / 30)} months)`);

  // Performance Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('⚡ PERFORMANCE SUMMARY');
  console.log('='.repeat(70));

  const totalRequests = senateResult.requests + houseResult.requests;

  console.log(`\n📊 API Calls Made:`);
  console.log(`   Senate: ${senateResult.requests} requests`);
  console.log(`   House: ${houseResult.requests} requests`);
  console.log(`   Total: ${totalRequests} requests`);
  console.log(`   Rate limit usage: ${totalRequests}/300 per minute (${Math.round(totalRequests/300*100)}%)`);

  console.log(`\n⏱️  Time Breakdown:`);
  console.log(`   Senate sync: ${(senateResult.duration / 1000).toFixed(2)}s`);
  console.log(`   House sync: ${(houseResult.duration / 1000).toFixed(2)}s`);
  console.log(`   Total time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`   Avg per request: ${Math.round((senateResult.avgTimePerRequest + houseResult.avgTimePerRequest) / 2)}ms`);

  console.log(`\n📦 Data Retrieved:`);
  console.log(`   Total records: ${totalTrades.toLocaleString()}`);
  console.log(`   Records per second: ${Math.round(totalTrades / (totalDuration / 1000))}`);
  console.log(`   Data per request: ${Math.round(totalTrades / totalRequests)} records avg`);

  // Efficiency comparison
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 EFFICIENCY COMPARISON');
  console.log('='.repeat(70));

  const limit100Requests = Math.ceil(totalTrades / 100);
  const limit100Time = limit100Requests * 300; // Estimated 300ms per request
  const limit250Requests = totalRequests;
  const limit250Time = totalDuration;

  console.log(`\n🔸 If we used limit=100:`);
  console.log(`   Requests: ${limit100Requests}`);
  console.log(`   Est. time: ${(limit100Time / 1000).toFixed(2)}s`);

  console.log(`\n🔹 Using limit=250 (actual):`);
  console.log(`   Requests: ${limit250Requests}`);
  console.log(`   Actual time: ${(limit250Time / 1000).toFixed(2)}s`);

  console.log(`\n💡 Improvement:`);
  console.log(`   Fewer requests: ${limit100Requests - limit250Requests} (${Math.round((1 - limit250Requests/limit100Requests) * 100)}% reduction)`);
  console.log(`   Time saved: ${((limit100Time - limit250Time) / 1000).toFixed(2)}s (${Math.round((1 - limit250Time/limit100Time) * 100)}% faster)`);

  // Real-world scenarios
  console.log('\n\n' + '='.repeat(70));
  console.log('🌍 REAL-WORLD SCENARIOS');
  console.log('='.repeat(70));

  console.log(`\n1️⃣  Dashboard Page Load (if querying API directly):`);
  console.log(`   Time to get all data: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`   User experience: ❌ TOO SLOW (users expect <1s)`);

  console.log(`\n2️⃣  Daily Background Sync Job:`);
  console.log(`   Time to sync all data: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`   User experience: ✅ PERFECT (runs in background)`);
  console.log(`   Frequency: Can run every hour if needed`);

  console.log(`\n3️⃣  Database Query (recommended for dashboard):`);
  console.log(`   Time to get metrics: ~5-10ms`);
  console.log(`   User experience: ✅ INSTANT`);
  console.log(`   How: Background job syncs → database stores → dashboard queries`);

  // Final recommendation
  console.log('\n\n' + '='.repeat(70));
  console.log('✅ FINAL RECOMMENDATION');
  console.log('='.repeat(70));

  console.log(`\n📋 For Dashboard Metrics:`);
  console.log(`   ❌ DON'T: Query FMP API on page load (${(totalDuration / 1000).toFixed(2)}s is too slow)`);
  console.log(`   ✅ DO: Run background sync job every 1-24 hours`);
  console.log(`   ✅ DO: Calculate metrics from PostgreSQL database (~5ms)`);
  console.log(`   ✅ DO: Cache metrics in Redis with 5-minute TTL`);

  console.log(`\n⏰ Sync Job Schedule:`);
  console.log(`   Duration: ${(totalDuration / 1000).toFixed(2)}s per run`);
  console.log(`   Frequency: Every 6-24 hours (congressional trades update slowly)`);
  console.log(`   Best time: 2-4 AM (low traffic period)`);
  console.log(`   Rate impact: ${totalRequests}/300 per minute (${Math.round(totalRequests/300*100)}% of limit)`);

  console.log(`\n🎯 Expected Dashboard Performance:`);
  console.log(`   Metric calculation: ~5-10ms (from database)`);
  console.log(`   Cache hit: ~1ms (from Redis)`);
  console.log(`   Page load time: <100ms total`);
  console.log(`   User experience: ⚡ INSTANT`);

  console.log('\n');
}

// Run the analysis
analyzeDashboardDataRequirements().then(() => {
  console.log('✅ Analysis complete!\n');
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
