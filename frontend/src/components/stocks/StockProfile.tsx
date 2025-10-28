'use client'

import React, { useState, useEffect } from 'react'
import { Building2, TrendingUp, TrendingDown, Bell, BellOff, ExternalLink, User, Calendar, DollarSign, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { cn } from '@/lib/utils'
import { StockTicker, StockTrade, CongressionalMember, UserAlert, isCongressionalMember } from '@/types/api'

interface StockProfileProps {
  stock: StockTicker
  trades?: StockTrade[]
  hasAlerts?: boolean
  onAlertToggle?: (stock: StockTicker) => void
  onTradeClick?: (trade: StockTrade) => void
  onPoliticianClick?: (politician: CongressionalMember) => void
  loading?: boolean
  className?: string
}

interface StockStats {
  totalTrades: number
  totalVolume: number
  uniqueTraders: number
  buyCount: number
  sellCount: number
  avgTradeValue: number
  recentActivity: number // trades in last 30 days
  topTraders: Array<{
    trader: CongressionalMember
    tradeCount: number
    totalValue: number
  }>
}

interface StockPerformance {
  currentPrice: number
  priceChange: number
  priceChangePercent: number
  volume: number
  marketCap: number
  peRatio?: number
  dividendYield?: number
}

export function StockProfile({
  stock,
  trades = [],
  hasAlerts = false,
  onAlertToggle,
  onTradeClick,
  onPoliticianClick,
  loading = false,
  className
}: StockProfileProps) {
  const [stats, setStats] = useState<StockStats | null>(null)
  const [performance, setPerformance] = useState<StockPerformance | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Mock trades data
  const mockTrades: StockTrade[] = [
    {
      id: '1',
      traderType: 'congressional',
      traderId: '1',
      tickerSymbol: stock.symbol,
      transactionDate: '2023-12-01',
      transactionType: 'buy',
      amountRange: '$15,001-$50,000',
      estimatedValue: 32500,
      quantity: 167,
      filingDate: '2023-12-02',
      trader: {
        id: '1',
        name: 'Nancy Pelosi',
        position: 'representative',
        stateCode: 'CA',
        district: 12,
        partyAffiliation: 'democratic',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
      stock: stock,
      createdAt: '2023-12-02T10:00:00Z',
      updatedAt: '2023-12-02T10:00:00Z'
    },
    {
      id: '2',
      traderType: 'congressional',
      traderId: '2',
      tickerSymbol: stock.symbol,
      transactionDate: '2023-11-15',
      transactionType: 'sell',
      amountRange: '$1,001-$15,000',
      estimatedValue: 8500,
      quantity: 34,
      filingDate: '2023-11-16',
      trader: {
        id: '2',
        name: 'Chuck Schumer',
        position: 'senator',
        stateCode: 'NY',
        partyAffiliation: 'democratic',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
      stock: stock,
      createdAt: '2023-11-16T14:00:00Z',
      updatedAt: '2023-11-16T14:00:00Z'
    }
  ]

  const displayTrades = trades.length > 0 ? trades : mockTrades

  useEffect(() => {
    // Calculate trading statistics
    const totalTrades = displayTrades.length
    const totalVolume = displayTrades.reduce((sum, trade) => sum + (trade.quantity || 0), 0)
    const totalValue = displayTrades.reduce((sum, trade) => sum + (trade.estimatedValue || 0), 0)
    const uniqueTraders = new Set(displayTrades.map(trade => trade.traderId)).size
    const buyCount = displayTrades.filter(trade => trade.transactionType === 'buy').length
    const sellCount = displayTrades.filter(trade => trade.transactionType === 'sell').length
    const avgTradeValue = totalTrades > 0 ? totalValue / totalTrades : 0

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentActivity = displayTrades.filter(trade => 
      new Date(trade.transactionDate) >= thirtyDaysAgo
    ).length

    // Top traders
    const traderStats: Record<string, { trader: CongressionalMember; tradeCount: number; totalValue: number }> = {}
    
    displayTrades.forEach(trade => {
      if (isCongressionalMember(trade.trader)) {
        const traderId = trade.trader.id
        if (!traderStats[traderId]) {
          traderStats[traderId] = {
            trader: trade.trader,
            tradeCount: 0,
            totalValue: 0
          }
        }
        traderStats[traderId].tradeCount++
        traderStats[traderId].totalValue += trade.estimatedValue || 0
      }
    })

    const topTraders = Object.values(traderStats)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)

    setStats({
      totalTrades,
      totalVolume,
      uniqueTraders,
      buyCount,
      sellCount,
      avgTradeValue,
      recentActivity,
      topTraders
    })

    // Mock performance data
    setPerformance({
      currentPrice: stock.lastPrice || 195.50,
      priceChange: 2.35,
      priceChangePercent: 1.22,
      volume: 45678900,
      marketCap: stock.marketCap || 3000000000000,
      peRatio: 28.5,
      dividendYield: 0.45
    })
  }, [displayTrades, stock])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatNumber = (num: number, compact = false) => {
    if (compact && num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)}B`
    } else if (compact && num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (compact && num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatPolitician = (trader: CongressionalMember) => {
    const position = trader.position === 'senator' ? 'Sen.' : 'Rep.'
    const party = trader.partyAffiliation?.charAt(0).toUpperCase() || ''
    return `${position} ${trader.name} (${party}-${trader.stateCode})`
  }

  const handleAlertToggle = async () => {
    setIsProcessing(true)
    try {
      onAlertToggle?.(stock)
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <span>Loading stock profile...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{stock.symbol}</h1>
                  {performance && (
                    <Badge variant={performance.priceChange >= 0 ? "default" : "destructive"}>
                      {performance.priceChange >= 0 ? '+' : ''}{performance.priceChangePercent.toFixed(2)}%
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl text-muted-foreground mb-2">{stock.companyName}</h2>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {stock.sector && (
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {stock.sector}
                    </span>
                  )}
                  {stock.industry && (
                    <span>• {stock.industry}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {performance && (
                <div className="mb-4">
                  <div className="text-3xl font-bold">
                    {formatPrice(performance.currentPrice)}
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    performance.priceChange >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {performance.priceChange >= 0 ? '+' : ''}{formatPrice(performance.priceChange)} today
                  </div>
                </div>
              )}
              
              <Button
                variant={hasAlerts ? "default" : "outline"}
                onClick={handleAlertToggle}
                disabled={isProcessing}
              >
                {hasAlerts ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                {hasAlerts ? 'Alerts On' : 'Create Alert'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.totalTrades}</div>
                <div className="text-sm text-muted-foreground">Congressional Trades</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.uniqueTraders}</div>
                <div className="text-sm text-muted-foreground">Unique Traders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{formatNumber(stats.totalVolume, true)}</div>
                <div className="text-sm text-muted-foreground">Total Shares</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.recentActivity}</div>
                <div className="text-sm text-muted-foreground">Recent Activity (30d)</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Performance Metrics */}
      {performance && (
        <Card>
          <CardHeader>
            <CardTitle>Market Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Market Cap</div>
                <div className="text-lg font-semibold">{formatNumber(performance.marketCap, true)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Volume</div>
                <div className="text-lg font-semibold">{formatNumber(performance.volume, true)}</div>
              </div>
              {performance.peRatio && (
                <div>
                  <div className="text-sm text-muted-foreground">P/E Ratio</div>
                  <div className="text-lg font-semibold">{performance.peRatio}</div>
                </div>
              )}
              {performance.dividendYield && (
                <div>
                  <div className="text-sm text-muted-foreground">Dividend Yield</div>
                  <div className="text-lg font-semibold">{performance.dividendYield}%</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="trades" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trades">Recent Trades</TabsTrigger>
          <TabsTrigger value="traders">Top Traders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trades" className="space-y-4">
          {displayTrades.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">No recent trades found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check back later for new trading activity
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            displayTrades.map((trade) => (
              <Card 
                key={trade.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onTradeClick?.(trade)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {trade.transactionType === 'buy' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {trade.trader && isCongressionalMember(trade.trader) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (trade.trader && isCongressionalMember(trade.trader)) {
                                  onPoliticianClick?.(trade.trader)
                                }
                              }}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {formatPolitician(trade.trader)}
                            </button>
                          )}
                          <Badge variant={trade.transactionType === 'buy' ? 'default' : 'destructive'}>
                            {trade.transactionType.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatDate(trade.transactionDate)}
                          {trade.quantity && ` • ${trade.quantity.toLocaleString()} shares`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {trade.estimatedValue && (
                        <div className="font-semibold">
                          {formatCurrency(trade.estimatedValue)}
                        </div>
                      )}
                      {trade.amountRange && (
                        <div className="text-sm text-muted-foreground">
                          {trade.amountRange}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="traders" className="space-y-4">
          {stats?.topTraders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">No trader data available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Trader rankings will appear as more trades are recorded
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {stats?.topTraders.map((traderStat, index) => (
                <Card key={traderStat.trader.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                          {index + 1}
                        </div>
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <button
                            onClick={() => onPoliticianClick?.(traderStat.trader)}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {formatPolitician(traderStat.trader)}
                          </button>
                          <div className="text-sm text-muted-foreground">
                            {traderStat.tradeCount} trade{traderStat.tradeCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(traderStat.totalValue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Value
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}