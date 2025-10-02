'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { TradeFeed } from '@/components/trades/TradeFeed';
import { SearchBar } from '@/components/search/SearchBar';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function TradesPage() {
  const router = useRouter();

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
            <BreadcrumbPage>Congressional Trades</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Congressional Trading Activity
        </h1>
        <p className="text-muted-foreground">
          Track all stock trades made by members of Congress in real-time
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          onSearch={(query, type) => {
            console.log('Search:', query, type);
          }}
          onSelectPolitician={(politician) => {
            router.push(`/politician/${politician.id}`);
          }}
          onSelectStock={(stock) => {
            router.push(`/stock/${stock.symbol}`);
          }}
          placeholder="Search by politician name or stock symbol..."
          showFilters={true}
        />
      </div>

      {/* Trade Feed */}
      <TradeFeed
        onTradeClick={(trade) => {
          console.log('Trade clicked:', trade);
          }}
        onPoliticianClick={(politician) => {
          router.push(`/politician/${politician.id}`);
        }}
        onStockClick={(stock) => {
          router.push(`/stock/${stock.symbol}`);
        }}
        showFilters={true}
        pageSize={20}
      />
    </Layout>
  );
}
