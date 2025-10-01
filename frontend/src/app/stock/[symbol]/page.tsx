'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, TrendingUp, TrendingDown, AlertCircle, ExternalLink, Users, DollarSign } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { StockProfile } from '@/components/stocks/StockProfile'
import { TradeFeed } from '@/components/trades/TradeFeed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StockTicker, StockTrade, CongressionalMember } from '@/types/api'

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = (params.symbol as string)?.toUpperCase()

  const [stock, setStock] = useState<StockTicker | null>(null)
  const [trades, setTrades] = useState<StockTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAlerts, setHasAlerts] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '1y' | '6m' | '3m' | '1m'>('1y')

  // Mock data - will be replaced with real API calls
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true)
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Mock stock data
        const mockStock: StockTicker = {
          symbol: symbol,
          companyName: getCompanyName(symbol),
          sector: getSector(symbol),
          industry: getIndustry(symbol),
          marketCap: getMarketCap(symbol),
          lastPrice: getLastPrice(symbol),
          lastUpdated: '2024-01-15T16:00:00Z',
          createdAt: '2023-01-01T00:00:00Z'
        }

        // Mock politicians for the stock
        const mockPoliticians: CongressionalMember[] = [
          {
            id: '1',
            name: 'Nancy Pelosi',
            position: 'representative',
            stateCode: 'CA',
            district: 12,
            partyAffiliation: 'democratic',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Ted Cruz',
            position: 'senator',
            stateCode: 'TX',
            partyAffiliation: 'republican',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ]

        // Mock trades data
        const mockTrades: StockTrade[] = [
          {
            id: '1',
            traderType: 'congressional',
            traderId: '1',
            tickerSymbol: symbol,
            transactionDate: '2024-01-15',
            transactionType: 'buy',
            amountRange: '$1,001 - $15,000',
            estimatedValue: 8000,
            trader: mockPoliticians[0],
            stock: mockStock,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            traderType: 'congressional',
            traderId: '2',
            tickerSymbol: symbol,
            transactionDate: '2024-01-10',
            transactionType: 'sell',
            amountRange: '$15,001 - $50,000',
            estimatedValue: 32500,
            trader: mockPoliticians[1],
            stock: mockStock,
            createdAt: '2024-01-10T14:20:00Z',
            updatedAt: '2024-01-10T14:20:00Z'
          },
          {
            id: '3',
            traderType: 'congressional',
            traderId: '1',
            tickerSymbol: symbol,
            transactionDate: '2024-01-05',
            transactionType: 'buy',
            amountRange: '$50,001 - $100,000',
            estimatedValue: 75000,
            trader: mockPoliticians[0],
            stock: mockStock,
            createdAt: '2024-01-05T11:45:00Z',
            updatedAt: '2024-01-05T11:45:00Z'
          }
        ]

        setStock(mockStock)
        setTrades(mockTrades)
        setHasAlerts(Math.random() > 0.5) // Random mock status
      } catch (err) {
        setError('Failed to load stock data')
        console.error('Error fetching stock:', err)
      } finally {
        setLoading(false)
      }
    }

    if (symbol) {
      fetchStockData()
    }
  }, [symbol])

  // Helper functions for mock data
  function getCompanyName(symbol: string): string {
    const companies: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla, Inc.',
      'AMZN': 'Amazon.com, Inc.',
      'NVDA': 'NVIDIA Corporation',
      'META': 'Meta Platforms, Inc.',
      'NFLX': 'Netflix, Inc.'
    }
    return companies[symbol] || `${symbol} Company`
  }

  function getSector(symbol: string): string {
    const sectors: Record<string, string> = {
      'AAPL': 'Technology',
      'MSFT': 'Technology',
      'GOOGL': 'Technology',
      'TSLA': 'Automotive',
      'AMZN': 'Consumer Discretionary',
      'NVDA': 'Technology',
      'META': 'Technology',
      'NFLX': 'Communication Services'
    }
    return sectors[symbol] || 'Technology'
  }

  function getIndustry(symbol: string): string {
    const industries: Record<string, string> = {
      'AAPL': 'Consumer Electronics',
      'MSFT': 'Software',
      'GOOGL': 'Internet Services',
      'TSLA': 'Electric Vehicles',
      'AMZN': 'E-commerce',
      'NVDA': 'Semiconductors',
      'META': 'Social Media',
      'NFLX': 'Entertainment'
    }
    return industries[symbol] || 'Software'
  }

  function getMarketCap(symbol: string): number {
    const marketCaps: Record<string, number> = {
      'AAPL': 3000000000000,
      'MSFT': 2800000000000,
      'GOOGL': 1600000000000,
      'TSLA': 800000000000,
      'AMZN': 1500000000000,
      'NVDA': 2200000000000,
      'META': 900000000000,
      'NFLX': 200000000000
    }
    return marketCaps[symbol] || 100000000000
  }

  function getLastPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'AAPL': 195.50,
      'MSFT': 418.22,
      'GOOGL': 142.85,
      'TSLA': 248.75,
      'AMZN': 155.89,
      'NVDA': 739.80,
      'META': 502.34,
      'NFLX': 486.73
    }
    return prices[symbol] || 100.00
  }

  const handleAlertToggle = async (stock: StockTicker) => {
    try {
      // TODO: Implement alert toggle API call
      setHasAlerts(!hasAlerts)
      console.log('Alert toggled for:', stock.symbol)
    } catch (err) {
      console.error('Error toggling alert:', err)
    }
  }

  const handleTradeClick = (trade: StockTrade) => {
    console.log('Trade clicked:', trade)
    // TODO: Show trade details modal or navigate to detailed view
  }

  const handlePoliticianClick = (politician: CongressionalMember) => {
    router.push(`/politician/${politician.id}`)
  }

  // Calculate trading statistics
  const tradingStats = React.useMemo(() => {
    if (!trades.length) {
      return {
        totalValue: 0,
        totalTrades: 0,
        buyTrades: 0,
        sellTrades: 0,
        uniqueTraders: 0,
        avgTradeValue: 0
      }
    }

    const totalValue = trades.reduce((sum, trade) => sum + (trade.estimatedValue || 0), 0)
    const buyTrades = trades.filter(t => t.transactionType === 'buy').length
    const sellTrades = trades.filter(t => t.transactionType === 'sell').length
    
    // Count unique traders
    const uniqueTraderIds = new Set(trades.map(t => t.traderId))

    return {
      totalValue,
      totalTrades: trades.length,
      buyTrades,
      sellTrades,
      uniqueTraders: uniqueTraderIds.size,
      avgTradeValue: totalValue / trades.length
    }
  }, [trades])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading stock data...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !stock) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Stock not found'}
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to load the requested stock information.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const priceChange = (Math.random() - 0.5) * 20 // Mock price change
  const priceChangePercent = (priceChange / stock.lastPrice!) * 100

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-4 border-l border-gray-300" />
          <span className="text-sm text-gray-600">Stock Profile</span>
        </div>

        {/* Stock Header */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {stock.symbol}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {stock.symbol}
                </h1>
                <h2 className="text-xl text-gray-700 mb-4">
                  {stock.companyName}
                </h2>
                <div className="flex items-center space-x-4 text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    <span>{stock.sector}</span>
                  </div>
                  <div className="flex items-center">
                    <span>{stock.industry}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${stock.lastPrice?.toFixed(2)}
                    </span>
                    <span 
                      className={`flex items-center text-sm font-medium ${
                        priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {priceChange >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {priceChange >= 0 ? '+' : ''}
                      {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(stock.lastUpdated).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant={hasAlerts ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAlertToggle(stock)}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {hasAlerts ? 'Alert Active' : 'Set Alert'}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`https://finance.yahoo.com/quote/${stock.symbol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Yahoo Finance
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Trading Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(tradingStats.totalValue / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-muted-foreground">
                Congressional trading
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tradingStats.totalTrades}</div>
              <p className="text-xs text-muted-foreground">
                {tradingStats.buyTrades} buys, {tradingStats.sellTrades} sells
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Traders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tradingStats.uniqueTraders}</div>
              <p className="text-xs text-muted-foreground">
                Congress members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${((stock.marketCap || 0) / 1000000000000).toFixed(1)}T
              </div>
              <p className="text-xs text-muted-foreground">
                Market capitalization
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="trades" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trades">Congressional Trades</TabsTrigger>
            <TabsTrigger value="profile">Stock Details</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Congressional Trading Activity</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="flex rounded-md border">
                    {(['all', '1y', '6m', '3m', '1m'] as const).map((timeframe) => (
                      <Button
                        key={timeframe}
                        variant={selectedTimeframe === timeframe ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTimeframe(timeframe)}
                        className="rounded-none first:rounded-l-md last:rounded-r-md"
                      >
                        {timeframe === 'all' ? 'All' : timeframe.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <TradeFeed
                  trades={trades}
                  onTradeClick={handleTradeClick}
                  onPoliticianClick={handlePoliticianClick}
                  showFilters={true}
                  pageSize={20}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <StockProfile
              stock={stock}
              hasAlerts={hasAlerts}
              onAlertToggle={handleAlertToggle}
              onTradeClick={handleTradeClick}
              onPoliticianClick={handlePoliticianClick}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trading Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Trading Analytics
                  </h3>
                  <p className="text-gray-600">
                    Detailed trading analysis and charts will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}