import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { getSession } from 'next-auth/react'
import {
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CongressionalMember,
  StockTicker,
  StockTrade,
  UserAlert,
  UserFollow,
  AlertNotification,
  CreateAlertRequest,
  UpdateAlertRequest,
  CreateFollowRequest,
  TradeFilters,
  SearchRequest,
  SearchResponse,
  NotificationFilters,
  PortfolioConcentration
} from '../../../shared/types/api'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_REQUIRED')
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string; value?: unknown }>
  ) {
    super(message, 422, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

// Create axios instance with default configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  // Request interceptor for authentication
  client.interceptors.request.use(
    async (config) => {
      try {
        // Get session from NextAuth
        const session = await getSession()
        
        // For NextAuth, the token might be in different places depending on configuration
        // We'll check for common JWT token locations
        const sessionData = session as unknown as Record<string, unknown> | null;
        const token = sessionData?.accessToken ||
                     sessionData?.access_token ||
                     sessionData?.token
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = Math.random().toString(36).substring(2, 15)
        
        return config
      } catch (error) {
        console.warn('Failed to get session for API request:', error)
        return config
      }
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response
    },
    (error: AxiosError) => {
      // Handle network errors
      if (!error.response) {
        throw new NetworkError('Network error - please check your connection')
      }

      const { status, data } = error.response
      const apiError = data as ApiResponse

      // Handle different error types
      switch (status) {
        case 401:
          throw new AuthenticationError(apiError.error || 'Authentication required')
        
        case 403:
          throw new ApiError(
            apiError.error || 'Access forbidden',
            status,
            'FORBIDDEN'
          )
        
        case 422:
          // Validation errors
          const validationData = data as Record<string, unknown>
          throw new ValidationError(
            apiError.error || 'Validation failed',
            (validationData.errors as Array<{ field: string; message: string; value?: unknown }>) || []
          )
        
        case 429:
          throw new ApiError(
            apiError.error || 'Rate limit exceeded',
            status,
            'RATE_LIMITED'
          )
        
        case 500:
          throw new ApiError(
            'Internal server error - please try again later',
            status,
            'INTERNAL_ERROR'
          )
        
        default:
          throw new ApiError(
            apiError.error || `HTTP ${status} error`,
            status,
            apiError.code
          )
      }
    }
  )

  return client
}

// Create the singleton API client
const apiClient = createApiClient()

// Generic API request helper
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await apiClient.request<ApiResponse<T>>({
      method,
      url,
      data,
      ...config,
    })
    
    // Return the data directly, as our API wraps responses
    return response.data.data as T
  } catch (error) {
    // Re-throw our custom errors
    throw error
  }
}

// Authentication API
export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('POST', '/auth/login', credentials)
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('POST', '/auth/register', userData)
  },

  async getProfile(): Promise<ApiResponse['data']> {
    return request('GET', '/auth/profile')
  },

  async refreshToken(): Promise<AuthResponse> {
    return request<AuthResponse>('POST', '/auth/refresh')
  },
}

// Search API
export const searchApi = {
  async search(params: SearchRequest): Promise<SearchResponse> {
    return request<SearchResponse>('GET', '/search', undefined, { params })
  },
}

// Trades API
export const tradesApi = {
  async getTrades(filters?: TradeFilters): Promise<PaginatedResponse<StockTrade>> {
    return request<PaginatedResponse<StockTrade>>('GET', '/trades', undefined, { params: filters })
  },

  async getTradeById(id: string): Promise<StockTrade> {
    return request<StockTrade>('GET', `/trades/${id}`)
  },

  async getPoliticianTrades(politicianId: string, filters?: TradeFilters): Promise<PaginatedResponse<StockTrade>> {
    return request<PaginatedResponse<StockTrade>>(
      'GET',
      `/trades/politician/${politicianId}`,
      undefined,
      { params: filters }
    )
  },

  async getStockTrades(symbol: string, filters?: TradeFilters): Promise<PaginatedResponse<StockTrade>> {
    return request<PaginatedResponse<StockTrade>>(
      'GET',
      `/trades/stock/${symbol}`,
      undefined,
      { params: filters }
    )
  },

  async getRecentTrades(limit?: number): Promise<StockTrade[]> {
    return request<StockTrade[]>('GET', '/trades/recent', undefined, {
      params: { limit }
    })
  },
}

