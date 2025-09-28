import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface FMPTradeData {
  id: string;
  politician: string;
  name: string;
  date_received: string;
  transaction_date: string;
  ticker: string;
  asset_description: string;
  asset_type: string;
  type: string;
  amount: string;
  comment: string;
  source?: any;
}

export interface FMPSenateTradeResponse {
  senator: string;
  firstName: string;
  lastName: string;
  office: string;
  link: string;
  dateReceived: string;
  transactionDate: string;
  ticker: string;
  assetDescription: string;
  assetType: string;
  type: string;
  amount: string;
  comment: string;
}

export interface FMPHouseTradeResponse {
  representative: string;
  firstName: string;
  lastName: string;
  office: string;
  link: string;
  dateReceived: string;
  transactionDate: string;
  ticker: string;
  assetDescription: string;
  assetType: string;
  type: string;
  amount: string;
  comment: string;
}

export interface FMPInsiderTradingResponse {
  symbol: string;
  filingDate: string;
  transactionDate: string;
  reportingCik: string;
  transactionType: string;
  securitiesOwned: number;
  companyCik: string;
  reportingName: string;
  typeOfOwner: string;
  acquiredDisposedCode: string;
  amountOfShares: number;
  pricePerShare: number;
  securityName: string;
  link: string;
}

export interface FMPApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

interface RequestQueue {
  config: AxiosRequestConfig;
  resolve: (value: AxiosResponse) => void;
  reject: (reason: any) => void;
  timestamp: number;
}

