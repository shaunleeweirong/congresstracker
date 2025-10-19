import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import useSWR, { mutate } from 'swr'
import { api } from '../../src/lib/api'
import {
  useProfile,
  useSearch,
  useTrades,
  useTrade,
  usePoliticianTrades,
  useStockTrades,
  useRecentTrades,
  usePoliticians,
  usePolitician,
  useStocks,
  useStock,
  useAlerts,
  useAlert,
  useFollows,
  useFollow,
  usePortfolioConcentration,
  useTradingPatterns,
  useMarketTrends,
  useRankings,
  useNotifications,
  useHealth,
  useCreateAlert,
  useUpdateAlert,
  useDeleteAlert,
  useCreateFollow,
  useUnfollow,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useRefreshData,
  usePreloadData,
} from '../../src/hooks/useApi'

// Mock SWR
jest.mock('swr')
const mockedUseSWR = useSWR as jest.MockedFunction<typeof useSWR>
const mockedMutate = mutate as jest.MockedFunction<typeof mutate>

// Mock API
jest.mock('../../src/lib/api')
const mockedApi = api as jest.Mocked<typeof api>

// SWR mock response helper
const createSWRResponse = <T,>(data: T, isLoading = false, error?: Error) => ({
  data,
  error,
  isLoading,
  isValidating: false,
  mutate: jest.fn(),
})

