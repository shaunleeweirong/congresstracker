'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, AlertCircle, Eye, ArrowRight, Loader2 } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { SearchBar } from '@/components/search/SearchBar'
import { TradeFeed } from '@/components/trades/TradeFeed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { CongressionalMember, StockTicker, StockTrade } from '../../../shared/types/api'
import { apiClient } from '@/lib/api'

// Dashboard-specific interfaces
interface DashboardMetrics {
  totalTrades: number;
  activeMembers: number;
  totalVolume: number;
  alertsTriggered: number;
}

interface TopStock {
  symbol: string;
  name: string;
  trades: number;
  value: number;
}

interface TopTrader {
  id: string;
  name: string;
  party: string;
  trades: number;
  value: number;
}

interface TopStockResponse {
  stock: {
    symbol: string;
    companyName: string | null;
  };
  tradeCount: number;
  totalValue: number;
}

interface TopTraderResponse {
  trader: {
    id: string;
    name: string;
    partyAffiliation?: string;
  };
  tradeCount: number;
  totalValue: number;
}

export default function Dashboard() {
  // Initialize date range to last 60 days (congressional trades have ~45 day reporting delay)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 60)),
    to: new Date()
  })
  const [recentTrades, setRecentTrades] = useState<StockTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null)
  const [topStocks, setTopStocks] = useState<TopStock[]>([])
  const [topTraders, setTopTraders] = useState<TopTrader[]>([])

  // Fetch real data from API
  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch recent trades for display using date range
      const tradesResponse = await apiClient.get('/trades', {
        params: {
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          limit: 10,
          sortBy: 'transactionDate',
          sortOrder: 'desc'
        }
      })

      if (tradesResponse.data.success) {
        setRecentTrades(tradesResponse.data.data.trades)
      }

      // Fetch top stocks using date range
      const topStocksResponse = await apiClient.get('/trades/top-stocks', {
        params: {
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          limit: 4
        }
      })

      if (topStocksResponse.data.success) {
        // Map backend response to frontend format
        const topStocksData = topStocksResponse.data.data.map((item: TopStockResponse) => ({
          symbol: item.stock.symbol,
          name: item.stock.companyName || item.stock.symbol,
          trades: item.tradeCount,
          value: item.totalValue
        }))
        setTopStocks(topStocksData)
      }

      // Fetch most active traders using date range
      const topTradersResponse = await apiClient.get('/trades/active-traders', {
        params: {
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          limit: 4
        }
      })

      if (topTradersResponse.data.success) {
        // Map backend response to frontend format
        const topTradersData = topTradersResponse.data.data.map((item: TopTraderResponse) => ({
          id: item.trader.id,
          name: item.trader.name,
          party: item.trader.partyAffiliation || 'Unknown',
          trades: item.tradeCount,
          value: item.totalValue
        }))
        setTopTraders(topTradersData)
      }

      // Fetch dashboard metrics
      const metricsResponse = await apiClient.get('/dashboard/metrics')
      if (metricsResponse.data.success) {
        setDashboardMetrics(metricsResponse.data.data)
      }

    } catch (err: unknown) {
      console.error('Error fetching dashboard data:', err)
      if (err instanceof Error) {
        setError(err.message || 'Failed to load dashboard data')
      } else {
        setError('Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string, type?: 'politician' | 'stock' | 'all') => {
    console.log('Dashboard search:', query, type)
    // Navigate to search page with query
    // TODO: Create dedicated search page
  }

  const handleSelectPolitician = (politician: CongressionalMember) => {
    // Navigate to politician detail page with real ID from database
    window.location.href = `/politician/${politician.id}`
  }

  const handleSelectStock = (stock: StockTicker) => {
    // Navigate to stock detail page
    window.location.href = `/stock/${stock.symbol}`
  }

  const handleTradeClick = (trade: StockTrade) => {
    console.log('Trade clicked:', trade)
    // TODO: Show trade details modal or navigate to detailed view
  }

  const handlePoliticianClick = (politician: CongressionalMember) => {
    console.log('Politician clicked:', politician)
    // TODO: Navigate to politician profile
  }

  const handleStockClick = (stock: StockTicker) => {
    console.log('Stock clicked:', stock)
    // TODO: Navigate to stock profile
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Congressional Trading Dashboard
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8">
            Track real-time stock trading activity from members of Congress
          </p>

          {/* Dashboard Metrics */}
          {dashboardMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{dashboardMetrics.totalTrades}</div>
                  <div className="text-sm text-muted-foreground">Total Trades</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{dashboardMetrics.activeMembers}</div>
                  <div className="text-sm text-muted-foreground">Active Members</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">${(dashboardMetrics.totalVolume / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-muted-foreground">Total Volume</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{dashboardMetrics.alertsTriggered}</div>
                  <div className="text-sm text-muted-foreground">Alerts Triggered</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              onSelectPolitician={handleSelectPolitician}
              onSelectStock={handleSelectStock}
              placeholder="Search politicians, stocks, or companies..."
              showFilters={true}
              autoFocus={false}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Trades Feed - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl">Recent Trading Activity</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <DateRangePicker
                    dateRange={dateRange}
                    onChange={setDateRange}
                  />
                  <Link href="/trades">
                    <Button variant="outline" size="sm" className="whitespace-nowrap h-10 sm:h-8">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading trades...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-red-500">
                    <p>Error loading trades: {error}</p>
                    <Button onClick={fetchDashboardData} variant="outline" className="mt-4">
                      Retry
                    </Button>
                  </div>
                ) : recentTrades.length > 0 ? (
                  <div className="divide-y">
                    {recentTrades.map((trade) => (
                      <div key={trade.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link href={`/stock/${trade.tickerSymbol}`}>
                                <span className="font-semibold text-green-600 hover:underline cursor-pointer">
                                  {trade.tickerSymbol}
                                </span>
                              </Link>
                              <Badge variant={trade.transactionType === 'buy' ? 'default' : 'destructive'}>
                                {trade.transactionType.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Amount: {trade.amountRange || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(trade.transactionDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No trades found for the selected date range</p>
                    <p className="text-sm mt-2">
                      {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    </p>
                    <p className="text-xs mt-2">
                      Try selecting a different date range or check back later for new filings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Top Lists */}
          <div className="space-y-6">
            {/* Top Stocks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Most Traded Stocks</CardTitle>
                <Link href="/stocks">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {topStocks.map((stock, index) => (
                  <Link
                    key={stock.symbol}
                    href={`/stock/${stock.symbol}`}
                    className="block hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-sm text-muted-foreground">{stock.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${(stock.value / 1000).toFixed(0)}K</div>
                        <div className="text-sm text-muted-foreground">{stock.trades} trades</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Top Traders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Most Active Traders</CardTitle>
                <Link href="/members">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {topTraders.map((trader, index) => (
                  <Link
                    key={trader.id}
                    href={`/politician/${trader.id}`}
                    className="block hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{trader.name}</div>
                          <Badge
                            variant={trader.party?.toLowerCase() === 'democratic' ? 'default' : 'secondary'}
                            className="text-xs capitalize"
                          >
                            {trader.party}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${(trader.value / 1000000).toFixed(1)}M</div>
                        <div className="text-sm text-muted-foreground">{trader.trades} trades</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/alerts">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Manage Alerts
                  </Button>
                </Link>
                <Link href="/follows">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    Following
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Advanced Search
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}
