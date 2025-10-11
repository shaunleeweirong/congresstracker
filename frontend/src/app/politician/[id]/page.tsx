'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

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

  // Fetch real data from API
  useEffect(() => {
    const fetchPoliticianData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch politician details
        const memberResponse = await fetch(`http://localhost:3001/api/v1/members/${politicianId}`)

        if (!memberResponse.ok) {
          throw new Error('Failed to fetch politician')
        }

        const memberData = await memberResponse.json()
        if (!memberData.success || !memberData.data) {
          throw new Error('Politician not found')
        }

        const politician = memberData.data
        setPolitician(politician)

        // Fetch politician's trades
        const tradesResponse = await fetch(
          `http://localhost:3001/api/v1/members/${politicianId}/trades?limit=50&sortBy=transactionDate&sortOrder=desc`
        )

        if (!tradesResponse.ok) {
          throw new Error('Failed to fetch trades')
        }

        const tradesData = await tradesResponse.json()
        if (tradesData.success && tradesData.data.trades) {
          setTrades(tradesData.data.trades)
        }

        // Mock follow/alert status for now (these would come from user auth/preferences)
        setIsFollowing(false)
        setHasAlerts(false)
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
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/members">Members</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{politician.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

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
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4 w-full sm:w-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {politician.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {politician.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 mb-4 text-sm sm:text-base">
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant={hasAlerts ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAlertToggle(politician)}
                className="h-10 sm:h-8 flex-1 sm:flex-initial"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {hasAlerts ? 'Alert Active' : 'Set Alert'}
              </Button>
              <Button
                variant={isFollowing ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFollowToggle(politician)}
                className="h-10 sm:h-8 flex-1 sm:flex-initial"
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
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="trades">Trading Activity</TabsTrigger>
            <TabsTrigger value="profile">Profile Details</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Trading History</CardTitle>
                <div className="flex items-center justify-center sm:justify-end">
                  <div className="flex rounded-md border w-full sm:w-auto">
                    {(['all', '1y', '6m', '3m', '1m'] as const).map((timeframe) => (
                      <Button
                        key={timeframe}
                        variant={selectedTimeframe === timeframe ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTimeframe(timeframe)}
                        className="rounded-none first:rounded-l-md last:rounded-r-md h-10 sm:h-8 flex-1 sm:flex-initial"
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