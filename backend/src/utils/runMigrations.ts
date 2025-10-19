/**
 * Migration Runner
 * Automatically runs pending SQL migrations on server startup
 */

import { db } from '../config/database';
import fs from 'fs/promises';
import path from 'path';

interface Migration {
  id: number;
  name: string;
  executed_at: Date;
}

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable(): Promise<void> {
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
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(): Promise<Set<string>> {
  const client = await db.connect();
  try {
    const result = await client.query<Migration>(
      'SELECT name FROM schema_migrations ORDER BY id'
    );
    return new Set(result.rows.map(row => row.name));
  } finally {
    client.release();
  }
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
 * Execute a single migration file
 */
async function executeMigration(filePath: string, fileName: string): Promise<void> {
  const client = await db.connect();
  try {
    console.log(`  🔄 Running migration: ${fileName}`);
    const sql = await fs.readFile(filePath, 'utf-8');

    // Execute the migration SQL
    await client.query(sql);

    // Mark as executed
    await markMigrationExecuted(fileName);

    console.log(`  ✅ Completed: ${fileName}`);
  } catch (error) {
    console.error(`  ❌ Failed: ${fileName}`);
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

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Sort alphabetically to ensure order

    // Filter out already-executed migrations
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.has(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s)`);

    // Execute each pending migration
    for (const file of pendingMigrations) {
      const filePath = path.join(migrationsDir, file);
      await executeMigration(filePath, file);
    }

    console.log(`✅ Successfully ran ${pendingMigrations.length} migration(s)\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error; // Re-throw to prevent server from starting with incomplete migrations
  }
}