describe('useApi Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Auth Hooks', () => {
    describe('useProfile', () => {
      it('should fetch user profile with correct SWR configuration', () => {
        const mockProfile = { id: '1', email: 'test@example.com', name: 'John Doe' }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockProfile))
        mockedApi.auth.getProfile.mockResolvedValue(mockProfile)

        const { result } = renderHook(() => useProfile())

        expect(mockedUseSWR).toHaveBeenCalledWith(
          '/auth/profile',
          expect.any(Function),
          expect.objectContaining({
            revalidateOnFocus: true,
          })
        )
        expect(result.current.data).toEqual(mockProfile)
      })

      it('should handle profile fetch error', () => {
        const error = new Error('Unauthorized')
        mockedUseSWR.mockReturnValue(createSWRResponse(null, false, error))

        const { result } = renderHook(() => useProfile())

        expect(result.current.error).toEqual(error)
        expect(result.current.data).toBeNull()
      })
    })
  })

  describe('Search Hooks', () => {
    describe('useSearch', () => {
      it('should search with valid parameters', () => {
        const searchParams = { query: 'Nancy Pelosi', type: 'politician' as const }
        const mockResponse = {
          politicians: [{ id: '1', name: 'Nancy Pelosi' }],
          stocks: [],
          total: 1
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockResponse))
        mockedApi.search.search.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useSearch(searchParams))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/search', searchParams],
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockResponse)
      })

      it('should not fetch when params are null', () => {
        mockedUseSWR.mockReturnValue(createSWRResponse(null))

        const { result } = renderHook(() => useSearch(null))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          null,
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toBeNull()
      })

      it('should accept custom SWR configuration', () => {
        const searchParams = { query: 'test', type: 'all' as const }
        const customConfig = { refreshInterval: 5000 }
        mockedUseSWR.mockReturnValue(createSWRResponse(null))

        renderHook(() => useSearch(searchParams, customConfig))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/search', searchParams],
          expect.any(Function),
          expect.objectContaining(customConfig)
        )
      })
    })
  })

  describe('Trade Hooks', () => {
    describe('useTrades', () => {
      it('should fetch trades with default refresh interval', () => {
        const mockTrades = {
          items: [{ id: '1', tickerSymbol: 'AAPL' }],
          pagination: { page: 1, limit: 10, total: 100 }
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockTrades))
        mockedApi.trades.getTrades.mockResolvedValue(mockTrades)

        const { result } = renderHook(() => useTrades())

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/trades', undefined],
          expect.any(Function),
          expect.objectContaining({
            refreshInterval: 60000,
          })
        )
        expect(result.current.data).toEqual(mockTrades)
      })

      it('should fetch trades with filters', () => {
        const filters = { page: 1, limit: 5, traderType: 'congressional' as const }
        const mockTrades = {
          items: [{ id: '1', tickerSymbol: 'AAPL' }],
          pagination: { page: 1, limit: 5, total: 50 }
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockTrades))
        mockedApi.trades.getTrades.mockResolvedValue(mockTrades)

        const { result } = renderHook(() => useTrades(filters))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/trades', filters],
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockTrades)
      })
    })

    describe('useTrade', () => {
      it('should fetch single trade by ID', () => {
        const tradeId = 'trade-123'
        const mockTrade = { id: tradeId, tickerSymbol: 'AAPL', transactionType: 'buy' }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockTrade))
        mockedApi.trades.getTradeById.mockResolvedValue(mockTrade)

        const { result } = renderHook(() => useTrade(tradeId))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          `/trades/${tradeId}`,
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockTrade)
      })

      it('should not fetch when ID is null', () => {
        mockedUseSWR.mockReturnValue(createSWRResponse(null))

        const { result } = renderHook(() => useTrade(null))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          null,
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toBeNull()
      })
    })

    describe('usePoliticianTrades', () => {
      it('should fetch politician trades with refresh interval', () => {
        const politicianId = 'politician-123'
        const mockTrades = {
          items: [{ id: '1', traderId: politicianId }],
          pagination: { page: 1, limit: 10, total: 20 }
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockTrades))
        mockedApi.trades.getPoliticianTrades.mockResolvedValue(mockTrades)

        const { result } = renderHook(() => usePoliticianTrades(politicianId))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          [`/trades/politician/${politicianId}`, undefined],
          expect.any(Function),
          expect.objectContaining({
            refreshInterval: 60000,
          })
        )
        expect(result.current.data).toEqual(mockTrades)
      })

      it('should not fetch when politician ID is null', () => {
        mockedUseSWR.mockReturnValue(createSWRResponse(null))

        const { result } = renderHook(() => usePoliticianTrades(null))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          null,
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toBeNull()
      })
    })

    describe('useStockTrades', () => {
      it('should fetch stock trades with refresh interval', () => {
        const symbol = 'AAPL'
        const mockTrades = {
          items: [{ id: '1', tickerSymbol: symbol }],
          pagination: { page: 1, limit: 10, total: 50 }
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockTrades))
        mockedApi.trades.getStockTrades.mockResolvedValue(mockTrades)

        const { result } = renderHook(() => useStockTrades(symbol))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          [`/trades/stock/${symbol}`, undefined],
          expect.any(Function),
          expect.objectContaining({
            refreshInterval: 60000,
          })
        )
        expect(result.current.data).toEqual(mockTrades)
      })
    })

    describe('useRecentTrades', () => {
      it('should fetch recent trades with 30 second refresh', () => {
        const limit = 5
        const mockTrades = [
          { id: '1', tickerSymbol: 'AAPL' },
          { id: '2', tickerSymbol: 'TSLA' }
        ]
        mockedUseSWR.mockReturnValue(createSWRResponse(mockTrades))
        mockedApi.trades.getRecentTrades.mockResolvedValue(mockTrades)

        const { result } = renderHook(() => useRecentTrades(limit))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/trades/recent', limit],
          expect.any(Function),
          expect.objectContaining({
            refreshInterval: 30000,
          })
        )
        expect(result.current.data).toEqual(mockTrades)
      })
    })
  })

  describe('Politicians Hooks', () => {
    describe('usePoliticians', () => {
      it('should fetch politicians list', () => {
        const params = { page: 1, limit: 10, search: 'Nancy' }
        const mockResponse = {
          items: [{ id: '1', name: 'Nancy Pelosi' }],
          pagination: { page: 1, limit: 10, total: 1 }
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockResponse))
        mockedApi.politicians.getPoliticians.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => usePoliticians(params))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/politicians', params],
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockResponse)
      })
    })

    describe('usePolitician', () => {
      it('should fetch politician by ID', () => {
        const politicianId = 'politician-123'
        const mockPolitician = { id: politicianId, name: 'Nancy Pelosi', position: 'representative' }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockPolitician))
        mockedApi.politicians.getPoliticianById.mockResolvedValue(mockPolitician)

        const { result } = renderHook(() => usePolitician(politicianId))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          `/politicians/${politicianId}`,
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockPolitician)
      })
    })
  })

  describe('Stocks Hooks', () => {
    describe('useStocks', () => {
      it('should fetch stocks list', () => {
        const params = { page: 1, limit: 10, search: 'Apple' }
        const mockResponse = {
          items: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }],
          pagination: { page: 1, limit: 10, total: 1 }
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockResponse))
        mockedApi.stocks.getStocks.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useStocks(params))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/stocks', params],
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockResponse)
      })
    })

    describe('useStock', () => {
      it('should fetch stock by symbol', () => {
        const symbol = 'AAPL'
        const mockStock = { symbol, companyName: 'Apple Inc.', sector: 'Technology' }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockStock))
        mockedApi.stocks.getStockBySymbol.mockResolvedValue(mockStock)

        const { result } = renderHook(() => useStock(symbol))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          `/stocks/${symbol}`,
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockStock)
      })
    })
  })

  describe('Alerts Hooks', () => {
    describe('useAlerts', () => {
      it('should fetch alerts list', () => {
        const params = { page: 1, limit: 10, status: 'active' }
        const mockResponse = {
          items: [{ id: '1', alertType: 'politician', status: 'active' }],
          pagination: { page: 1, limit: 10, total: 1 }
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockResponse))
        mockedApi.alerts.getAlerts.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useAlerts(params))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/alerts', params],
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockResponse)
      })
    })

    describe('useAlert', () => {
      it('should fetch alert by ID', () => {
        const alertId = 'alert-123'
        const mockAlert = { id: alertId, alertType: 'politician', status: 'active' }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockAlert))
        mockedApi.alerts.getAlertById.mockResolvedValue(mockAlert)

        const { result } = renderHook(() => useAlert(alertId))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          `/alerts/${alertId}`,
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockAlert)
      })
    })
  })

  describe('Follows Hooks', () => {
    describe('useFollows', () => {
      it('should fetch follows list', () => {
        const params = { page: 1, limit: 10, status: 'active' }
        const mockResponse = {
          items: [{ id: '1', politicianId: 'politician-123', status: 'active' }],
          pagination: { page: 1, limit: 10, total: 1 }
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockResponse))
        mockedApi.follows.getFollows.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useFollows(params))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/follows', params],
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockResponse)
      })
    })

    describe('useFollow', () => {
      it('should fetch follow by ID', () => {
        const followId = 'follow-123'
        const mockFollow = { id: followId, politicianId: 'politician-123', status: 'active' }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockFollow))
        mockedApi.follows.getFollowById.mockResolvedValue(mockFollow)

        const { result } = renderHook(() => useFollow(followId))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          `/follows/${followId}`,
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockFollow)
      })
    })
  })

  describe('Analytics Hooks', () => {
    describe('usePortfolioConcentration', () => {
      it('should fetch portfolio concentration', () => {
        const traderId = 'politician-123'
        const mockConcentration = {
          totalValue: 1000000,
          holdings: [{ symbol: 'AAPL', value: 500000, percentage: 50 }]
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockConcentration))
        mockedApi.analytics.getPortfolioConcentration.mockResolvedValue(mockConcentration)

        const { result } = renderHook(() => usePortfolioConcentration(traderId))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          `/analytics/portfolio-concentration/${traderId}`,
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockConcentration)
      })
    })

    describe('useTradingPatterns', () => {
      it('should fetch trading patterns', () => {
        const traderId = 'politician-123'
        const params = { timeframe: '1Y' }
        const mockPatterns = { patterns: [], insights: [] }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockPatterns))
        mockedApi.analytics.getTradingPatterns.mockResolvedValue(mockPatterns)

        const { result } = renderHook(() => useTradingPatterns(traderId, params))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          [`/analytics/trading-patterns/${traderId}`, params],
          expect.any(Function),
          expect.any(Object)
        )
        expect(result.current.data).toEqual(mockPatterns)
      })
    })

    describe('useMarketTrends', () => {
      it('should fetch market trends with 5 minute refresh', () => {
        const params = { timeframe: '1M', sector: 'Technology' }
        const mockTrends = { trends: [], summary: {} }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockTrends))
        mockedApi.analytics.getMarketTrends.mockResolvedValue(mockTrends)

        const { result } = renderHook(() => useMarketTrends(params))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/analytics/market-trends', params],
          expect.any(Function),
          expect.objectContaining({
            refreshInterval: 300000,
          })
        )
        expect(result.current.data).toEqual(mockTrends)
      })
    })

    describe('useRankings', () => {
      it('should fetch rankings with 5 minute refresh', () => {
        const params = { metric: 'total_value', limit: 10 }
        const mockRankings = { rankings: [], metadata: {} }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockRankings))
        mockedApi.analytics.getRankings.mockResolvedValue(mockRankings)

        const { result } = renderHook(() => useRankings(params))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/analytics/rankings', params],
          expect.any(Function),
          expect.objectContaining({
            refreshInterval: 300000,
          })
        )
        expect(result.current.data).toEqual(mockRankings)
      })
    })
  })

  describe('Notifications Hooks', () => {
    describe('useNotifications', () => {
      it('should fetch notifications with 30 second refresh', () => {
        const filters = { page: 1, limit: 10, read: false }
        const mockResponse = {
          items: [{ id: '1', message: 'New trade alert', read: false }],
          pagination: { page: 1, limit: 10, total: 1 }
        }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockResponse))
        mockedApi.notifications.getNotifications.mockResolvedValue(mockResponse)

        const { result } = renderHook(() => useNotifications(filters))

        expect(mockedUseSWR).toHaveBeenCalledWith(
          ['/notifications', filters],
          expect.any(Function),
          expect.objectContaining({
            refreshInterval: 30000,
          })
        )
        expect(result.current.data).toEqual(mockResponse)
      })
    })
  })

  describe('Health Hook', () => {
    describe('useHealth', () => {
      it('should check health with 1 minute refresh', () => {
        const mockHealth = { status: 'healthy', timestamp: '2023-12-01T10:00:00Z' }
        mockedUseSWR.mockReturnValue(createSWRResponse(mockHealth))
        mockedApi.health.check.mockResolvedValue(mockHealth)

        const { result } = renderHook(() => useHealth())

        expect(mockedUseSWR).toHaveBeenCalledWith(
          '/health',
          expect.any(Function),
          expect.objectContaining({
            refreshInterval: 60000,
          })
        )
        expect(result.current.data).toEqual(mockHealth)
      })
    })
  })

  describe('Mutation Hooks', () => {
    describe('useCreateAlert', () => {
      it('should create alert and revalidate cache', async () => {
        const alertData = { alertType: 'politician' as const, targetId: 'politician-123', alertConditions: {} }
        const expectedAlert = { id: 'alert-123', ...alertData, status: 'active' }
        
        mockedApi.alerts.createAlert.mockResolvedValue(expectedAlert)

        const { result } = renderHook(() => useCreateAlert())

        await act(async () => {
          const createdAlert = await result.current.createAlert(alertData)
          expect(createdAlert).toEqual(expectedAlert)
        })

        expect(mockedApi.alerts.createAlert).toHaveBeenCalledWith(alertData)
        expect(mockedMutate).toHaveBeenCalledWith(['/alerts'])
      })
    })

    describe('useUpdateAlert', () => {
      it('should update alert and revalidate cache', async () => {
        const alertId = 'alert-123'
        const updateData = { status: 'paused' as const }
        const expectedAlert = { id: alertId, status: 'paused' }
        
        mockedApi.alerts.updateAlert.mockResolvedValue(expectedAlert)

        const { result } = renderHook(() => useUpdateAlert())

        await act(async () => {
          const updatedAlert = await result.current.updateAlert(alertId, updateData)
          expect(updatedAlert).toEqual(expectedAlert)
        })

        expect(mockedApi.alerts.updateAlert).toHaveBeenCalledWith(alertId, updateData)
        expect(mockedMutate).toHaveBeenCalledWith(`/alerts/${alertId}`)
        expect(mockedMutate).toHaveBeenCalledWith(['/alerts'])
      })
    })

    describe('useDeleteAlert', () => {
      it('should delete alert and revalidate cache', async () => {
        const alertId = 'alert-123'
        
        mockedApi.alerts.deleteAlert.mockResolvedValue(undefined)

        const { result } = renderHook(() => useDeleteAlert())

        await act(async () => {
          await result.current.deleteAlert(alertId)
        })

        expect(mockedApi.alerts.deleteAlert).toHaveBeenCalledWith(alertId)
        expect(mockedMutate).toHaveBeenCalledWith(['/alerts'])
      })
    })

    describe('useCreateFollow', () => {
      it('should create follow and revalidate cache', async () => {
        const followData = { politicianId: 'politician-123' }
        const expectedFollow = { id: 'follow-123', ...followData, status: 'active' }
        
        mockedApi.follows.createFollow.mockResolvedValue(expectedFollow)

        const { result } = renderHook(() => useCreateFollow())

        await act(async () => {
          const createdFollow = await result.current.createFollow(followData)
          expect(createdFollow).toEqual(expectedFollow)
        })

        expect(mockedApi.follows.createFollow).toHaveBeenCalledWith(followData)
        expect(mockedMutate).toHaveBeenCalledWith(['/follows'])
      })
    })

    describe('useUnfollow', () => {
      it('should unfollow and revalidate cache', async () => {
        const followId = 'follow-123'
        
        mockedApi.follows.unfollow.mockResolvedValue(undefined)

        const { result } = renderHook(() => useUnfollow())

        await act(async () => {
          await result.current.unfollow(followId)
        })

        expect(mockedApi.follows.unfollow).toHaveBeenCalledWith(followId)
        expect(mockedMutate).toHaveBeenCalledWith(['/follows'])
      })
    })

    describe('useMarkNotificationAsRead', () => {
      it('should mark notification as read and revalidate cache', async () => {
        const notificationId = 'notification-123'
        
        mockedApi.notifications.markAsRead.mockResolvedValue(undefined)

        const { result } = renderHook(() => useMarkNotificationAsRead())

        await act(async () => {
          await result.current.markAsRead(notificationId)
        })

        expect(mockedApi.notifications.markAsRead).toHaveBeenCalledWith(notificationId)
        expect(mockedMutate).toHaveBeenCalledWith(['/notifications'])
      })
    })

    describe('useMarkAllNotificationsAsRead', () => {
      it('should mark all notifications as read and revalidate cache', async () => {
        mockedApi.notifications.markAllAsRead.mockResolvedValue(undefined)

        const { result } = renderHook(() => useMarkAllNotificationsAsRead())

        await act(async () => {
          await result.current.markAllAsRead()
        })

        expect(mockedApi.notifications.markAllAsRead).toHaveBeenCalled()
        expect(mockedMutate).toHaveBeenCalledWith(['/notifications'])
      })
    })
  })

  describe('Utility Hooks', () => {
    describe('useRefreshData', () => {
      it('should provide refresh functions for different data types', () => {
        const { result } = renderHook(() => useRefreshData())

        act(() => {
          result.current.refreshAll()
        })
        expect(mockedMutate).toHaveBeenCalledWith(expect.any(Function))

        act(() => {
          result.current.refreshTrades()
        })
        expect(mockedMutate).toHaveBeenCalledWith(expect.any(Function))

        act(() => {
          result.current.refreshAlerts()
        })
        expect(mockedMutate).toHaveBeenCalledWith(expect.any(Function))

        act(() => {
          result.current.refreshFollows()
        })
        expect(mockedMutate).toHaveBeenCalledWith(expect.any(Function))

        act(() => {
          result.current.refreshNotifications()
        })
        expect(mockedMutate).toHaveBeenCalledWith(expect.any(Function))
      })
    })

    describe('usePreloadData', () => {
      it('should provide preload functions for performance optimization', () => {
        const { result } = renderHook(() => usePreloadData())

        const politicianId = 'politician-123'
        const symbol = 'AAPL'

        act(() => {
          result.current.preloadPolitician(politicianId)
        })
        expect(mockedMutate).toHaveBeenCalledWith(
          `/politicians/${politicianId}`,
          mockedApi.politicians.getPoliticianById(politicianId)
        )

        act(() => {
          result.current.preloadStock(symbol)
        })
        expect(mockedMutate).toHaveBeenCalledWith(
          `/stocks/${symbol}`,
          mockedApi.stocks.getStockBySymbol(symbol)
        )

        const filters = { limit: 5 }
        act(() => {
          result.current.preloadPoliticianTrades(politicianId, filters)
        })
        expect(mockedMutate).toHaveBeenCalledWith(
          [`/trades/politician/${politicianId}`, filters],
          mockedApi.trades.getPoliticianTrades(politicianId, filters)
        )

        act(() => {
          result.current.preloadStockTrades(symbol, filters)
        })
        expect(mockedMutate).toHaveBeenCalledWith(
          [`/trades/stock/${symbol}`, filters],
          mockedApi.trades.getStockTrades(symbol, filters)
        )
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should handle loading state correctly', () => {
      mockedUseSWR.mockReturnValue(createSWRResponse(null, true))

      const { result } = renderHook(() => useTrades())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeNull()
    })

    it('should handle error state correctly', () => {
      const error = new Error('API Error')
      mockedUseSWR.mockReturnValue(createSWRResponse(null, false, error))

      const { result } = renderHook(() => useTrades())

      expect(result.current.error).toEqual(error)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Default SWR Configuration', () => {
    it('should use default configuration for most hooks', () => {
      mockedUseSWR.mockReturnValue(createSWRResponse(null))

      renderHook(() => usePoliticians())

      expect(mockedUseSWR).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Function),
        expect.objectContaining({
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          refreshInterval: 0,
          errorRetryCount: 3,
          errorRetryInterval: 1000,
        })
      )
    })
  })
})