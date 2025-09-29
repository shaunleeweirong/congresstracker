'use client';

import useSWR, { SWRConfiguration, mutate } from 'swr';
import {
  ApiResponse,
  PaginatedResponse,
  CongressionalMember,
  StockTicker,
  StockTrade,
  UserAlert,
  UserFollow,
  AlertNotification,
  SearchResponse,
  TradeFilters,
  SearchRequest,
  CreateAlertRequest,
  UpdateAlertRequest,
  CreateFollowRequest,
  NotificationFilters,
  PortfolioConcentration
} from '../../../shared/types/api';
import { api } from '../lib/api';

// Configuration for SWR hooks
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0, // No automatic refresh by default
  errorRetryCount: 3,
  errorRetryInterval: 1000,
};

// Auth hooks
export function useProfile() {
  return useSWR(
    '/auth/profile',
    () => api.auth.getProfile(),
    {
      ...defaultConfig,
      revalidateOnFocus: true, // Profile should refresh on focus
    }
  );
}

// Search hooks
export function useSearch(params: SearchRequest | null, config?: SWRConfiguration) {
  return useSWR(
    params ? ['/search', params] : null,
    () => params ? api.search.search(params) : null,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

// Trade hooks
export function useTrades(filters?: TradeFilters, config?: SWRConfiguration) {
  return useSWR(
    ['/trades', filters],
    () => api.trades.getTrades(filters),
    {
      ...defaultConfig,
      refreshInterval: 60000, // Refresh trades every minute
      ...config,
    }
  );
}

export function useTrade(id: string | null, config?: SWRConfiguration) {
  return useSWR(
    id ? `/trades/${id}` : null,
    () => id ? api.trades.getTradeById(id) : null,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

export function usePoliticianTrades(
  politicianId: string | null,
  filters?: TradeFilters,
  config?: SWRConfiguration
) {
  return useSWR(
    politicianId ? [`/trades/politician/${politicianId}`, filters] : null,
    () => politicianId ? api.trades.getPoliticianTrades(politicianId, filters) : null,
    {
      ...defaultConfig,
      refreshInterval: 60000, // Refresh frequently for real-time feel
      ...config,
    }
  );
}

export function useStockTrades(
  symbol: string | null,
  filters?: TradeFilters,
  config?: SWRConfiguration
) {
  return useSWR(
    symbol ? [`/trades/stock/${symbol}`, filters] : null,
    () => symbol ? api.trades.getStockTrades(symbol, filters) : null,
    {
      ...defaultConfig,
      refreshInterval: 60000,
      ...config,
    }
  );
}

export function useRecentTrades(limit?: number, config?: SWRConfiguration) {
  return useSWR(
    ['/trades/recent', limit],
    () => api.trades.getRecentTrades(limit),
    {
      ...defaultConfig,
      refreshInterval: 30000, // Refresh recent trades every 30 seconds
      ...config,
    }
  );
}

// Politicians hooks
export function usePoliticians(
  params?: { page?: number; limit?: number; search?: string },
  config?: SWRConfiguration
) {
  return useSWR(
    ['/politicians', params],
    () => api.politicians.getPoliticians(params),
    {
      ...defaultConfig,
      ...config,
    }
  );
}

export function usePolitician(id: string | null, config?: SWRConfiguration) {
  return useSWR(
    id ? `/politicians/${id}` : null,
    () => id ? api.politicians.getPoliticianById(id) : null,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

// Stocks hooks
export function useStocks(
  params?: { page?: number; limit?: number; search?: string },
  config?: SWRConfiguration
) {
  return useSWR(
    ['/stocks', params],
    () => api.stocks.getStocks(params),
    {
      ...defaultConfig,
      ...config,
    }
  );
}

export function useStock(symbol: string | null, config?: SWRConfiguration) {
  return useSWR(
    symbol ? `/stocks/${symbol}` : null,
    () => symbol ? api.stocks.getStockBySymbol(symbol) : null,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

// Alerts hooks
export function useAlerts(
  params?: { page?: number; limit?: number; status?: string },
  config?: SWRConfiguration
) {
  return useSWR(
    ['/alerts', params],
    () => api.alerts.getAlerts(params),
    {
      ...defaultConfig,
      ...config,
    }
  );
}

export function useAlert(id: string | null, config?: SWRConfiguration) {
  return useSWR(
    id ? `/alerts/${id}` : null,
    () => id ? api.alerts.getAlertById(id) : null,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

// Follows hooks
export function useFollows(
  params?: { page?: number; limit?: number; status?: string },
  config?: SWRConfiguration
) {
  return useSWR(
    ['/follows', params],
    () => api.follows.getFollows(params),
    {
      ...defaultConfig,
      ...config,
    }
  );
}

export function useFollow(id: string | null, config?: SWRConfiguration) {
  return useSWR(
    id ? `/follows/${id}` : null,
    () => id ? api.follows.getFollowById(id) : null,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

// Analytics hooks
export function usePortfolioConcentration(
  traderId: string | null,
  config?: SWRConfiguration
) {
  return useSWR(
    traderId ? `/analytics/portfolio-concentration/${traderId}` : null,
    () => traderId ? api.analytics.getPortfolioConcentration(traderId) : null,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

export function useTradingPatterns(
  traderId: string | null,
  params?: { timeframe?: string },
  config?: SWRConfiguration
) {
  return useSWR(
    traderId ? [`/analytics/trading-patterns/${traderId}`, params] : null,
    () => traderId ? api.analytics.getTradingPatterns(traderId, params) : null,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

export function useMarketTrends(
  params?: { timeframe?: string; sector?: string },
  config?: SWRConfiguration
) {
  return useSWR(
    ['/analytics/market-trends', params],
    () => api.analytics.getMarketTrends(params),
    {
      ...defaultConfig,
      refreshInterval: 300000, // Refresh every 5 minutes
      ...config,
    }
  );
}

export function useRankings(
  params?: { metric?: string; limit?: number },
  config?: SWRConfiguration
) {
  return useSWR(
    ['/analytics/rankings', params],
    () => api.analytics.getRankings(params),
    {
      ...defaultConfig,
      refreshInterval: 300000, // Refresh every 5 minutes
      ...config,
    }
  );
}

// Notifications hooks
export function useNotifications(
  filters?: NotificationFilters,
  config?: SWRConfiguration
) {
  return useSWR(
    ['/notifications', filters],
    () => api.notifications.getNotifications(filters),
    {
      ...defaultConfig,
      refreshInterval: 30000, // Check for new notifications every 30 seconds
      ...config,
    }
  );
}

// Health check hook
export function useHealth(config?: SWRConfiguration) {
  return useSWR(
    '/health',
    () => api.health.check(),
    {
      ...defaultConfig,
      refreshInterval: 60000, // Check health every minute
      ...config,
    }
  );
}

// Mutation hooks with optimistic updates
export function useCreateAlert() {
  return {
    createAlert: async (alertData: CreateAlertRequest) => {
      const newAlert = await api.alerts.createAlert(alertData);
      // Revalidate alerts list
      mutate(['/alerts']);
      return newAlert;
    }
  };
}

export function useUpdateAlert() {
  return {
    updateAlert: async (id: string, updateData: UpdateAlertRequest) => {
      const updatedAlert = await api.alerts.updateAlert(id, updateData);
      // Revalidate specific alert and alerts list
      mutate(`/alerts/${id}`);
      mutate(['/alerts']);
      return updatedAlert;
    }
  };
}

export function useDeleteAlert() {
  return {
    deleteAlert: async (id: string) => {
      await api.alerts.deleteAlert(id);
      // Revalidate alerts list
      mutate(['/alerts']);
    }
  };
}

export function useCreateFollow() {
  return {
    createFollow: async (followData: CreateFollowRequest) => {
      const newFollow = await api.follows.createFollow(followData);
      // Revalidate follows list
      mutate(['/follows']);
      return newFollow;
    }
  };
}

export function useUnfollow() {
  return {
    unfollow: async (id: string) => {
      await api.follows.unfollow(id);
      // Revalidate follows list
      mutate(['/follows']);
    }
  };
}

export function useMarkNotificationAsRead() {
  return {
    markAsRead: async (id: string) => {
      await api.notifications.markAsRead(id);
      // Revalidate notifications
      mutate(['/notifications']);
    }
  };
}

export function useMarkAllNotificationsAsRead() {
  return {
    markAllAsRead: async () => {
      await api.notifications.markAllAsRead();
      // Revalidate notifications
      mutate(['/notifications']);
    }
  };
}

// Utility hooks for common patterns
export function useRefreshData() {
  return {
    refreshAll: () => {
      // Refresh all cached data
      mutate(() => true);
    },
    refreshTrades: () => {
      mutate(key => typeof key === 'string' && key.includes('/trades'));
    },
    refreshAlerts: () => {
      mutate(key => typeof key === 'string' && key.includes('/alerts'));
    },
    refreshFollows: () => {
      mutate(key => typeof key === 'string' && key.includes('/follows'));
    },
    refreshNotifications: () => {
      mutate(key => typeof key === 'string' && key.includes('/notifications'));
    }
  };
}

// Preload hook for performance optimization
export function usePreloadData() {
  return {
    preloadPolitician: (id: string) => {
      mutate(`/politicians/${id}`, api.politicians.getPoliticianById(id));
    },
    preloadStock: (symbol: string) => {
      mutate(`/stocks/${symbol}`, api.stocks.getStockBySymbol(symbol));
    },
    preloadPoliticianTrades: (politicianId: string, filters?: TradeFilters) => {
      mutate(
        [`/trades/politician/${politicianId}`, filters],
        api.trades.getPoliticianTrades(politicianId, filters)
      );
    },
    preloadStockTrades: (symbol: string, filters?: TradeFilters) => {
      mutate(
        [`/trades/stock/${symbol}`, filters],
        api.trades.getStockTrades(symbol, filters)
      );
    }
  };
}

// Export commonly used types for convenience
export type {
  ApiResponse,
  PaginatedResponse,
  CongressionalMember,
  StockTicker,
  StockTrade,
  UserAlert,
  UserFollow,
  AlertNotification,
  SearchResponse,
  TradeFilters,
  SearchRequest,
  CreateAlertRequest,
  UpdateAlertRequest,
  CreateFollowRequest,
  NotificationFilters,
  PortfolioConcentration
};