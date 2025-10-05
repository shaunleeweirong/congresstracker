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
import { CongressionalMember, StockTicker, StockTrade } from '../../../shared/types/api'
import { apiClient } from '@/lib/api'

export default function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>('week')
  const [recentTrades, setRecentTrades] = useState<StockTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null)
  const [topStocks, setTopStocks] = useState<any[]>([])
  const [topTraders, setTopTraders] = useState<any[]>([])

  // Fetch real data from API
  useEffect(() => {
    fetchDashboardData()
  }, [selectedTimeframe])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch recent trades for display
      const tradesResponse = await apiClient.get('/trades/recent', {
        params: {
          limit: 10,
          sortBy: 'transactionDate',
          sortOrder: 'desc'
        }
      })

      if (tradesResponse.data.success) {
        setRecentTrades(tradesResponse.data.data.trades)
      }

      // Fetch more trades to calculate top stocks and traders
      const allTradesResponse = await apiClient.get('/trades/recent', {
        params: {
          limit: 200, // Get more trades for better statistics
          sortBy: 'transactionDate',
          sortOrder: 'desc'
        }
      })

      if (allTradesResponse.data.success) {
        const trades = allTradesResponse.data.data.trades

        // Calculate Top Stocks
        const stockStats = trades.reduce((acc: any, trade: StockTrade) => {
          const symbol = trade.tickerSymbol
          if (!acc[symbol]) {
            acc[symbol] = {
              symbol,
              name: trade.stock?.companyName || symbol,
              trades: 0,
              value: 0
            }
          }
          acc[symbol].trades++
          acc[symbol].value += parseFloat(trade.estimatedValue?.toString() || '0')
          return acc
        }, {})

        const topStocksData = Object.values(stockStats)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 4)
        setTopStocks(topStocksData)

        // Calculate Top Traders
        const traderStats = trades.reduce((acc: any, trade: StockTrade) => {
          const traderId = trade.traderId
          if (!acc[traderId]) {
            acc[traderId] = {
              name: trade.trader?.name || 'Unknown',
              party: trade.trader?.partyAffiliation || 'Unknown',
              trades: 0,
              value: 0
            }
          }
          acc[traderId].trades++
          acc[traderId].value += parseFloat(trade.estimatedValue?.toString() || '0')
          return acc
        }, {})

        const topTradersData = Object.values(traderStats)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 4)
        setTopTraders(topTradersData)
      }

      // Fetch dashboard metrics
      const metricsResponse = await apiClient.get('/dashboard/metrics')
      if (metricsResponse.data.success) {
        setDashboardMetrics(metricsResponse.data.data)
      }

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
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
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Congressional Trading Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Track real-time stock trading activity from members of Congress
          </p>

          {/* Dashboard Metrics */}
          {dashboardMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Recent Trading Activity</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="flex rounded-md border">
                    {(['day', 'week', 'month'] as const).map((timeframe) => (
                      <Button
                        key={timeframe}
                        variant={selectedTimeframe === timeframe ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTimeframe(timeframe)}
                        className="rounded-none first:rounded-l-md last:rounded-r-md"
                      >
                        {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <Link href="/trades">
                    <Button variant="outline" size="sm">
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
                              <span className="font-semibold text-green-600">{trade.tickerSymbol}</span>
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
                    <p>No trades found</p>
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
                  <div key={stock.symbol} className="flex items-center justify-between">
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
                  <div key={trader.name} className="flex items-center justify-between">
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
