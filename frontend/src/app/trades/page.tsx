'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { TradeFeed } from '@/components/trades/TradeFeed';
import { SearchBar } from '@/components/search/SearchBar';

export default function TradesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Congressional Trading Activity
          </h1>
          <p className="text-gray-600">
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
      </div>
    </div>
  );
}
