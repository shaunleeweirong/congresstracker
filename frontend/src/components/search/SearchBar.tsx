'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, User, Building2 } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn } from '@/lib/utils'
import { SearchRequest, SearchResponse, CongressionalMember, StockTicker } from '../../../../shared/types/api'

interface SearchBarProps {
  onSearch?: (query: string, type?: 'politician' | 'stock' | 'all') => void
  onSelectPolitician?: (politician: CongressionalMember) => void
  onSelectStock?: (stock: StockTicker) => void
  placeholder?: string
  className?: string
  showFilters?: boolean
  autoFocus?: boolean
}

interface SearchSuggestion {
  type: 'politician' | 'stock'
  data: CongressionalMember | StockTicker
}

export function SearchBar({
  onSearch,
  onSelectPolitician,
  onSelectStock,
  placeholder = "Search politicians or stocks...",
  className,
  showFilters = true,
  autoFocus = false
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'politician' | 'stock'>('all')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([])
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Mock API call - replace with actual API integration
  const searchSuggestions = async (searchQuery: string, type: 'all' | 'politician' | 'stock' = 'all') => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
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
        name: 'Chuck Schumer',
        position: 'senator',
        stateCode: 'NY',
        partyAffiliation: 'democratic',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
    ]

    const mockStocks: StockTicker[] = [
      {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        marketCap: 3000000000000,
        lastPrice: 195.50,
        lastUpdated: '2023-12-01T16:00:00Z',
        createdAt: '2023-01-01T00:00:00Z'
      },
      {
        symbol: 'TSLA',
        companyName: 'Tesla, Inc.',
        sector: 'Consumer Cyclical',
        industry: 'Auto Manufacturers',
        marketCap: 800000000000,
        lastPrice: 250.75,
        lastUpdated: '2023-12-01T16:00:00Z',
        createdAt: '2023-01-01T00:00:00Z'
      }
    ]

    const filteredPoliticians = mockPoliticians.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    const filteredStocks = mockStocks.filter(s => 
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const results: SearchSuggestion[] = []
    
    if (type === 'all' || type === 'politician') {
      results.push(...filteredPoliticians.map(p => ({ type: 'politician' as const, data: p })))
    }
    
    if (type === 'all' || type === 'stock') {
      results.push(...filteredStocks.map(s => ({ type: 'stock' as const, data: s })))
    }

    return results
  }

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (query.trim().length > 1) {
      debounceTimer.current = setTimeout(async () => {
        setIsLoading(true)
        try {
          const results = await searchSuggestions(query, searchType)
          setSuggestions(results)
          setShowSuggestions(true)
          setSelectedIndex(-1)
        } catch (error) {
          console.error('Search error:', error)
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      }, 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, searchType])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query, searchType === 'all' ? undefined : searchType)
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'politician') {
      onSelectPolitician?.(suggestion.data as CongressionalMember)
    } else {
      onSelectStock?.(suggestion.data as StockTicker)
    }
    setQuery('')
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const formatPolitician = (politician: CongressionalMember) => {
    const position = politician.position === 'senator' ? 'Sen.' : 'Rep.'
    const party = politician.partyAffiliation?.charAt(0).toUpperCase() || ''
    return `${position} ${politician.name} (${party}-${politician.stateCode}${politician.district ? `-${politician.district}` : ''})`
  }

  const formatStock = (stock: StockTicker) => {
    return `${stock.symbol} - ${stock.companyName}`
  }

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      <div className="flex flex-col gap-2">
        {showFilters && (
          <div className="flex gap-2">
            <Button
              variant={searchType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('all')}
            >
              All
            </Button>
            <Button
              variant={searchType === 'politician' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('politician')}
            >
              Politicians
            </Button>
            <Button
              variant={searchType === 'stock' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('stock')}
            >
              Stocks
            </Button>
          </div>
        )}
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow for clicks
                setTimeout(() => setShowSuggestions(false), 200)
              }}
              className="pl-10 pr-20"
              autoFocus={autoFocus}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearch}
                className="h-6 w-6 p-0"
                disabled={!query.trim()}
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <Card className="absolute top-full z-50 mt-1 w-full border shadow-lg">
              <div className="max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.data.id || (suggestion.data as StockTicker).symbol}`}
                    ref={el => suggestionRefs.current[index] = el}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0 hover:bg-muted/50",
                      selectedIndex === index && "bg-muted"
                    )}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <div className="flex-shrink-0">
                      {suggestion.type === 'politician' ? (
                        <User className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Building2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {suggestion.type === 'politician' 
                          ? formatPolitician(suggestion.data as CongressionalMember)
                          : formatStock(suggestion.data as StockTicker)
                        }
                      </div>
                      {suggestion.type === 'stock' && (
                        <div className="text-sm text-muted-foreground truncate">
                          {(suggestion.data as StockTicker).sector}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      {suggestion.type === 'politician' ? 'Politician' : 'Stock'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* No results message */}
          {showSuggestions && suggestions.length === 0 && query.trim().length > 1 && !isLoading && (
            <Card className="absolute top-full z-50 mt-1 w-full border shadow-lg">
              <div className="p-3 text-center text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}