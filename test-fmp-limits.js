#!/usr/bin/env node

/**
 * FMP API Limit Testing Script
 * Tests different limit values to discover actual API limits
 */

const axios = require('axios');

const FMP_API_KEY = 'eZgVpY932rWQrf4c9XQB0VpAN22urjxv';
const FMP_BASE_URL = 'https://financialmodelingprep.com';

async function testLimit(endpoint, endpointName, limit) {
  try {
    console.log(`\n📊 Testing ${endpointName} with limit=${limit}`);
    console.log('-'.repeat(60));

    const startTime = Date.now();

    const response = await axios.get(`${FMP_BASE_URL}${endpoint}`, {
      params: {
        apikey: FMP_API_KEY,
        page: 0,
        limit: limit
      }
    });

    const duration = Date.now() - startTime;
    const data = response.data;
    const actualCount = Array.isArray(data) ? data.length : 0;

    console.log(`✅ Success!`);
    console.log(`   Requested: ${limit} records`);
    console.log(`   Received:  ${actualCount} records`);
    console.log(`   Duration:  ${duration}ms`);
    console.log(`   Status:    ${response.status}`);

    if (actualCount < limit) {
      console.log(`   ⚠️  Note: Received fewer than requested (may be all available data)`);
    } else if (actualCount === limit) {
      console.log(`   ✅ Received exactly what we requested`);
    }

    return {
      success: true,
      requested: limit,
      received: actualCount,
      duration,
      status: response.status
    };

  } catch (error) {
    console.log(`❌ Failed!`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }

    return {
      success: false,
      requested: limit,
      error: error.response ? error.response.status : error.message
    };
  }
}

async function runTests() {
  console.log('🧪 FMP API Limit Testing');
  console.log('='.repeat(60));
  console.log('Testing different limit values to find actual API limits\n');

  const testLimits = [
    10,     // Small
    50,     // Medium
    100,    // Default
    200,    // 2x
    500,    // 5x
    1000,   // 10x
    5000,   // 50x
    10000   // 100x
  ];

  const endpoints = [
    { path: '/stable/senate-latest', name: 'Senate Trades' },
    { path: '/stable/house-latest', name: 'House Trades' }
  ];

  const results = {};

  for (const endpoint of endpoints) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Testing Endpoint: ${endpoint.name}`);
    console.log(`${'='.repeat(60)}`);

    results[endpoint.name] = [];

    for (const limit of testLimits) {
      const result = await testLimit(endpoint.path, endpoint.name, limit);
      results[endpoint.name].push(result);

      // Small delay between requests to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 200));

      // If we got an error, stop testing higher limits
      if (!result.success) {
        console.log(`\n⚠️  Stopping tests for ${endpoint.name} due to error`);
        break;
      }
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 SUMMARY - API Limit Test Results');
  console.log('='.repeat(60));

  for (const [endpointName, endpointResults] of Object.entries(results)) {
    console.log(`\n${endpointName}:`);
    console.log('-'.repeat(60));

    let maxSuccessfulLimit = 0;
    let maxRecordsReceived = 0;

    endpointResults.forEach(result => {
      if (result.success) {
        const status = result.received === result.requested ? '✅' : '⚠️ ';
        console.log(`  ${status} limit=${result.requested.toString().padEnd(6)} → received=${result.received.toString().padEnd(6)} (${result.duration}ms)`);

        if (result.received > maxRecordsReceived) {
          maxRecordsReceived = result.received;
        }
        if (result.requested > maxSuccessfulLimit) {
          maxSuccessfulLimit = result.requested;
        }
      } else {
        console.log(`  ❌ limit=${result.requested.toString().padEnd(6)} → ERROR: ${result.error}`);
      }
    });

    console.log(`\n  📊 Max successful limit: ${maxSuccessfulLimit}`);
    console.log(`  📊 Max records received: ${maxRecordsReceived}`);
  }

  // Analysis
  console.log('\n\n' + '='.repeat(60));
  console.log('🔍 ANALYSIS');
  console.log('='.repeat(60));

  // Check if we can request more than 100
  const senate100 = results['Senate Trades'].find(r => r.requested === 100);
  const senate1000 = results['Senate Trades'].find(r => r.requested === 1000);

  if (senate100 && senate1000) {
    if (senate1000.success) {
      console.log('\n✅ Can request more than 100 records!');
      console.log(`   - limit=100  → ${senate100.received} records`);
      console.log(`   - limit=1000 → ${senate1000.received} records`);

      if (senate1000.received > senate100.received) {
        console.log(`   - Got ${senate1000.received - senate100.received} MORE records with higher limit`);
      } else if (senate1000.received === senate100.received) {
        console.log(`   - Same number of records (likely all available data)`);
      }
    } else {
      console.log('\n❌ Cannot request more than 100 records');
      console.log(`   - limit=100  → ✅ Success`);
      console.log(`   - limit=1000 → ❌ Failed: ${senate1000.error}`);
    }
  }

  // Recommendations
  console.log('\n\n' + '='.repeat(60));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(60));

  const allResults = Object.values(results).flat();
  const maxSuccess = Math.max(...allResults.filter(r => r.success).map(r => r.requested));
  const maxReceived = Math.max(...allResults.filter(r => r.success).map(r => r.received));

  console.log(`\n1. Maximum safe limit: ${maxSuccess}`);
  console.log(`2. Maximum records received in single request: ${maxReceived}`);
  console.log(`3. Optimal strategy:`);

  if (maxReceived > 100) {
    console.log(`   - Use limit=${maxSuccess} to reduce number of requests`);
    console.log(`   - This reduces API calls by ${Math.floor(maxSuccess / 100)}x`);
  } else {
    console.log(`   - Stick with limit=100 (higher limits don't return more data)`);
    console.log(`   - Use pagination to get all records`);
  }

  console.log('\n');
}

// Run the tests
runTests().then(() => {
  console.log('✅ Test complete!\n');
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