// Politicians API
export const politiciansApi = {
  async getPoliticians(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<CongressionalMember>> {
    return request<PaginatedResponse<CongressionalMember>>('GET', '/politicians', undefined, { params })
  },

  async getPoliticianById(id: string): Promise<CongressionalMember> {
    return request<CongressionalMember>('GET', `/politicians/${id}`)
  },
}

// Stocks API
export const stocksApi = {
  async getStocks(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<StockTicker>> {
    return request<PaginatedResponse<StockTicker>>('GET', '/stocks', undefined, { params })
  },

  async getStockBySymbol(symbol: string): Promise<StockTicker> {
    return request<StockTicker>('GET', `/stocks/${symbol}`)
  },
}

// Alerts API
export const alertsApi = {
  async getAlerts(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<UserAlert>> {
    return request<PaginatedResponse<UserAlert>>('GET', '/alerts', undefined, { params })
  },

  async createAlert(alertData: CreateAlertRequest): Promise<UserAlert> {
    return request<UserAlert>('POST', '/alerts', alertData)
  },

  async updateAlert(id: string, updateData: UpdateAlertRequest): Promise<UserAlert> {
    return request<UserAlert>('PUT', `/alerts/${id}`, updateData)
  },

  async deleteAlert(id: string): Promise<void> {
    return request<void>('DELETE', `/alerts/${id}`)
  },

  async getAlertById(id: string): Promise<UserAlert> {
    return request<UserAlert>('GET', `/alerts/${id}`)
  },
}

// Follows API
export const followsApi = {
  async getFollows(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<UserFollow>> {
    return request<PaginatedResponse<UserFollow>>('GET', '/follows', undefined, { params })
  },

  async createFollow(followData: CreateFollowRequest): Promise<UserFollow> {
    return request<UserFollow>('POST', '/follows', followData)
  },

  async unfollow(id: string): Promise<void> {
    return request<void>('DELETE', `/follows/${id}`)
  },

  async getFollowById(id: string): Promise<UserFollow> {
    return request<UserFollow>('GET', `/follows/${id}`)
  },
}

// Analytics API
export const analyticsApi = {
  async getPortfolioConcentration(traderId: string): Promise<PortfolioConcentration> {
    return request<PortfolioConcentration>('GET', `/analytics/portfolio-concentration/${traderId}`)
  },

  async getTradingPatterns(traderId: string, params?: { timeframe?: string }): Promise<unknown> {
    return request('GET', `/analytics/trading-patterns/${traderId}`, undefined, { params })
  },

  async getMarketTrends(params?: { timeframe?: string; sector?: string }): Promise<unknown> {
    return request('GET', '/analytics/market-trends', undefined, { params })
  },

  async getRankings(params?: { metric?: string; limit?: number }): Promise<unknown> {
    return request('GET', '/analytics/rankings', undefined, { params })
  },
}

// Notifications API
export const notificationsApi = {
  async getNotifications(filters?: NotificationFilters): Promise<PaginatedResponse<AlertNotification>> {
    return request<PaginatedResponse<AlertNotification>>('GET', '/notifications', undefined, {
      params: filters
    })
  },

  async markAsRead(id: string): Promise<void> {
    return request<void>('PATCH', `/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    return request<void>('PATCH', '/notifications/mark-all-read')
  },
}

// Health check
export const healthApi = {
  async check(): Promise<{ status: string; timestamp: string }> {
    return request('GET', '/health')
  },
}

// Export the main API client for direct use if needed
export { apiClient }

// Export all APIs as a grouped object
export const api = {
  auth: authApi,
  search: searchApi,
  trades: tradesApi,
  politicians: politiciansApi,
  stocks: stocksApi,
  alerts: alertsApi,
  follows: followsApi,
  analytics: analyticsApi,
  notifications: notificationsApi,
  health: healthApi,
}

// Default export
export default api