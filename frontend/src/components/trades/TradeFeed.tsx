'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, Filter, TrendingUp, TrendingDown, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { StockTrade, TradeFilters, CongressionalMember, StockTicker, isCongressionalMember } from '@/types/api'
import { apiClient } from '@/lib/api'

interface TradeFeedProps {
  trades?: StockTrade[]
  onTradeClick?: (trade: StockTrade) => void
  onPoliticianClick?: (politician: CongressionalMember) => void
  onStockClick?: (stock: StockTicker) => void
  loading?: boolean
  error?: string
  className?: string
  showFilters?: boolean
  pageSize?: number
}

type SortField = 'transactionDate' | 'estimatedValue' | 'traderName'
type SortDirection = 'asc' | 'desc'

interface FilterState extends TradeFilters {
  sortField: SortField
  sortDirection: SortDirection
}

export function TradeFeed({
  trades: propTrades,
  onTradeClick,
  onPoliticianClick,
  onStockClick,
  loading: propLoading = false,
  error: propError,
  className,
  showFilters = true,
  pageSize = 20
}: TradeFeedProps) {
  const [filters, setFilters] = useState<FilterState>({
    sortField: 'transactionDate',
    sortDirection: 'desc',
    page: 1,
    limit: pageSize
  })
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [fetchedTrades, setFetchedTrades] = useState<StockTrade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch trades from API if not provided as props
  useEffect(() => {
    const fetchTrades = async () => {
      if (propTrades && propTrades.length > 0) {
        // Use provided trades
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await apiClient.get('/trades/recent', {
          params: {
            limit: pageSize,
            sortBy: filters.sortField,
            sortOrder: filters.sortDirection
          }
        })

        if (response.data.success && response.data.data.trades) {
          setFetchedTrades(response.data.data.trades)
        }
      } catch (err: any) {
        console.error('Error fetching trades:', err)
        setError(err.message || 'Failed to load trades')
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
  }, [propTrades, pageSize, filters.sortField, filters.sortDirection])

  // Mock trades data - only used as fallback if API fetch fails
  const mockTrades: StockTrade[] = [
    {
      id: '1',
      traderType: 'congressional',
      traderId: '1',
      tickerSymbol: 'AAPL',
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
      traderId: '2',
      tickerSymbol: 'TSLA',
      transactionDate: '2023-11-30',
      transactionType: 'sell',
      amountRange: '$50,001-$100,000',
      estimatedValue: 75000,
      quantity: 300,
      filingDate: '2023-12-01',
      trader: {
        id: '2',
        name: 'Chuck Schumer',
        position: 'senator',
        stateCode: 'NY',
        partyAffiliation: 'democratic',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
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
      createdAt: '2023-12-01T15:00:00Z',
      updatedAt: '2023-12-01T15:00:00Z'
    }
  ]

  // Use provided trades, fetched trades, or mock data as fallback
  const displayTrades = propTrades && propTrades.length > 0
    ? propTrades
    : fetchedTrades.length > 0
      ? fetchedTrades
      : mockTrades

  // Use useMemo instead of useEffect to prevent infinite loops
  const filteredTrades = useMemo(() => {
    let filtered = [...displayTrades]

    // Apply filters
    if (filters.startDate) {
      filtered = filtered.filter(trade => new Date(trade.transactionDate) >= new Date(filters.startDate!))
    }
    if (filters.endDate) {
      filtered = filtered.filter(trade => new Date(trade.transactionDate) <= new Date(filters.endDate!))
    }
    if (filters.transactionType) {
      filtered = filtered.filter(trade => trade.transactionType === filters.transactionType)
    }
    if (filters.tickerSymbol) {
      filtered = filtered.filter(trade =>
        trade.tickerSymbol.toLowerCase().includes(filters.tickerSymbol!.toLowerCase())
      )
    }
    if (filters.minValue && filters.maxValue) {
      filtered = filtered.filter(trade => {
        const value = trade.estimatedValue || 0
        return value >= filters.minValue! && value <= filters.maxValue!
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date

      switch (filters.sortField) {
        case 'transactionDate':
          aValue = new Date(a.transactionDate)
          bValue = new Date(b.transactionDate)
          break
        case 'estimatedValue':
          aValue = a.estimatedValue || 0
          bValue = b.estimatedValue || 0
          break
        case 'traderName':
          aValue = a.trader.name
          bValue = b.trader.name
          break
        default:
          return 0
      }

      if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [displayTrades, filters.startDate, filters.endDate, filters.transactionType, filters.tickerSymbol, filters.minValue, filters.maxValue, filters.sortField, filters.sortDirection])

  const handleFilterChange = (key: keyof FilterState, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSort = (field: SortField) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }))
  }

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

  const getTransactionIcon = (type: string) => {
    return type === 'buy' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    )
  }

  const getTransactionBadge = (type: string) => {
    return (
      <Badge variant={type === 'buy' ? 'default' : 'destructive'} className="capitalize">
        {type}
      </Badge>
    )
  }

  const formatPolitician = (trader: CongressionalMember) => {
    const position = trader.position === 'senator' ? 'Sen.' : 'Rep.'
    const party = trader.partyAffiliation?.charAt(0).toUpperCase() || ''
    return `${position} ${trader.name} (${party}-${trader.stateCode})`
  }

  const getSortIcon = (field: SortField) => {
    if (filters.sortField !== field) return null
    return filters.sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading trades</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Trading Activity</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Sort by {filters.sortField}
                      {getSortIcon(filters.sortField)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSort('transactionDate')}>
                      Transaction Date
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('estimatedValue')}>
                      Estimated Value
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('traderName')}>
                      Trader Name
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          
          {showFiltersPanel && (
            <CardContent className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date</label>
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Transaction Type</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {filters.transactionType || 'All Types'}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleFilterChange('transactionType', undefined)}>
                        All Types
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFilterChange('transactionType', 'buy')}>
                        Buy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFilterChange('transactionType', 'sell')}>
                        Sell
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFilterChange('transactionType', 'exchange')}>
                        Exchange
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Stock Symbol</label>
                  <Input
                    placeholder="e.g., AAPL"
                    value={filters.tickerSymbol || ''}
                    onChange={(e) => handleFilterChange('tickerSymbol', e.target.value)}
                  />
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      sortField: 'transactionDate',
                      sortDirection: 'desc',
                      page: 1,
                      limit: pageSize
                    })}
                    className="mt-6"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <div className="space-y-3">
        {(loading || propLoading) ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                <span>Loading trades...</span>
              </div>
            </CardContent>
          </Card>
        ) : (error || propError) ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-500 font-medium">{error || propError}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please try again later
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredTrades.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground">No trades found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTrades.map((trade) => (
            <Card
              key={trade.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTransactionIcon(trade.transactionType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (trade.trader && isCongressionalMember(trade.trader)) {
                              onPoliticianClick?.(trade.trader)
                            }
                          }}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {trade.trader
                            ? (isCongressionalMember(trade.trader)
                                ? formatPolitician(trade.trader)
                                : trade.trader.name)
                            : 'Unknown Trader'
                          }
                        </button>
                        {getTransactionBadge(trade.transactionType)}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (trade.stock) {
                              onStockClick?.(trade.stock)
                            }
                          }}
                          className="text-lg font-semibold text-green-600 hover:underline"
                        >
                          {trade.stock?.symbol || trade.tickerSymbol || 'N/A'}
                        </button>
                        <span className="text-muted-foreground">
                          {trade.stock?.companyName || 'Unknown Company'}
                        </span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(trade.transactionDate)}
                        </div>
                        {trade.quantity && (
                          <div>
                            {trade.quantity.toLocaleString()} shares
                          </div>
                        )}
                        {trade.amountRange && (
                          <div>
                            Range: {trade.amountRange}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                    {trade.estimatedValue && (
                      <div className="text-lg font-semibold">
                        {formatCurrency(trade.estimatedValue)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Filed: {formatDate(trade.filingDate || trade.transactionDate)}
                    </div>
                    {(trade as any).sourceData?.originalData?.link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open((trade as any).sourceData.originalData.link, '_blank')
                        }}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Filing
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredTrades.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline">
            Load More Trades
          </Button>
        </div>
      )}
    </div>
  )
}