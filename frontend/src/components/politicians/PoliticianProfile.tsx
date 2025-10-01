'use client'

import React, { useState, useEffect } from 'react'
import { User, MapPin, Calendar, TrendingUp, TrendingDown, Bell, BellOff, ExternalLink, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { cn } from '@/lib/utils'
import { CongressionalMember, StockTrade, PortfolioHolding, UserAlert, UserFollow } from '@/types/api'

interface PoliticianProfileProps {
  politician: CongressionalMember
  trades?: StockTrade[]
  portfolio?: PortfolioHolding[]
  isFollowing?: boolean
  hasAlerts?: boolean
  onFollowToggle?: (politician: CongressionalMember) => void
  onAlertToggle?: (politician: CongressionalMember) => void
  onTradeClick?: (trade: StockTrade) => void
  onStockClick?: (symbol: string) => void
  loading?: boolean
  className?: string
}

interface TradingStats {
  totalTrades: number
  totalValue: number
  buyCount: number
  sellCount: number
  avgTradeValue: number
  mostTradedStock: string
  recentActivity: number // trades in last 30 days
}

export function PoliticianProfile({
  politician,
  trades = [],
  portfolio = [],
  isFollowing = false,
  hasAlerts = false,
  onFollowToggle,
  onAlertToggle,
  onTradeClick,
  onStockClick,
  loading = false,
  className
}: PoliticianProfileProps) {
  const [stats, setStats] = useState<TradingStats | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Mock trades data
  const mockTrades: StockTrade[] = [
    {
      id: '1',
      traderType: 'congressional',
      traderId: politician.id,
      tickerSymbol: 'AAPL',
      transactionDate: '2023-12-01',
      transactionType: 'buy',
      amountRange: '$15,001-$50,000',
      estimatedValue: 32500,
      quantity: 167,
      filingDate: '2023-12-02',
      trader: politician,
      stock: {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        marketCap: 3000000000000,
        lastPrice: 195.50,
        lastUpdated: '2023-12-01T16:00:00Z',
        createdAt: '2023-01-01T00:00:00Z'
      },
      createdAt: '2023-12-02T10:00:00Z',
      updatedAt: '2023-12-02T10:00:00Z'
    },
    {
      id: '2',
      traderType: 'congressional',
      traderId: politician.id,
      tickerSymbol: 'TSLA',
      transactionDate: '2023-11-15',
      transactionType: 'sell',
      amountRange: '$1,001-$15,000',
      estimatedValue: 8500,
      quantity: 34,
      filingDate: '2023-11-16',
      trader: politician,
      stock: {
        symbol: 'TSLA',
        companyName: 'Tesla, Inc.',
        sector: 'Consumer Cyclical',
        industry: 'Auto Manufacturers',
        marketCap: 800000000000,
        lastPrice: 250.75,
        lastUpdated: '2023-12-01T16:00:00Z',
        createdAt: '2023-01-01T00:00:00Z'
      },
      createdAt: '2023-11-16T14:00:00Z',
      updatedAt: '2023-11-16T14:00:00Z'
    }
  ]

  // Mock portfolio data
  const mockPortfolio: PortfolioHolding[] = [
    {
      tickerSymbol: 'AAPL',
      companyName: 'Apple Inc.',
      netPositionValue: 125000,
      positionPercentage: 45.2,
      transactionCount: 3,
      latestTransaction: '2023-12-01'
    },
    {
      tickerSymbol: 'MSFT',
      companyName: 'Microsoft Corporation',
      netPositionValue: 87500,
      positionPercentage: 31.6,
      transactionCount: 2,
      latestTransaction: '2023-11-20'
    },
    {
      tickerSymbol: 'GOOGL',
      companyName: 'Alphabet Inc.',
      netPositionValue: 42000,
      positionPercentage: 15.2,
      transactionCount: 1,
      latestTransaction: '2023-10-15'
    }
  ]

  const displayTrades = trades.length > 0 ? trades : mockTrades
  const displayPortfolio = portfolio.length > 0 ? portfolio : mockPortfolio

  useEffect(() => {
    // Calculate trading statistics
    const totalTrades = displayTrades.length
    const totalValue = displayTrades.reduce((sum, trade) => sum + (trade.estimatedValue || 0), 0)
    const buyCount = displayTrades.filter(trade => trade.transactionType === 'buy').length
    const sellCount = displayTrades.filter(trade => trade.transactionType === 'sell').length
    const avgTradeValue = totalTrades > 0 ? totalValue / totalTrades : 0

    // Find most traded stock
    const stockCounts: Record<string, number> = {}
    displayTrades.forEach(trade => {
      stockCounts[trade.tickerSymbol] = (stockCounts[trade.tickerSymbol] || 0) + 1
    })
    const mostTradedStock = Object.entries(stockCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentActivity = displayTrades.filter(trade => 
      new Date(trade.transactionDate) >= thirtyDaysAgo
    ).length

    setStats({
      totalTrades,
      totalValue,
      buyCount,
      sellCount,
      avgTradeValue,
      mostTradedStock,
      recentActivity
    })
  }, [displayTrades])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatPosition = (politician: CongressionalMember) => {
    const position = politician.position === 'senator' ? 'Senator' : 'Representative'
    const district = politician.district ? ` (District ${politician.district})` : ''
    return `${position} from ${politician.stateCode}${district}`
  }

  const getPartyColor = (party?: string) => {
    switch (party?.toLowerCase()) {
      case 'democratic': return 'bg-blue-100 text-blue-800'
      case 'republican': return 'bg-red-100 text-red-800'
      case 'independent': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFollowToggle = async () => {
    setIsProcessing(true)
    try {
      onFollowToggle?.(politician)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAlertToggle = async () => {
    setIsProcessing(true)
    try {
      onAlertToggle?.(politician)
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
            <span>Loading politician profile...</span>
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
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(politician.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{politician.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatPosition(politician)}
                    </span>
                  </div>
                  {politician.partyAffiliation && (
                    <Badge 
                      variant="secondary" 
                      className={cn("mt-2 capitalize", getPartyColor(politician.partyAffiliation))}
                    >
                      {politician.partyAffiliation}
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={hasAlerts ? "default" : "outline"}
                    size="sm"
                    onClick={handleAlertToggle}
                    disabled={isProcessing}
                  >
                    {hasAlerts ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    {hasAlerts ? 'Alerts On' : 'Create Alert'}
                  </Button>
                  <Button
                    variant={isFollowing ? "default" : "outline"}
                    onClick={handleFollowToggle}
                    disabled={isProcessing}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>
              
              {politician.officeStartDate && (
                <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  In office since {formatDate(politician.officeStartDate)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.recentActivity}</div>
              <div className="text-sm text-muted-foreground">Recent Trades (30d)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.mostTradedStock}</div>
              <div className="text-sm text-muted-foreground">Most Traded</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="trades" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trades">Recent Trades</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Holdings</TabsTrigger>
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onStockClick?.(trade.tickerSymbol)
                            }}
                            className="font-semibold text-lg hover:underline"
                          >
                            {trade.tickerSymbol}
                          </button>
                          <Badge variant={trade.transactionType === 'buy' ? 'default' : 'destructive'}>
                            {trade.transactionType.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {trade.stock.companyName}
                        </div>
                        <div className="text-sm text-muted-foreground">
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
        
        <TabsContent value="portfolio" className="space-y-4">
          {displayPortfolio.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">No portfolio data available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Portfolio concentration will be calculated from trades
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayPortfolio.map((holding) => (
                <Card key={holding.tickerSymbol}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onStockClick?.(holding.tickerSymbol)}
                              className="font-semibold hover:underline"
                            >
                              {holding.tickerSymbol}
                            </button>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {holding.companyName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {holding.transactionCount} transaction{holding.transactionCount !== 1 ? 's' : ''}
                            {' • '}
                            Last: {formatDate(holding.latestTransaction)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(holding.netPositionValue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {holding.positionPercentage.toFixed(1)}% of portfolio
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