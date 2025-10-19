#!/usr/bin/env tsx

/**
 * Historical Backfill Script - Populates database with ALL congressional trading data
 *
 * This script fetches the complete historical dataset from the FMP API:
 * - Coverage: September 2012 - Present
 * - Expected records: ~40,055 trades
 * - Storage required: ~20-25 MB
 * - Duration: ~2-3 minutes
 *
 * This should only be run ONCE during initial setup.
 * After this, use dailySync for incremental updates.
 *
 * Usage:
 *   docker compose exec backend-dev node --loader tsx scripts/backfill-historical.ts
 *   OR from host (if DB accessible): tsx scripts/backfill-historical.ts
 *   OR via API: POST /api/v1/sync/backfill
 */

import 'dotenv/config';
import { runHistoricalBackfill } from '../src/jobs/dailySync.js';

console.log('═'.repeat(70));
console.log('  CONGRESSIONAL TRADING DATA - HISTORICAL BACKFILL');
console.log('═'.repeat(70));
console.log('');
console.log('📡 Database: ' + (process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown'));
console.log('🔑 FMP API Key: ' + (process.env.FMP_API_KEY?.slice(0, 10) || 'NOT SET') + '...');
console.log('');
console.log('⚠️  WARNING: This will fetch ALL historical data from the FMP API');
console.log('   - This should only be run ONCE during initial setup');
console.log('   - Subsequent syncs should use the daily sync (10 pages)');
console.log('');
console.log('Starting in 3 seconds...');
console.log('');

// Give user a moment to cancel if this was run accidentally
setTimeout(() => {
  runHistoricalBackfill()
    .then(() => {
      console.log('\n' + '═'.repeat(70));
      console.log('  ✅ HISTORICAL BACKFILL COMPLETED SUCCESSFULLY');
      console.log('═'.repeat(70));
      console.log('');
      console.log('Next steps:');
      console.log('  1. ✅ Historical data is now in your database');
      console.log('  2. 📅 Daily sync will catch new trades going forward');
      console.log('  3. 🚀 Your application is ready to use!');
      console.log('');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n' + '═'.repeat(70));
      console.error('  ❌ HISTORICAL BACKFILL FAILED');
      console.error('═'.repeat(70));
      console.error('');
      console.error('Error:', error);
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
      console.error('');
      console.error('Troubleshooting:');
      console.error('  1. Check DATABASE_URL is correct');
      console.error('  2. Check FMP_API_KEY is valid');
      console.error('  3. Verify database is accessible');
      console.error('  4. Check FMP API rate limits');
      console.error('');
      process.exit(1);
    });
}, 3000);
