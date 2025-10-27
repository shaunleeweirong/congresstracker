/**
 * Migration Runner
 * Automatically runs pending SQL migrations on server startup
 *
 * Uses embedded migrations (stored in TypeScript) rather than external .sql files.
 * This ensures migrations are always available regardless of deployment platform.
 */

import { db } from '../config/database';
import { migrations } from './migrations';

interface ExecutedMigration {
  id: number;
  name: string;
  executed_at: Date;
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operation: string,
  maxRetries: number = 5,
  initialDelayMs: number = 2000
): Promise<T> {
  let lastError: Error | undefined;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      console.log(`🔄 Attempt ${attempt}/${maxRetries}: ${operation}...`);

      const result = await fn();
      const duration = Date.now() - startTime;

      console.log(`✅ ${operation} succeeded (took ${duration}ms)`);
      return result;
    } catch (error) {
      lastError = error as Error;
      const duration = Date.now();

      console.error(`⚠️  Attempt ${attempt}/${maxRetries} failed: ${lastError.message} (took ${duration}ms)`);

      if (attempt < maxRetries) {
        console.log(`   Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw new Error(`${operation} failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Ensure migrations table exists (with retry logic)
 */
async function ensureMigrationsTable(): Promise<void> {
  await retryWithBackoff(
    async () => {
      const client = await db.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        console.log('✅ Migrations table ready');
      } finally {
        client.release();
      }
    },
    'Creating migrations table',
    5,
    2000
  );
}

/**
 * Get list of executed migrations (with retry logic)
 */
async function getExecutedMigrations(): Promise<Set<string>> {
  return await retryWithBackoff(
    async () => {
      const client = await db.connect();
      try {
        const result = await client.query<ExecutedMigration>(
          'SELECT name FROM schema_migrations ORDER BY id'
        );
        return new Set(result.rows.map(row => row.name));
      } finally {
        client.release();
      }
    },
    'Fetching executed migrations',
    3,
    2000
  );
}

/**
 * Mark migration as executed
 */
async function markMigrationExecuted(name: string): Promise<void> {
  const client = await db.connect();
  try {
    await client.query(
      'INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [name]
    );
  } finally {
    client.release();
  }
}

/**
 * Execute a single migration
 */
async function executeMigration(name: string, sql: string): Promise<void> {
  const client = await db.connect();
  try {
    console.log(`  🔄 Running migration: ${name}`);

    // Execute the migration SQL
    await client.query(sql);

    // Mark as executed
    await markMigrationExecuted(name);

    console.log(`  ✅ Completed: ${name}`);
  } catch (error) {
    console.error(`  ❌ Failed: ${name}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('\n🔄 Running database migrations...');

    // Ensure migrations tracking table exists
    await ensureMigrationsTable();

    // Get list of already-executed migrations
    const executedMigrations = await getExecutedMigrations();

    // Filter out already-executed migrations
    const pendingMigrations = migrations.filter(
      migration => !executedMigrations.has(migration.name)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s)`);

    // Execute each pending migration
    for (const migration of pendingMigrations) {
      await executeMigration(migration.name, migration.sql);
    }

    console.log(`✅ Successfully ran ${pendingMigrations.length} migration(s)\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error; // Re-throw to prevent server from starting with incomplete migrations
  }
}
