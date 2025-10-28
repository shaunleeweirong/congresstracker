'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { SearchBar } from '@/components/search/SearchBar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StockTicker } from '@/types/api';
import { TrendingUp, Building2 } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function StocksPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [stocks, setStocks] = useState<StockTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 24;

  // Fetch stocks from API
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string> = {
          limit: String(pageSize),
          offset: String((page - 1) * pageSize),
          sortBy: 'symbol',
          sortOrder: 'asc'
        };

        const response = await fetch(
          `http://localhost:3001/api/v1/stocks?${new URLSearchParams(params)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch stocks');
        }

        const data = await response.json();
        if (data.success && data.data.stocks) {
          setStocks(data.data.stocks);
          setTotal(data.data.total);
        }
      } catch (err: unknown) {
        console.error('Error fetching stocks:', err);
        if (err instanceof Error) {
          setError(err.message || 'Failed to load stocks');
        } else {
          setError('Failed to load stocks');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [page]);

  // Filter stocks by search query
  const filteredStocks = stocks.filter(stock => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(query) ||
      stock.companyName?.toLowerCase().includes(query) ||
      stock.sector?.toLowerCase().includes(query) ||
      stock.industry?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Layout>
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Stocks</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Traded Stocks
        </h1>
        <p className="text-muted-foreground">
          Browse stocks traded by members of Congress
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          onSearch={(query, type) => {
            setSearchQuery(query);
          }}
          onSelectPolitician={(politician) => {
            router.push(`/politician/${politician.id}`);
          }}
          onSelectStock={(stock) => {
            router.push(`/stock/${stock.symbol}`);
          }}
          placeholder="Search for a stock by symbol or company name..."
          showFilters={false}
        />
      </div>

      {/* Stats */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredStocks.length} of {total} stocks
        </div>
        {totalPages > 1 && (
          <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-10 sm:h-8"
            >
              Previous
            </Button>
            <div className="flex items-center px-3 text-sm">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-10 sm:h-8"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
              <span>Loading stocks...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-500 font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try again later
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stocks Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStocks.map((stock) => (
            <Card
              key={stock.symbol}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/stock/${stock.symbol}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {stock.symbol.substring(0, 3)}
                  </div>
                  {stock.lastPrice && (
                    <Badge variant="outline" className="text-xs">
                      ${stock.lastPrice.toFixed(2)}
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {stock.symbol}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {stock.companyName}
                </p>

                {(stock.sector || stock.industry) && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {stock.sector && (
                      <Badge variant="secondary" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        {stock.sector}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    View trades
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredStocks.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">No stocks found</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search query
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination (bottom) */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-10 sm:h-8"
            >
              Previous
            </Button>
            <div className="flex items-center px-3 text-sm">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-10 sm:h-8"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
