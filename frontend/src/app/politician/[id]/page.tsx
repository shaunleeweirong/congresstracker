'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, Users, TrendingUp, TrendingDown, ExternalLink, AlertCircle, Eye } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { PoliticianProfile } from '@/components/politicians/PoliticianProfile'
import { TradeFeed } from '@/components/trades/TradeFeed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CongressionalMember, StockTrade, StockTicker } from '@/types/api'

export default function PoliticianDetailPage() {
  const params = useParams()
  const router = useRouter()
  const politicianId = params.id as string

  const [politician, setPolitician] = useState<CongressionalMember | null>(null)
  const [trades, setTrades] = useState<StockTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [hasAlerts, setHasAlerts] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '1y' | '6m' | '3m' | '1m'>('1y')

  // Mock data - will be replaced with real API calls
  useEffect(() => {
    const fetchPoliticianData = async () => {
      try {
        setLoading(true)
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Mock politician data
        const mockPolitician: CongressionalMember = {
          id: politicianId,
          name: 'Nancy Pelosi',
          position: 'representative',
          stateCode: 'CA',
          district: 12,
          partyAffiliation: 'democratic',
          officeStartDate: '2007-01-04',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }

        // Mock trades data
        const mockTrades: StockTrade[] = [
          {
            id: '1',
            traderType: 'congressional',
            traderId: politicianId,
            tickerSymbol: 'AAPL',
            transactionDate: '2024-01-15',
            transactionType: 'buy',
            amountRange: '$1,001 - $15,000',
            estimatedValue: 8000,
            trader: mockPolitician,
            stock: {
              symbol: 'AAPL',
              companyName: 'Apple Inc.',
              sector: 'Technology',
              industry: 'Consumer Electronics',
              lastPrice: 195.50,
              lastUpdated: '2024-01-15T16:00:00Z',
              createdAt: '2023-01-01T00:00:00Z'
            },
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            traderType: 'congressional',
            traderId: politicianId,
            tickerSymbol: 'MSFT',
            transactionDate: '2024-01-10',
            transactionType: 'sell',
            amountRange: '$15,001 - $50,000',
            estimatedValue: 32500,
            trader: mockPolitician,
            stock: {
              symbol: 'MSFT',
              companyName: 'Microsoft Corporation',
              sector: 'Technology',
              industry: 'Software',
              lastPrice: 418.22,
              lastUpdated: '2024-01-10T16:00:00Z',
              createdAt: '2023-01-01T00:00:00Z'
            },
            createdAt: '2024-01-10T14:20:00Z',
            updatedAt: '2024-01-10T14:20:00Z'
          },
          {
            id: '3',
            traderType: 'congressional',
            traderId: politicianId,
            tickerSymbol: 'NVDA',
            transactionDate: '2024-01-05',
            transactionType: 'buy',
            amountRange: '$50,001 - $100,000',
            estimatedValue: 75000,
            trader: mockPolitician,
            stock: {
              symbol: 'NVDA',
              companyName: 'NVIDIA Corporation',
              sector: 'Technology',
              industry: 'Semiconductors',
              lastPrice: 739.80,
              lastUpdated: '2024-01-05T16:00:00Z',
              createdAt: '2023-01-01T00:00:00Z'
            },
            createdAt: '2024-01-05T11:45:00Z',
            updatedAt: '2024-01-05T11:45:00Z'
          }
        ]

        setPolitician(mockPolitician)
        setTrades(mockTrades)
        setIsFollowing(Math.random() > 0.5) // Random mock status
        setHasAlerts(Math.random() > 0.5) // Random mock status
      } catch (err) {
        setError('Failed to load politician data')
        console.error('Error fetching politician:', err)
      } finally {
        setLoading(false)
      }
    }

    if (politicianId) {
      fetchPoliticianData()
    }
  }, [politicianId])

  const handleFollowToggle = async (politician: CongressionalMember) => {
    try {
      // TODO: Implement follow/unfollow API call
      setIsFollowing(!isFollowing)
      console.log('Follow toggled for:', politician.name)
    } catch (err) {
      console.error('Error toggling follow:', err)
    }
  }

  const handleAlertToggle = async (politician: CongressionalMember) => {
    try {
      // TODO: Implement alert toggle API call
      setHasAlerts(!hasAlerts)
      console.log('Alert toggled for:', politician.name)
    } catch (err) {
      console.error('Error toggling alert:', err)
    }
  }

  const handleTradeClick = (trade: StockTrade) => {
    console.log('Trade clicked:', trade)
    // TODO: Show trade details modal or navigate to detailed view
  }

  const handleStockClick = (symbol: string) => {
    router.push(`/stock/${symbol}`)
  }

  // Calculate portfolio statistics
  const portfolioStats = React.useMemo(() => {
    if (!trades.length) {
      return {
        totalValue: 0,
        totalTrades: 0,
        buyTrades: 0,
        sellTrades: 0,
        avgTradeValue: 0,
        topStock: null
      }
    }

    const totalValue = trades.reduce((sum, trade) => sum + (trade.estimatedValue || 0), 0)
    const buyTrades = trades.filter(t => t.transactionType === 'buy').length
    const sellTrades = trades.filter(t => t.transactionType === 'sell').length
    
    // Find most frequently traded stock
    const stockCounts = trades.reduce((acc, trade) => {
      acc[trade.tickerSymbol] = (acc[trade.tickerSymbol] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topStock = Object.entries(stockCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null

    return {
      totalValue,
      totalTrades: trades.length,
      buyTrades,
      sellTrades,
      avgTradeValue: totalValue / trades.length,
      topStock
    }
  }, [trades])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading politician data...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !politician) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Politician not found'}
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to load the requested politician&apos;s information.
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
          <span className="text-sm text-gray-600">Politician Profile</span>
        </div>

        {/* Politician Header */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {politician.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {politician.name}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="capitalize">
                      {politician.position === 'representative' ? 'House Representative' : 'Senator'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>
                      {politician.stateCode}
                      {politician.district && `-${politician.district}`}
                    </span>
                  </div>
                  {politician.officeStartDate && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        Since {new Date(politician.officeStartDate).getFullYear()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={politician.partyAffiliation === 'democratic' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {politician.partyAffiliation}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant={hasAlerts ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAlertToggle(politician)}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {hasAlerts ? 'Alert Active' : 'Set Alert'}
              </Button>
              <Button
                variant={isFollowing ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFollowToggle(politician)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          </div>
        </div>

        {/* Portfolio Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(portfolioStats.totalValue / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-muted-foreground">
                Across {portfolioStats.totalTrades} trades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Buy/Sell Ratio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolioStats.buyTrades}:{portfolioStats.sellTrades}
              </div>
              <p className="text-xs text-muted-foreground">
                Buy vs Sell transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Trade Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(portfolioStats.avgTradeValue / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-muted-foreground">
                Per transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Stock</CardTitle>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolioStats.topStock || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Most traded symbol
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="trades" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trades">Trading Activity</TabsTrigger>
            <TabsTrigger value="profile">Profile Details</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Trading History</CardTitle>
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
                  onStockClick={(stock) => handleStockClick(stock.symbol)}
                  showFilters={true}
                  pageSize={20}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <PoliticianProfile
              politician={politician}
              isFollowing={isFollowing}
              hasAlerts={hasAlerts}
              onFollowToggle={handleFollowToggle}
              onAlertToggle={handleAlertToggle}
              onTradeClick={handleTradeClick}
              onStockClick={handleStockClick}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Portfolio Analytics
                  </h3>
                  <p className="text-gray-600">
                    Detailed portfolio analysis and charts will be available here.
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