import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class Database {
  private pool: Pool;
  private static instance: Database;

  private constructor() {
    const config: DatabaseConfig = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'congresstracker',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    };

    // Use DATABASE_URL if provided (for production environments like Railway)
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: config.max,
        idleTimeoutMillis: config.idleTimeoutMillis,
        connectionTimeoutMillis: config.connectionTimeoutMillis,
      });
    } else {
      this.pool = new Pool(config);
    }

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // Handle pool connection events
    this.pool.on('connect', (client) => {
      console.log('New client connected to database');
    });

    this.pool.on('remove', (client) => {
      console.log('Client removed from pool');
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async connect(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW() as current_time');
      console.log('Database connection successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    console.log('Database pool closed');
  }

  // Helper methods for common operations
  public async findById<T extends Record<string, any> = any>(table: string, id: string): Promise<T | null> {
    const result = await this.query<T>(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  public async findByField<T extends Record<string, any> = any>(
    table: string,
    field: string,
    value: any
  ): Promise<T | null> {
    const result = await this.query<T>(`SELECT * FROM ${table} WHERE ${field} = $1`, [value]);
    return result.rows[0] || null;
  }

  public async findMany<T extends Record<string, any> = any>(
    table: string,
    conditions: Record<string, any> = {},
    limit?: number,
    offset?: number
  ): Promise<T[]> {
    let query = `SELECT * FROM ${table}`;
    const params: any[] = [];
    let paramIndex = 1;

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => {
          params.push(conditions[key]);
          return `${key} = $${paramIndex++}`;
        })
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
    }

    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    if (offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(offset);
    }

    const result = await this.query<T>(query, params);
    return result.rows;
  }

  public async insert<T extends Record<string, any> = any>(
    table: string,
    data: Record<string, any>
  ): Promise<T | null> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query<T>(query, values);
    return result.rows[0] || null;
  }

  public async update<T extends Record<string, any> = any>(
    table: string,
    id: string,
    data: Record<string, any>
  ): Promise<T | null> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(', ');
    
    const query = `
      UPDATE ${table}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;
    
    const result = await this.query<T>(query, [...values, id]);
    return result.rows[0] || null;
  }

  public async delete(table: string, id: string): Promise<boolean> {
    const result = await this.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return (result.rowCount || 0) > 0;
  }
}

// Export singleton instance
export const db = Database.getInstance();
export default db;