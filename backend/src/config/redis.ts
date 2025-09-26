import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailure?: number;
}

class Redis {
  private client: RedisClientType;
  private static instance: Redis;
  private isConnected: boolean = false;

  private constructor() {
    const config: RedisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      retryDelayOnFailure: 50,
    };

    // Use REDIS_URL if provided (for production environments like Railway)
    if (process.env.REDIS_URL) {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });
    } else {
      this.client = createClient({
        socket: {
          host: config.host,
          port: config.port,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
        password: config.password,
        database: config.db,
      });
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('ready', () => {
      console.log('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      console.log('Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
    });
  }

  public static getInstance(): Redis {
    if (!Redis.instance) {
      Redis.instance = new Redis();
    }
    return Redis.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
        console.log('Redis connection established');
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw error;
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      console.log('Redis connection closed');
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      console.log('Redis connection test successful:', result);
      return true;
    } catch (error) {
      console.error('Redis connection test failed:', error);
      return false;
    }
  }

  // Basic Redis operations
  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  public async set(
    key: string,
    value: string,
    options?: { EX?: number; PX?: number; NX?: boolean; XX?: boolean }
  ): Promise<boolean> {
    try {
      const result = await this.client.set(key, value, options);
      return result === 'OK';
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  public async del(key: string | string[]): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error(`Redis DEL error for key(s) ${key}:`, error);
      return 0;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  // JSON operations
  public async setJSON(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const options = ttl ? { EX: ttl } : undefined;
      return await this.set(key, serialized, options);
    } catch (error) {
      console.error(`Redis setJSON error for key ${key}:`, error);
      return false;
    }
  }

  public async getJSON<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis getJSON error for key ${key}:`, error);
      return null;
    }
  }

  // Hash operations
  public async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      console.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  public async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      const result = await this.client.hSet(key, field, value);
      return result >= 0;
    } catch (error) {
      console.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  public async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      console.error(`Redis HGETALL error for key ${key}:`, error);
      return null;
    }
  }

  public async hdel(key: string, field: string | string[]): Promise<number> {
    try {
      return await this.client.hDel(key, field);
    } catch (error) {
      console.error(`Redis HDEL error for key ${key}, field(s) ${field}:`, error);
      return 0;
    }
  }

  // List operations
  public async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lPush(key, values);
    } catch (error) {
      console.error(`Redis LPUSH error for key ${key}:`, error);
      return 0;
    }
  }

  public async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key);
    } catch (error) {
      console.error(`Redis RPOP error for key ${key}:`, error);
      return null;
    }
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop);
    } catch (error) {
      console.error(`Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  // Set operations
  public async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sAdd(key, members);
    } catch (error) {
      console.error(`Redis SADD error for key ${key}:`, error);
      return 0;
    }
  }

  public async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      console.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  public async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sRem(key, members);
    } catch (error) {
      console.error(`Redis SREM error for key ${key}:`, error);
      return 0;
    }
  }

  // Cache helper methods
  public async cache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.getJSON<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache the result
    const result = await fetcher();
    await this.setJSON(key, result, ttl);
    return result;
  }

  public async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.del(keys);
      }
      return 0;
    } catch (error) {
      console.error(`Redis invalidatePattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Session management
  public async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.setJSON(key, data, ttl);
  }

  public async getSession<T = any>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return await this.getJSON<T>(key);
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    const result = await this.del(key);
    return result > 0;
  }

  // Pub/Sub for real-time notifications
  public async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.client.publish(channel, message);
    } catch (error) {
      console.error(`Redis PUBLISH error for channel ${channel}:`, error);
      return 0;
    }
  }

  public async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(channel, callback);
    } catch (error) {
      console.error(`Redis SUBSCRIBE error for channel ${channel}:`, error);
    }
  }
}

// Export singleton instance
export const redis = Redis.getInstance();
export default redis;