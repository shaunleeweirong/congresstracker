import axios from 'axios'
import { getSession } from 'next-auth/react'

// Mock modules before any imports
jest.mock('axios')
jest.mock('next-auth/react')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedGetSession = getSession as jest.MockedFunction<typeof getSession>

// Mock axios instance
const mockAxiosInstance = {
  request: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
}

// Setup axios.create mock
mockedAxios.create.mockReturnValue(mockAxiosInstance as any)

// Import API after mocks are setup
let authApi: any, searchApi: any, tradesApi: any, politiciansApi: any, stocksApi: any, alertsApi: any, followsApi: any, analyticsApi: any, notificationsApi: any, healthApi: any, api: any

beforeAll(() => {
  const apiModule = require('../../src/lib/api')
  authApi = apiModule.authApi
  searchApi = apiModule.searchApi
  tradesApi = apiModule.tradesApi
  politiciansApi = apiModule.politiciansApi
  stocksApi = apiModule.stocksApi
  alertsApi = apiModule.alertsApi
  followsApi = apiModule.followsApi
  analyticsApi = apiModule.analyticsApi
  notificationsApi = apiModule.notificationsApi
  healthApi = apiModule.healthApi
  api = apiModule.api
})

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Module Configuration', () => {
    it('should export all API groups', () => {
      expect(api).toHaveProperty('auth')
      expect(api).toHaveProperty('search')
      expect(api).toHaveProperty('trades')
      expect(api).toHaveProperty('politicians')
      expect(api).toHaveProperty('stocks')
      expect(api).toHaveProperty('alerts')
      expect(api).toHaveProperty('follows')
      expect(api).toHaveProperty('analytics')
      expect(api).toHaveProperty('notifications')
      expect(api).toHaveProperty('health')
    })

    it('should have created axios instance during module load', () => {
      // The API module calls axios.create internally, verify it was called
      expect(mockedAxios.create).toHaveBeenCalled()
      
      // Verify it was called with the expected configuration structure
      const createCall = mockedAxios.create.mock.calls[0]
      expect(createCall).toBeDefined()
      expect(createCall[0]).toEqual({
        baseURL: expect.stringMatching(/api\/v1$/),
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
    })
  })

  describe('Auth API', () => {
    beforeEach(() => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          success: true,
          data: { token: 'test-token', user: { id: '1' } },
          message: 'Success',
        },
      })
    })

    it('should login user with credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password' }
      
      const result = await authApi.login(credentials)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/auth/login',
        data: credentials,
      })
      expect(result).toEqual({ token: 'test-token', user: { id: '1' } })
    })

    it('should register new user', async () => {
      const userData = { 
        email: 'test@example.com', 
        password: 'password',
        firstName: 'John',
        lastName: 'Doe'
      }
      
      const result = await authApi.register(userData)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/auth/register',
        data: userData,
      })
      expect(result).toEqual({ token: 'test-token', user: { id: '1' } })
    })

    it('should get user profile', async () => {
      const profileData = { id: '1', email: 'test@example.com' }
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: profileData, message: 'Success' }
      })

      const result = await authApi.getProfile()

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/auth/profile',
        data: undefined,
      })
      expect(result).toEqual(profileData)
    })

    it('should refresh token', async () => {
      const tokenData = { token: 'new-token' }
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: tokenData, message: 'Success' }
      })

      const result = await authApi.refreshToken()

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/auth/refresh',
        data: undefined,
      })
      expect(result).toEqual(tokenData)
    })
  })

  describe('Search API', () => {
    it('should search with query parameters', async () => {
      const searchParams = { query: 'Nancy Pelosi', type: 'politician' as const }
      const searchResults = {
        politicians: [{ id: '1', name: 'Nancy Pelosi' }],
        stocks: [],
        total: 1
      }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: searchResults, message: 'Success' }
      })

      const result = await searchApi.search(searchParams)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/search',
        data: undefined,
        params: searchParams,
      })
      expect(result).toEqual(searchResults)
    })
  })

  describe('Trades API', () => {
    it('should get trades with filters', async () => {
      const filters = { page: 1, limit: 10, traderType: 'congressional' as const }
      const tradesData = {
        items: [{ id: '1', tickerSymbol: 'AAPL' }],
        pagination: { page: 1, limit: 10, total: 100 }
      }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: tradesData, message: 'Success' }
      })

      const result = await tradesApi.getTrades(filters)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/trades',
        data: undefined,
        params: filters,
      })
      expect(result).toEqual(tradesData)
    })

    it('should get trade by ID', async () => {
      const tradeId = 'trade-123'
      const tradeData = { id: tradeId, tickerSymbol: 'AAPL', transactionType: 'buy' }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: tradeData, message: 'Success' }
      })

      const result = await tradesApi.getTradeById(tradeId)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/trades/${tradeId}`,
        data: undefined,
      })
      expect(result).toEqual(tradeData)
    })

    it('should get politician trades', async () => {
      const politicianId = 'politician-123'
      const filters = { limit: 5 }
      const tradesData = {
        items: [{ id: '1', traderId: politicianId }],
        pagination: { page: 1, limit: 5, total: 20 }
      }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: tradesData, message: 'Success' }
      })

      const result = await tradesApi.getPoliticianTrades(politicianId, filters)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/trades/politician/${politicianId}`,
        data: undefined,
        params: filters,
      })
      expect(result).toEqual(tradesData)
    })

    it('should get stock trades', async () => {
      const symbol = 'AAPL'
      const tradesData = {
        items: [{ id: '1', tickerSymbol: symbol }],
        pagination: { page: 1, limit: 10, total: 50 }
      }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: tradesData, message: 'Success' }
      })

      const result = await tradesApi.getStockTrades(symbol)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/trades/stock/${symbol}`,
        data: undefined,
        params: undefined,
      })
      expect(result).toEqual(tradesData)
    })

    it('should get recent trades', async () => {
      const limit = 5
      const tradesData = [
        { id: '1', tickerSymbol: 'AAPL' },
        { id: '2', tickerSymbol: 'TSLA' }
      ]
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: tradesData, message: 'Success' }
      })

      const result = await tradesApi.getRecentTrades(limit)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/trades/recent',
        data: undefined,
        params: { limit },
      })
      expect(result).toEqual(tradesData)
    })
  })

  describe('Politicians API', () => {
    it('should get politicians list', async () => {
      const params = { page: 1, limit: 10, search: 'Nancy' }
      const politiciansData = {
        items: [{ id: '1', name: 'Nancy Pelosi' }],
        pagination: { page: 1, limit: 10, total: 1 }
      }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: politiciansData, message: 'Success' }
      })

      const result = await politiciansApi.getPoliticians(params)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/politicians',
        data: undefined,
        params,
      })
      expect(result).toEqual(politiciansData)
    })

    it('should get politician by ID', async () => {
      const politicianId = 'politician-123'
      const politicianData = { id: politicianId, name: 'Nancy Pelosi', position: 'representative' }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: politicianData, message: 'Success' }
      })

      const result = await politiciansApi.getPoliticianById(politicianId)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/politicians/${politicianId}`,
        data: undefined,
      })
      expect(result).toEqual(politicianData)
    })
  })

  describe('Stocks API', () => {
    it('should get stocks list', async () => {
      const params = { page: 1, limit: 10, search: 'Apple' }
      const stocksData = {
        items: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }],
        pagination: { page: 1, limit: 10, total: 1 }
      }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: stocksData, message: 'Success' }
      })

      const result = await stocksApi.getStocks(params)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/stocks',
        data: undefined,
        params,
      })
      expect(result).toEqual(stocksData)
    })

    it('should get stock by symbol', async () => {
      const symbol = 'AAPL'
      const stockData = { symbol, companyName: 'Apple Inc.', sector: 'Technology' }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: stockData, message: 'Success' }
      })

      const result = await stocksApi.getStockBySymbol(symbol)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/stocks/${symbol}`,
        data: undefined,
      })
      expect(result).toEqual(stockData)
    })
  })

  describe('Alerts API', () => {
    it('should get alerts list', async () => {
      const params = { page: 1, limit: 10, status: 'active' }
      const alertsData = {
        items: [{ id: '1', alertType: 'politician', status: 'active' }],
        pagination: { page: 1, limit: 10, total: 1 }
      }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: alertsData, message: 'Success' }
      })

      const result = await alertsApi.getAlerts(params)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/alerts',
        data: undefined,
        params,
      })
      expect(result).toEqual(alertsData)
    })

    it('should create alert', async () => {
      const alertData = { alertType: 'politician' as const, targetId: 'politician-123', alertConditions: {} }
      const createdAlert = { id: 'alert-123', ...alertData, status: 'active' }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: createdAlert, message: 'Success' }
      })

      const result = await alertsApi.createAlert(alertData)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/alerts',
        data: alertData,
      })
      expect(result).toEqual(createdAlert)
    })

    it('should update alert', async () => {
      const alertId = 'alert-123'
      const updateData = { status: 'paused' as const }
      const updatedAlert = { id: alertId, status: 'paused' }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: updatedAlert, message: 'Success' }
      })

      const result = await alertsApi.updateAlert(alertId, updateData)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: `/alerts/${alertId}`,
        data: updateData,
      })
      expect(result).toEqual(updatedAlert)
    })

    it('should delete alert', async () => {
      const alertId = 'alert-123'
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: undefined, message: 'Success' }
      })

      await alertsApi.deleteAlert(alertId)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: `/alerts/${alertId}`,
        data: undefined,
      })
    })

    it('should get alert by ID', async () => {
      const alertId = 'alert-123'
      const alertData = { id: alertId, alertType: 'politician', status: 'active' }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: alertData, message: 'Success' }
      })

      const result = await alertsApi.getAlertById(alertId)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/alerts/${alertId}`,
        data: undefined,
      })
      expect(result).toEqual(alertData)
    })
  })

  describe('Follows API', () => {
    it('should get follows list', async () => {
      const params = { page: 1, limit: 10, status: 'active' }
      const followsData = {
        items: [{ id: '1', politicianId: 'politician-123', status: 'active' }],
        pagination: { page: 1, limit: 10, total: 1 }
      }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: followsData, message: 'Success' }
      })

      const result = await followsApi.getFollows(params)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/follows',
        data: undefined,
        params,
      })
      expect(result).toEqual(followsData)
    })

    it('should create follow', async () => {
      const followData = { politicianId: 'politician-123' }
      const createdFollow = { id: 'follow-123', ...followData, status: 'active' }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: createdFollow, message: 'Success' }
      })

      const result = await followsApi.createFollow(followData)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/follows',
        data: followData,
      })
      expect(result).toEqual(createdFollow)
    })

    it('should unfollow', async () => {
      const followId = 'follow-123'
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: undefined, message: 'Success' }
      })

      await followsApi.unfollow(followId)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: `/follows/${followId}`,
        data: undefined,
      })
    })

    it('should get follow by ID', async () => {
      const followId = 'follow-123'
      const followData = { id: followId, politicianId: 'politician-123', status: 'active' }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: followData, message: 'Success' }
      })

      const result = await followsApi.getFollowById(followId)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/follows/${followId}`,
        data: undefined,
      })
      expect(result).toEqual(followData)
    })
  })

  describe('Analytics API', () => {
    it('should get portfolio concentration', async () => {
      const traderId = 'politician-123'
      const concentrationData = {
        totalValue: 1000000,
        holdings: [{ symbol: 'AAPL', value: 500000, percentage: 50 }]
      }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: concentrationData, message: 'Success' }
      })

      const result = await analyticsApi.getPortfolioConcentration(traderId)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/analytics/portfolio-concentration/${traderId}`,
        data: undefined,
      })
      expect(result).toEqual(concentrationData)
    })

    it('should get trading patterns', async () => {
      const traderId = 'politician-123'
      const params = { timeframe: '1Y' }
      const patternsData = { patterns: [], insights: [] }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: patternsData, message: 'Success' }
      })

      const result = await analyticsApi.getTradingPatterns(traderId, params)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/analytics/trading-patterns/${traderId}`,
        data: undefined,
        params,
      })
      expect(result).toEqual(patternsData)
    })

    it('should get market trends', async () => {
      const params = { timeframe: '1M', sector: 'Technology' }
      const trendsData = { trends: [], summary: {} }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: trendsData, message: 'Success' }
      })

      const result = await analyticsApi.getMarketTrends(params)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/analytics/market-trends',
        data: undefined,
        params,
      })
      expect(result).toEqual(trendsData)
    })

    it('should get rankings', async () => {
      const params = { metric: 'total_value', limit: 10 }
      const rankingsData = { rankings: [], metadata: {} }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: rankingsData, message: 'Success' }
      })

      const result = await analyticsApi.getRankings(params)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/analytics/rankings',
        data: undefined,
        params,
      })
      expect(result).toEqual(rankingsData)
    })
  })

  describe('Notifications API', () => {
    it('should get notifications', async () => {
      const filters = { page: 1, limit: 10, read: false }
      const notificationsData = {
        items: [{ id: '1', message: 'New trade alert', read: false }],
        pagination: { page: 1, limit: 10, total: 1 }
      }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: notificationsData, message: 'Success' }
      })

      const result = await notificationsApi.getNotifications(filters)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/notifications',
        data: undefined,
        params: filters,
      })
      expect(result).toEqual(notificationsData)
    })

    it('should mark notification as read', async () => {
      const notificationId = 'notification-123'
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: undefined, message: 'Success' }
      })

      await notificationsApi.markAsRead(notificationId)

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: `/notifications/${notificationId}/read`,
        data: undefined,
      })
    })

    it('should mark all notifications as read', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: undefined, message: 'Success' }
      })

      await notificationsApi.markAllAsRead()

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/notifications/mark-all-read',
        data: undefined,
      })
    })
  })

  describe('Health API', () => {
    it('should check health status', async () => {
      const healthData = { status: 'healthy', timestamp: '2023-12-01T10:00:00Z' }
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: healthData, message: 'Success' }
      })

      const result = await healthApi.check()

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/health',
        data: undefined,
      })
      expect(result).toEqual(healthData)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors correctly', async () => {
      const error = new Error('Network Error')
      mockAxiosInstance.request.mockRejectedValue(error)

      await expect(authApi.login({ email: 'test', password: 'test' })).rejects.toThrow('Network Error')
    })

    it('should handle axios errors with response data', async () => {
      const axiosError = {
        response: {
          status: 401,
          data: {
            success: false,
            error: 'Unauthorized'
          }
        },
        message: 'Request failed with status code 401'
      }

      mockAxiosInstance.request.mockRejectedValue(axiosError)

      await expect(authApi.login({ email: 'test', password: 'test' })).rejects.toThrow()
    })
  })

  describe('Custom Error Classes', () => {
    it('should create ApiError with correct properties', () => {
      const { ApiError } = require('../../src/lib/api')
      const error = new ApiError('Test error', 400, 'TEST_ERROR', { field: 'value' })
      
      expect(error.name).toBe('ApiError')
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(400)
      expect(error.code).toBe('TEST_ERROR')
      expect(error.details).toEqual({ field: 'value' })
    })

    it('should create NetworkError with correct properties', () => {
      const { NetworkError } = require('../../src/lib/api')
      const error = new NetworkError('Network failure')
      
      expect(error.name).toBe('NetworkError')
      expect(error.message).toBe('Network failure')
    })

    it('should create AuthenticationError with correct properties', () => {
      const { AuthenticationError } = require('../../src/lib/api')
      const error = new AuthenticationError('Custom auth message')
      
      expect(error.name).toBe('AuthenticationError')
      expect(error.message).toBe('Custom auth message')
      expect(error.status).toBe(401)
      expect(error.code).toBe('AUTH_REQUIRED')
    })

    it('should create ValidationError with correct properties', () => {
      const { ValidationError } = require('../../src/lib/api')
      const errors = [{ field: 'email', message: 'Invalid email' }]
      const error = new ValidationError('Validation failed', errors)
      
      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Validation failed')
      expect(error.status).toBe(422)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.errors).toEqual(errors)
    })
  })
})