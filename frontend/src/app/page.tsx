'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Users, Building2, AlertCircle, Eye, ArrowRight } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { SearchBar } from '@/components/search/SearchBar'
import { TradeFeed } from '@/components/trades/TradeFeed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CongressionalMember, StockTicker, StockTrade } from '../../../shared/types/api'

export default function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>('week')

  // Mock data - will be replaced with real API calls
  const recentTrades: StockTrade[] = [
    {
      id: '1',
      traderType: 'congressional',
      traderId: '1',
      tickerSymbol: 'AAPL',
      transactionDate: '2024-01-15',
      transactionType: 'buy',
      amountRange: '$1,001 - $15,000',
      estimatedValue: 8000,
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
      traderId: '2',
      tickerSymbol: 'TSLA',
      transactionDate: '2024-01-14',
      transactionType: 'sell',
      amountRange: '$15,001 - $50,000',
      estimatedValue: 32500,
      trader: {
        id: '2',
        name: 'Ted Cruz',
        position: 'senator',
        stateCode: 'TX',
        partyAffiliation: 'republican',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
      stock: {
        symbol: 'TSLA',
        companyName: 'Tesla, Inc.',
        sector: 'Automotive',
        industry: 'Electric Vehicles',
        lastPrice: 248.75,
        lastUpdated: '2024-01-14T16:00:00Z',
        createdAt: '2023-01-01T00:00:00Z'
      },
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-14T14:20:00Z'
    }
  ]

  const dashboardStats = {
    totalTrades: 1247,
    totalMembers: 535,
    totalValue: 45600000,
    alertsTriggered: 23
  }

  const topStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', trades: 87, value: 2400000 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', trades: 65, value: 1800000 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', trades: 42, value: 1200000 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', trades: 38, value: 950000 }
  ]

  const topTraders = [
    { name: 'Nancy Pelosi', party: 'Democratic', trades: 15, value: 450000 },
    { name: 'Dan Crenshaw', party: 'Republican', trades: 12, value: 380000 },
    { name: 'Josh Gottheimer', party: 'Democratic', trades: 11, value: 320000 },
    { name: 'Pat Fallon', party: 'Republican', trades: 9, value: 275000 }
  ]

  const handleSearch = (query: string, type?: 'politician' | 'stock' | 'all') => {
    console.log('Dashboard search:', query, type)
    // TODO: Implement search navigation
  }

  const handleSelectPolitician = (politician: CongressionalMember) => {
    console.log('Selected politician:', politician)
    // TODO: Navigate to politician detail page
  }

  const handleSelectStock = (stock: StockTicker) => {
    console.log('Selected stock:', stock)
    // TODO: Navigate to stock detail page
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalTrades.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                House & Senate combined
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(dashboardStats.totalValue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                Trading volume this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts Triggered</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.alertsTriggered}</div>
              <p className="text-xs text-muted-foreground">
                In the last 24 hours
              </p>
            </CardContent>
          </Card>
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
                <TradeFeed
                  trades={recentTrades}
                  onTradeClick={handleTradeClick}
                  onPoliticianClick={handlePoliticianClick}
                  onStockClick={handleStockClick}
                  showFilters={false}
                  pageSize={10}
                />
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
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-sm text-muted-foreground">{stock.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${(stock.value / 1000000).toFixed(1)}M</div>
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
                      <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{trader.name}</div>
                        <Badge 
                          variant={trader.party === 'Democratic' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {trader.party}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${(trader.value / 1000).toFixed(0)}K</div>
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