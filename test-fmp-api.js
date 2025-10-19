#!/usr/bin/env node

/**
 * FMP API Test Script
 * Tests what data is available from the Financial Modeling Prep API
 * This script does NOT modify the main codebase
 */

const axios = require('axios');

const FMP_API_KEY = 'eZgVpY932rWQrf4c9XQB0VpAN22urjxv';
const FMP_BASE_URL = 'https://financialmodelingprep.com';

async function testFMPAPI() {
  console.log('🧪 Testing FMP API Data Availability\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Get latest Senate trades
    console.log('\n📊 Test 1: Latest Senate Trades');
    console.log('-'.repeat(60));
    const senateResponse = await axios.get(`${FMP_BASE_URL}/stable/senate-latest`, {
      params: { apikey: FMP_API_KEY, page: 0, limit: 10 }
    });

    const senateTrades = senateResponse.data;
    console.log(`✅ Retrieved ${senateTrades.length} Senate trades`);

    if (senateTrades.length > 0) {
      console.log('\nSample Senate Trade:');
      console.log(JSON.stringify(senateTrades[0], null, 2));
    }

    // Test 2: Get latest House trades
    console.log('\n\n📊 Test 2: Latest House Trades');
    console.log('-'.repeat(60));
    const houseResponse = await axios.get(`${FMP_BASE_URL}/stable/house-latest`, {
      params: { apikey: FMP_API_KEY, page: 0, limit: 10 }
    });

    const houseTrades = houseResponse.data;
    console.log(`✅ Retrieved ${houseTrades.length} House trades`);

    if (houseTrades.length > 0) {
      console.log('\nSample House Trade:');
      console.log(JSON.stringify(houseTrades[0], null, 2));
    }

    // Test 3: Calculate dashboard metrics
    console.log('\n\n📈 Test 3: Dashboard Metrics Analysis');
    console.log('-'.repeat(60));

    // Get more data for analysis
    const senateFullResponse = await axios.get(`${FMP_BASE_URL}/stable/senate-latest`, {
      params: { apikey: FMP_API_KEY, page: 0, limit: 100 }
    });
    const houseFullResponse = await axios.get(`${FMP_BASE_URL}/stable/house-latest`, {
      params: { apikey: FMP_API_KEY, page: 0, limit: 100 }
    });

    const allSenateTrades = senateFullResponse.data;
    const allHouseTrades = houseFullResponse.data;
    const totalTrades = allSenateTrades.length + allHouseTrades.length;

    console.log(`\n📊 Total Trades (from API): ${totalTrades}`);
    console.log(`   - Senate: ${allSenateTrades.length}`);
    console.log(`   - House: ${allHouseTrades.length}`);

    // Calculate unique politicians
    const uniqueSenators = new Set(allSenateTrades.map(t => `${t.firstName} ${t.lastName}`.trim()).filter(Boolean));
    const uniqueReps = new Set(allHouseTrades.map(t => `${t.firstName} ${t.lastName}`.trim()).filter(Boolean));
    const totalMembers = uniqueSenators.size + uniqueReps.size;

    console.log(`\n👥 Active Members (from API): ${totalMembers}`);
    console.log(`   - Senators: ${uniqueSenators.size}`);
    console.log(`   - Representatives: ${uniqueReps.size}`);

    // Calculate total volume
    const parseAmount = (amountStr) => {
      if (!amountStr) return 0;
      const numbers = amountStr.match(/\$?([\d,]+)/g);
      if (!numbers) return 0;
      const values = numbers.map(n => parseInt(n.replace(/[$,]/g, '')));
      return values.length === 2 ? (values[0] + values[1]) / 2 : values[0];
    };

    const senateVolume = allSenateTrades.reduce((sum, trade) => sum + parseAmount(trade.amount), 0);
    const houseVolume = allHouseTrades.reduce((sum, trade) => sum + parseAmount(trade.amount), 0);
    const totalVolume = senateVolume + houseVolume;

    console.log(`\n💰 Total Volume (estimated): $${totalVolume.toLocaleString()}`);
    console.log(`   - Senate: $${senateVolume.toLocaleString()}`);
    console.log(`   - House: $${houseVolume.toLocaleString()}`);

    // Analyze date ranges
    const allDates = [
      ...allSenateTrades.map(t => new Date(t.transactionDate)),
      ...allHouseTrades.map(t => new Date(t.transactionDate))
    ];
    const oldestDate = new Date(Math.min(...allDates));
    const newestDate = new Date(Math.max(...allDates));

    console.log(`\n📅 Date Range:`);
    console.log(`   - Oldest: ${oldestDate.toISOString().split('T')[0]}`);
    console.log(`   - Newest: ${newestDate.toISOString().split('T')[0]}`);

    // Most traded stocks
    const stockCounts = {};
    [...allSenateTrades, ...allHouseTrades].forEach(trade => {
      if (trade.symbol) {
        stockCounts[trade.symbol] = (stockCounts[trade.symbol] || 0) + 1;
      }
    });

    const topStocks = Object.entries(stockCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log(`\n📈 Most Traded Stocks:`);
    topStocks.forEach(([symbol, count], index) => {
      console.log(`   ${index + 1}. ${symbol}: ${count} trades`);
    });

    // Most active traders
    const traderCounts = {};
    allSenateTrades.forEach(trade => {
      const name = `${trade.firstName} ${trade.lastName}`.trim();
      if (name) traderCounts[name] = (traderCounts[name] || 0) + 1;
    });
    allHouseTrades.forEach(trade => {
      const name = `${trade.firstName} ${trade.lastName}`.trim();
      if (name) traderCounts[name] = (traderCounts[name] || 0) + 1;
    });

    const topTraders = Object.entries(traderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log(`\n👤 Most Active Traders:`);
    topTraders.forEach(([name, count], index) => {
      console.log(`   ${index + 1}. ${name}: ${count} trades`);
    });

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 SUMMARY - Can FMP API provide dashboard metrics?');
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ Total Trades: YES - Can be calculated from API data');
    console.log('   (Current API limit: 100 per request, would need pagination for full count)');
    console.log('');
    console.log('✅ Active Members: YES - Can be derived from unique trader names');
    console.log('   (Need to count unique senators + representatives)');
    console.log('');
    console.log('✅ Total Volume: YES - Can be estimated from amount ranges');
    console.log('   (FMP provides ranges like "$1,001 - $15,000", we take midpoint)');
    console.log('');
    console.log('⚠️  Alerts Triggered: NO - This is application-specific data');
    console.log('   (Must be calculated from our own database of user alerts)');
    console.log('');
    console.log('\n💡 RECOMMENDATION:');
    console.log('-'.repeat(60));
    console.log('1. Store synced FMP data in our PostgreSQL database');
    console.log('2. Calculate metrics from database, not live API calls');
    console.log('3. Use scheduled jobs to sync data periodically');
    console.log('4. Cache computed metrics in Redis for performance');
    console.log('5. "Alerts Triggered" must come from our user_alerts table');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
testFMPAPI().then(() => {
  console.log('\n✅ Test complete!\n');
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