export class FMPClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string;
  private requestQueue: RequestQueue[] = [];
  private rateLimits: RateLimitConfig;
  private requestCounts: {
    minute: { count: number; resetTime: number };
    hour: { count: number; resetTime: number };
    day: { count: number; resetTime: number };
  };
  private processing: boolean = false;

  constructor(apiKey?: string, options?: {
    baseURL?: string;
    timeout?: number;
    rateLimits?: Partial<RateLimitConfig>;
  }) {
    this.apiKey = apiKey || process.env.FMP_API_KEY || '';
    this.baseURL = options?.baseURL || 'https://financialmodelingprep.com';
    
    if (!this.apiKey) {
      throw new Error('FMP API key is required. Set FMP_API_KEY environment variable or pass apiKey parameter.');
    }

    // Default rate limits based on FMP API documentation
    this.rateLimits = {
      requestsPerMinute: 300,
      requestsPerHour: 10000,
      requestsPerDay: 100000,
      ...options?.rateLimits
    };

    // Initialize request counters
    const now = Date.now();
    this.requestCounts = {
      minute: { count: 0, resetTime: now + 60000 },
      hour: { count: 0, resetTime: now + 3600000 },
      day: { count: 0, resetTime: now + 86400000 }
    };

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: options?.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CongressionalTracker/1.0'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add API key
    this.client.interceptors.request.use(
      (config) => {
        if (!config.params) {
          config.params = {};
        }
        config.params.apikey = this.apiKey;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const fmpError: FMPApiError = {
            error: 'FMP API Error',
            message: error.response.data?.message || error.message,
            statusCode: error.response.status
          };
          
          console.error('FMP API Error:', {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url
          });

          // Handle specific HTTP status codes
          switch (error.response.status) {
            case 401:
              fmpError.message = 'Invalid API key';
              break;
            case 403:
              fmpError.message = 'API access forbidden - check subscription';
              break;
            case 429:
              fmpError.message = 'Rate limit exceeded';
              break;
            case 500:
              fmpError.message = 'FMP server error';
              break;
          }

          return Promise.reject(fmpError);
        }

        return Promise.reject({
          error: 'Network Error',
          message: error.message
        });
      }
    );
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset counters if time windows have passed
    if (now >= this.requestCounts.minute.resetTime) {
      this.requestCounts.minute = { count: 0, resetTime: now + 60000 };
    }
    if (now >= this.requestCounts.hour.resetTime) {
      this.requestCounts.hour = { count: 0, resetTime: now + 3600000 };
    }
    if (now >= this.requestCounts.day.resetTime) {
      this.requestCounts.day = { count: 0, resetTime: now + 86400000 };
    }

    // Check if we're hitting rate limits
    if (this.requestCounts.minute.count >= this.rateLimits.requestsPerMinute) {
      const waitTime = this.requestCounts.minute.resetTime - now;
      console.warn(`Rate limit hit (minute), waiting ${waitTime}ms`);
      await this.delay(waitTime);
      return this.checkRateLimit();
    }

    if (this.requestCounts.hour.count >= this.rateLimits.requestsPerHour) {
      const waitTime = this.requestCounts.hour.resetTime - now;
      console.warn(`Rate limit hit (hour), waiting ${waitTime}ms`);
      await this.delay(waitTime);
      return this.checkRateLimit();
    }

    if (this.requestCounts.day.count >= this.rateLimits.requestsPerDay) {
      const waitTime = this.requestCounts.day.resetTime - now;
      console.warn(`Rate limit hit (day), waiting ${waitTime}ms`);
      await this.delay(waitTime);
      return this.checkRateLimit();
    }
  }

  private incrementRequestCounts(): void {
    this.requestCounts.minute.count++;
    this.requestCounts.hour.count++;
    this.requestCounts.day.count++;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, Math.min(ms, 60000))); // Max 1 minute wait
  }

  private async processRequestQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      await this.checkRateLimit();
      
      const request = this.requestQueue.shift();
      if (!request) continue;

      try {
        this.incrementRequestCounts();
        const response = await this.client.request(request.config);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }

      // Small delay between requests to be nice to the API
      await this.delay(100);
    }

    this.processing = false;
  }

  private async makeRequest<T>(config: AxiosRequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        config,
        resolve: (response: AxiosResponse) => resolve(response.data),
        reject,
        timestamp: Date.now()
      });

      this.processRequestQueue();
    });
  }

  /**
   * Get latest Senate trading data
   */
  async getLatestSenateTrades(limit?: number): Promise<FMPSenateTradeResponse[]> {
    try {
      const params: any = { page: 0 };
      if (limit) params.limit = limit;

      const data = await this.makeRequest<FMPSenateTradeResponse[]>({
        method: 'GET',
        url: '/stable/senate-latest',
        params
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching Senate trades:', error);
      throw error;
    }
  }

  /**
   * Get latest House trading data
   */
  async getLatestHouseTrades(limit?: number): Promise<FMPHouseTradeResponse[]> {
    try {
      const params: any = { page: 0 };
      if (limit) params.limit = limit;

      const data = await this.makeRequest<FMPHouseTradeResponse[]>({
        method: 'GET',
        url: '/stable/house-latest',
        params
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching House trades:', error);
      throw error;
    }
  }

  /**
   * Get Senate trades by stock symbol
   */
  async getSenateTradesBySymbol(symbol: string): Promise<FMPSenateTradeResponse[]> {
    try {
      const data = await this.makeRequest<FMPSenateTradeResponse[]>({
        method: 'GET',
        url: '/stable/senate-trades',
        params: { symbol: symbol.toUpperCase() }
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching Senate trades for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get House trades by stock symbol
   */
  async getHouseTradesBySymbol(symbol: string): Promise<FMPHouseTradeResponse[]> {
    try {
      const data = await this.makeRequest<FMPHouseTradeResponse[]>({
        method: 'GET',
        url: '/stable/house-trades',
        params: { symbol: symbol.toUpperCase() }
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching House trades for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get Senate trades by politician name
   */
  async getSenateTradesByName(name: string): Promise<FMPSenateTradeResponse[]> {
    try {
      const data = await this.makeRequest<FMPSenateTradeResponse[]>({
        method: 'GET',
        url: '/stable/senate-trades-by-name',
        params: { name }
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching Senate trades for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get House trades by politician name
   */
  async getHouseTradesByName(name: string): Promise<FMPHouseTradeResponse[]> {
    try {
      const data = await this.makeRequest<FMPHouseTradeResponse[]>({
        method: 'GET',
        url: '/stable/house-trading-by-name',
        params: { name }
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching House trades for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get insider trading data by symbol
   */
  async getInsiderTradingBySymbol(symbol: string): Promise<FMPInsiderTradingResponse[]> {
    try {
      const data = await this.makeRequest<FMPInsiderTradingResponse[]>({
        method: 'GET',
        url: '/stable/insider-trading',
        params: { symbol: symbol.toUpperCase() }
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching insider trades for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get latest insider trading data
   */
  async getLatestInsiderTrades(limit?: number): Promise<FMPInsiderTradingResponse[]> {
    try {
      const params: any = {};
      if (limit) params.limit = limit;

      const data = await this.makeRequest<FMPInsiderTradingResponse[]>({
        method: 'GET',
        url: '/stable/insider-trading',
        params
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching latest insider trades:', error);
      throw error;
    }
  }

  /**
   * Test API connection and authentication
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const data = await this.makeRequest<any>({
        method: 'GET',
        url: '/stable/senate-latest',
        params: { page: 0, limit: 1 }
      });

      return {
        success: true,
        message: 'FMP API connection successful'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed'
      };
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    minute: { used: number; limit: number; resetIn: number };
    hour: { used: number; limit: number; resetIn: number };
    day: { used: number; limit: number; resetIn: number };
  } {
    const now = Date.now();
    return {
      minute: {
        used: this.requestCounts.minute.count,
        limit: this.rateLimits.requestsPerMinute,
        resetIn: Math.max(0, this.requestCounts.minute.resetTime - now)
      },
      hour: {
        used: this.requestCounts.hour.count,
        limit: this.rateLimits.requestsPerHour,
        resetIn: Math.max(0, this.requestCounts.hour.resetTime - now)
      },
      day: {
        used: this.requestCounts.day.count,
        limit: this.rateLimits.requestsPerDay,
        resetIn: Math.max(0, this.requestCounts.day.resetTime - now)
      }
    };
  }

  /**
   * Clear request queue (useful for testing or shutdown)
   */
  clearQueue(): void {
    this.requestQueue.forEach(request => {
      request.reject(new Error('Request cancelled'));
    });
    this.requestQueue = [];
    this.processing = false;
  }
}

// Singleton instance for application use
let fmpClientInstance: FMPClient | null = null;

export function getFMPClient(): FMPClient {
  if (!fmpClientInstance) {
    fmpClientInstance = new FMPClient();
  }
  return fmpClientInstance;
}

export default FMPClient;