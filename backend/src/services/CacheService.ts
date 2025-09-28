import { createClient, RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts } from 'redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  compress?: boolean; // Compress large values
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

export interface CacheInfo {
  key: string;
  ttl: number;
  size: number;
  type: string;
}

type RedisClient = RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;

export class CacheService {
  private client: RedisClient | null = null;
  private isConnected: boolean = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };
  private defaultTtl: number = 3600; // 1 hour default
  private keyPrefix: string = 'congresstracker:';

  constructor(options?: {
    url?: string;
    defaultTtl?: number;
    keyPrefix?: string;
  }) {
    const redisUrl = options?.url || process.env.REDIS_URL || 'redis://localhost:6379';
    this.defaultTtl = options?.defaultTtl || 3600;
    this.keyPrefix = options?.keyPrefix || 'congresstracker:';

    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            console.error('Redis reconnection failed after 20 attempts');
            return false;
          }
          return Math.min(retries * 50, 1000);
        }
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      console.log('✅ Redis client connected');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis client error:', error);
      this.stats.errors++;
      this.isConnected = false;
    });

    this.client.on('end', () => {
      console.log('🔌 Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis client reconnecting...');
      this.isConnected = false;
    });

    this.client.on('ready', () => {
      console.log('🚀 Redis client ready');
      this.isConnected = true;
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    if (this.isConnected) {
      return;
    }

    try {
      await this.client.connect();
      console.log('✅ Redis connection established');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        console.log('✅ Redis disconnected successfully');
      } catch (error) {
        console.error('❌ Error disconnecting from Redis:', error);
        throw error;
      }
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isReady()) {
      console.warn('⚠️ Redis not ready, skipping cache get');
      this.stats.misses++;
      return null;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const value = await this.client!.get(fullKey);
      
      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        // Return as string if not JSON
        return value as T;
      }
    } catch (error) {
      console.error(`❌ Cache get error for key ${key}:`, error);
      this.stats.errors++;
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('⚠️ Redis not ready, skipping cache set');
      return false;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const ttl = options?.ttl || this.defaultTtl;
      
      let serializedValue: string;
      if (typeof value === 'string') {
        serializedValue = value;
      } else {
        serializedValue = JSON.stringify(value);
      }

      // Compress if enabled and value is large
      if (options?.compress && serializedValue.length > 1000) {
        // Note: In production, you might want to use a compression library like zlib
        console.log(`📦 Large value cached for key ${key} (${serializedValue.length} chars)`);
      }

      await this.client!.setEx(fullKey, ttl, serializedValue);
      this.stats.sets++;
      return true;
    } catch (error) {
      console.error(`❌ Cache set error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('⚠️ Redis not ready, skipping cache delete');
      return false;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const result = await this.client!.del(fullKey);
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      console.error(`❌ Cache delete error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const result = await this.client!.exists(fullKey);
      return result > 0;
    } catch (error) {
      console.error(`❌ Cache exists error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async getMultiple<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isReady() || keys.length === 0) {
      return new Array(keys.length).fill(null);
    }

    try {
      const fullKeys = keys.map(key => this.keyPrefix + key);
      const values = await this.client!.mGet(fullKeys);
      
      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }

        this.stats.hits++;
        
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      });
    } catch (error) {
      console.error('❌ Cache getMultiple error:', error);
      this.stats.errors++;
      this.stats.misses += keys.length;
      return new Array(keys.length).fill(null);
    }
  }

  /**
   * Set multiple values in cache
   */
  async setMultiple(entries: { key: string; value: any; ttl?: number }[]): Promise<boolean> {
    if (!this.isReady() || entries.length === 0) {
      return false;
    }

    try {
      const pipeline = this.client!.multi();
      
      for (const entry of entries) {
        const fullKey = this.keyPrefix + entry.key;
        const ttl = entry.ttl || this.defaultTtl;
        
        let serializedValue: string;
        if (typeof entry.value === 'string') {
          serializedValue = entry.value;
        } else {
          serializedValue = JSON.stringify(entry.value);
        }

        pipeline.setEx(fullKey, ttl, serializedValue);
      }

      await pipeline.exec();
      this.stats.sets += entries.length;
      return true;
    } catch (error) {
      console.error('❌ Cache setMultiple error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Clear all cache entries with the current prefix
   */
  async clearAll(): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const pattern = this.keyPrefix + '*';
      const keys = await this.client!.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const deletedCount = await this.client!.del(keys);
      this.stats.deletes += deletedCount;
      
      console.log(`🗑️ Cleared ${deletedCount} cache entries`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Cache clearAll error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Get TTL for a key
   */
  async getTtl(key: string): Promise<number> {
    if (!this.isReady()) {
      return -1;
    }

    try {
      const fullKey = this.keyPrefix + key;
      return await this.client!.ttl(fullKey);
    } catch (error) {
      console.error(`❌ Cache getTtl error for key ${key}:`, error);
      this.stats.errors++;
      return -1;
    }
  }

  /**
   * Extend TTL for a key
   */
  async extendTtl(key: string, additionalSeconds: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const currentTtl = await this.client!.ttl(fullKey);
      
      if (currentTtl === -1) {
        // Key exists but has no expiration
        await this.client!.expire(fullKey, additionalSeconds);
      } else if (currentTtl > 0) {
        // Key exists with expiration
        await this.client!.expire(fullKey, currentTtl + additionalSeconds);
      } else {
        // Key doesn't exist
        return false;
      }

      return true;
    } catch (error) {
      console.error(`❌ Cache extendTtl error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRatio: number } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRatio = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      hitRatio: parseFloat(hitRatio.toFixed(2))
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * Get information about cached keys
   */
  async getKeyInfo(pattern?: string): Promise<CacheInfo[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      const searchPattern = pattern ? this.keyPrefix + pattern : this.keyPrefix + '*';
      const keys = await this.client!.keys(searchPattern);
      
      const keyInfos: CacheInfo[] = [];
      
      for (const fullKey of keys) {
        const key = fullKey.replace(this.keyPrefix, '');
        const ttl = await this.client!.ttl(fullKey);
        const type = await this.client!.type(fullKey);
        
        // Get approximate size (this is a simple estimation)
        let size = 0;
        try {
          const value = await this.client!.get(fullKey);
          size = value ? value.length : 0;
        } catch {
          size = 0;
        }

        keyInfos.push({
          key,
          ttl,
          size,
          type
        });
      }

      return keyInfos.sort((a, b) => b.size - a.size); // Sort by size descending
    } catch (error) {
      console.error('❌ Cache getKeyInfo error:', error);
      this.stats.errors++;
      return [];
    }
  }

  /**
   * Cache wrapper for FMP API responses
   */
  async cacheFMPResponse<T>(
    cacheKey: string,
    fetchFunction: () => Promise<T>,
    ttl: number = 86400 // 24 hours default for FMP data
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    try {
      const data = await fetchFunction();
      
      // Cache the result
      await this.set(cacheKey, data, { ttl });
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching data for cache key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Cache wrapper for database queries
   */
  async cacheDbQuery<T>(
    cacheKey: string,
    queryFunction: () => Promise<T>,
    ttl: number = 3600 // 1 hour default for DB queries
  ): Promise<T> {
    return this.cacheFMPResponse(cacheKey, queryFunction, ttl);
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const searchPattern = this.keyPrefix + pattern;
      const keys = await this.client!.keys(searchPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const deletedCount = await this.client!.del(keys);
      this.stats.deletes += deletedCount;
      
      console.log(`🗑️ Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`);
      return deletedCount;
    } catch (error) {
      console.error(`❌ Cache invalidatePattern error for pattern ${pattern}:`, error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    if (!this.isReady()) {
      return { healthy: false, error: 'Redis not connected' };
    }

    try {
      const start = Date.now();
      await this.client!.ping();
      const latency = Date.now() - start;
      
      return { healthy: true, latency };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Singleton instance for application use
let cacheServiceInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService();
  }
  return cacheServiceInstance;
}

export default CacheService;