#!/usr/bin/env ts-node

/**
 * Database Setup Script
 *
 * This script initializes the PostgreSQL database by:
 * 1. Testing database connection
 * 2. Running migrations to create tables
 * 3. Optionally seeding test data
 *
 * Usage:
 *   npm run setup:db              # Setup with test data
 *   npm run setup:db --no-seed    # Setup without test data
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testConnection(client: Client): Promise<boolean> {
  try {
    log('\n🔌 Testing database connection...', 'cyan');
    await client.connect();
    const result = await client.query('SELECT version()');
    log(`✅ Connected to PostgreSQL successfully`, 'green');
    log(`   Version: ${result.rows[0].version.split(',')[0]}`, 'blue');
    return true;
  } catch (error: any) {
    log(`❌ Database connection failed`, 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function runMigrations(client: Client): Promise<boolean> {
  try {
    log('\n📦 Running database migrations...', 'cyan');

    const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');

    if (!fs.existsSync(migrationPath)) {
      log(`❌ Migration file not found: ${migrationPath}`, 'red');
      return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    log('   Creating extensions...', 'blue');
    log('   Creating types...', 'blue');
    log('   Creating tables...', 'blue');
    log('   Creating indexes...', 'blue');

    await client.query(migrationSQL);

    log('✅ Migrations completed successfully', 'green');
    return true;
  } catch (error: any) {
    log(`❌ Migration failed`, 'red');
    log(`   Error: ${error.message}`, 'red');

    // Check if tables already exist
    if (error.message.includes('already exists')) {
      log('\n⚠️  Tables already exist. This is okay if re-running setup.', 'yellow');
      log('   Use --force flag to drop and recreate tables (WARNING: data loss)', 'yellow');
      return true; // Consider this a success
    }

    return false;
  }
}

async function seedTestData(client: Client): Promise<boolean> {
  try {
    log('\n🌱 Seeding test data...', 'cyan');

    const seedPath = path.join(__dirname, '../seeds/001_test_data.sql');

    if (!fs.existsSync(seedPath)) {
      log(`⚠️  Seed file not found: ${seedPath}`, 'yellow');
      log('   Skipping test data seeding', 'yellow');
      return true;
    }

    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    log('   Creating test users...', 'blue');
    log('   Creating congressional members...', 'blue');
    log('   Creating stock tickers...', 'blue');

    await client.query(seedSQL);

    log('✅ Test data seeded successfully', 'green');
    return true;
  } catch (error: any) {
    log(`❌ Seeding failed`, 'red');
    log(`   Error: ${error.message}`, 'red');

    // Check if data already exists
    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
      log('\n⚠️  Some test data already exists. Continuing...', 'yellow');
      return true;
    }

    return false;
  }
}

async function dropAllTables(client: Client): Promise<boolean> {
  try {
    log('\n🗑️  Dropping all tables...', 'yellow');

    const dropSQL = `
      -- Drop tables in reverse order due to foreign key constraints
      DROP TABLE IF EXISTS alert_notifications CASCADE;
      DROP TABLE IF EXISTS user_follows CASCADE;
      DROP TABLE IF EXISTS user_alerts CASCADE;
      DROP TABLE IF EXISTS stock_trades CASCADE;
      DROP TABLE IF EXISTS stock_tickers CASCADE;
      DROP TABLE IF EXISTS corporate_insiders CASCADE;
      DROP TABLE IF EXISTS congressional_members CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      -- Drop materialized views
      DROP MATERIALIZED VIEW IF EXISTS portfolio_concentration CASCADE;

      -- Drop custom types
      DROP TYPE IF EXISTS subscription_status CASCADE;
      DROP TYPE IF EXISTS position_type CASCADE;
      DROP TYPE IF EXISTS party_affiliation CASCADE;
      DROP TYPE IF EXISTS trader_type CASCADE;
      DROP TYPE IF EXISTS transaction_type CASCADE;
      DROP TYPE IF EXISTS alert_type CASCADE;
      DROP TYPE IF EXISTS alert_status CASCADE;
      DROP TYPE IF EXISTS billing_status CASCADE;
      DROP TYPE IF EXISTS notification_type CASCADE;
    `;

    await client.query(dropSQL);
    log('✅ All tables dropped', 'green');
    return true;
  } catch (error: any) {
    log(`❌ Failed to drop tables`, 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function verifySetup(client: Client): Promise<void> {
  try {
    log('\n🔍 Verifying setup...', 'cyan');

    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const expectedTables = [
      'alert_notifications',
      'congressional_members',
      'corporate_insiders',
      'stock_tickers',
      'stock_trades',
      'user_alerts',
      'user_follows',
      'users'
    ];

    const actualTables = tablesResult.rows.map((row: any) => row.table_name);
    const missingTables = expectedTables.filter(t => !actualTables.includes(t));

    if (missingTables.length > 0) {
      log(`⚠️  Missing tables: ${missingTables.join(', ')}`, 'yellow');
    } else {
      log(`✅ All ${expectedTables.length} tables created`, 'green');
    }

    // Check for test data
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    const politicianCount = await client.query('SELECT COUNT(*) as count FROM congressional_members');
    const stockCount = await client.query('SELECT COUNT(*) as count FROM stock_tickers');

    log('\n📊 Database Statistics:', 'cyan');
    log(`   Users: ${userCount.rows[0].count}`, 'blue');
    log(`   Politicians: ${politicianCount.rows[0].count}`, 'blue');
    log(`   Stock Tickers: ${stockCount.rows[0].count}`, 'blue');

  } catch (error: any) {
    log(`⚠️  Verification warning: ${error.message}`, 'yellow');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSeed = !args.includes('--no-seed');
  const force = args.includes('--force');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
${colors.cyan}Database Setup Script${colors.reset}

Usage: npm run setup:db [options]

Options:
  --no-seed    Skip seeding test data
  --force      Drop all tables before setup (WARNING: destroys data)
  --help, -h   Show this help message

Examples:
  npm run setup:db              # Full setup with test data
  npm run setup:db --no-seed    # Setup without test data
  npm run setup:db --force      # Fresh setup (drops existing tables)
    `);
    process.exit(0);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/congresstracker'
  });

  try {
    log('\n' + '='.repeat(60), 'cyan');
    log('  🏗️  Congressional Tracker Database Setup', 'cyan');
    log('='.repeat(60), 'cyan');

    // Step 1: Test connection
    const connected = await testConnection(client);
    if (!connected) {
      log('\n❌ Setup failed: Could not connect to database', 'red');
      log('   Check your DATABASE_URL environment variable', 'yellow');
      process.exit(1);
    }

    // Step 2: Drop tables if force flag is set
    if (force) {
      log('\n⚠️  WARNING: --force flag detected!', 'yellow');
      log('   All existing data will be destroyed.', 'yellow');

      // Wait 3 seconds to allow user to cancel
      log('   Proceeding in 3 seconds... (Ctrl+C to cancel)', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const dropped = await dropAllTables(client);
      if (!dropped) {
        log('\n❌ Setup failed: Could not drop tables', 'red');
        process.exit(1);
      }
    }

    // Step 3: Run migrations
    const migrated = await runMigrations(client);
    if (!migrated) {
      log('\n❌ Setup failed: Migrations failed', 'red');
      process.exit(1);
    }

    // Step 4: Seed test data (optional)
    if (shouldSeed) {
      await seedTestData(client);
    } else {
      log('\n⏭️  Skipping test data seeding (--no-seed flag)', 'yellow');
    }

    // Step 5: Verify setup
    await verifySetup(client);

    // Success!
    log('\n' + '='.repeat(60), 'green');
    log('  ✅ Database setup completed successfully!', 'green');
    log('='.repeat(60), 'green');

    log('\n📝 Next Steps:', 'cyan');
    log('   1. Set your FMP_API_KEY in backend/.env', 'blue');
    log('   2. Test FMP connection: npm run test:fmp', 'blue');
    log('   3. Run initial data sync: npm run sync:initial', 'blue');
    log('   4. Start the server: npm run dev\n', 'blue');

    process.exit(0);

  } catch (error: any) {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as setupDatabase };
