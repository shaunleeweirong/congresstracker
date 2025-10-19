#!/usr/bin/env tsx

/**
 * Quick Sync Script - Populates database with real congressional trading data
 *
 * Usage:
 *   docker compose exec backend-dev node --loader tsx scripts/sync-now.ts
 *   OR from host (if DB accessible): tsx scripts/sync-now.ts
 */

import 'dotenv/config';
import { runDailySync } from '../src/jobs/dailySync.js';

console.log('🚀 Starting quick data sync...\n');
console.log(`📡 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}`);
console.log(`🔑 FMP API Key: ${process.env.FMP_API_KEY?.slice(0, 10)}...`);
console.log('');

runDailySync()
  .then(() => {
    console.log('\n✅ Sync completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
