'use client'

import React from 'react'
import { SearchBar } from '@/components/search/SearchBar'
import { TradeFeed } from '@/components/trades/TradeFeed'
import { PoliticianProfile } from '@/components/politicians/PoliticianProfile'
import { StockProfile } from '@/components/stocks/StockProfile'
import { AlertManager } from '@/components/alerts/AlertManager'
import { FollowManager } from '@/components/follows/FollowManager'
import { CongressionalMember, StockTicker } from '../../../shared/types/api'

export default function DemoPage() {
  // Mock data for demonstrations
  const mockPolitician: CongressionalMember = {
    id: '1',
    name: 'Nancy Pelosi',
    position: 'representative',
    stateCode: 'CA',
    district: 12,
    partyAffiliation: 'democratic',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }

  const mockStock: StockTicker = {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    marketCap: 3000000000000,
    lastPrice: 195.50,
    lastUpdated: '2023-12-01T16:00:00Z',
    createdAt: '2023-01-01T00:00:00Z'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Congressional Trading Components Demo
          </h1>
          <p className="text-gray-600">
            Interactive demonstration of all frontend components
          </p>
        </div>

        {/* Search Component */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Search Component</h2>
          <SearchBar
            onSearch={(query, type) => console.log('Search:', query, type)}
            onSelectPolitician={(politician) => console.log('Selected politician:', politician)}
            onSelectStock={(stock) => console.log('Selected stock:', stock)}
            placeholder="Search politicians or stocks..."
            showFilters={true}
            autoFocus={false}
          />
        </section>

        {/* Trading Feed Component */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Trading Feed</h2>
          <TradeFeed
            onTradeClick={(trade) => console.log('Trade clicked:', trade)}
            onPoliticianClick={(politician) => console.log('Politician clicked:', politician)}
            onStockClick={(stock) => console.log('Stock clicked:', stock)}
            showFilters={true}
            pageSize={10}
          />
        </section>

        {/* Politician Profile Component */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Politician Profile</h2>
          <PoliticianProfile
            politician={mockPolitician}
            isFollowing={false}
            hasAlerts={false}
            onFollowToggle={(politician) => console.log('Follow toggled:', politician)}
            onAlertToggle={(politician) => console.log('Alert toggled:', politician)}
            onTradeClick={(trade) => console.log('Trade clicked:', trade)}
            onStockClick={(symbol) => console.log('Stock clicked:', symbol)}
          />
        </section>

        {/* Stock Profile Component */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Stock Profile</h2>
          <StockProfile
            stock={mockStock}
            hasAlerts={false}
            onAlertToggle={(stock) => console.log('Alert toggled:', stock)}
            onTradeClick={(trade) => console.log('Trade clicked:', trade)}
            onPoliticianClick={(politician) => console.log('Politician clicked:', politician)}
          />
        </section>

        {/* Alert Manager Component */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Alert Manager</h2>
          <AlertManager
            onCreateAlert={async (alert) => console.log('Create alert:', alert)}
            onUpdateAlert={async (id, update) => console.log('Update alert:', id, update)}
            onDeleteAlert={async (id) => console.log('Delete alert:', id)}
            onAlertClick={(alert) => console.log('Alert clicked:', alert)}
          />
        </section>

        {/* Follow Manager Component */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Follow Manager</h2>
          <FollowManager
            onCreateFollow={async (follow) => console.log('Create follow:', follow)}
            onUnfollow={async (id) => console.log('Unfollow:', id)}
            onFollowClick={(follow) => console.log('Follow clicked:', follow)}
          />
        </section>
      </div>
    </div>
  )
}