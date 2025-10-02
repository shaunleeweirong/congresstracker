'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CongressionalMember } from '@/types/api';

export default function MembersPage() {
  const router = useRouter();
  const [filterParty, setFilterParty] = useState<string | null>(null);
  const [filterPosition, setFilterPosition] = useState<string | null>(null);

  // Mock members data - replace with API call
  const mockMembers: CongressionalMember[] = [
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
    },
    {
      id: '3',
      name: 'Ted Cruz',
      position: 'senator',
      stateCode: 'TX',
      partyAffiliation: 'republican',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '4',
      name: 'Alexandria Ocasio-Cortez',
      position: 'representative',
      stateCode: 'NY',
      district: 14,
      partyAffiliation: 'democratic',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ];

  const filteredMembers = mockMembers.filter(member => {
    if (filterParty && member.partyAffiliation !== filterParty) return false;
    if (filterPosition && member.position !== filterPosition) return false;
    return true;
  });

  const formatMember = (member: CongressionalMember) => {
    const position = member.position === 'senator' ? 'Senator' : 'Representative';
    const district = member.district ? `, District ${member.district}` : '';
    return `${position} from ${member.stateCode}${district}`;
  };

  const getPartyColor = (party: string) => {
    if (party === 'democratic') return 'bg-blue-100 text-blue-800';
    if (party === 'republican') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Congressional Members
          </h1>
          <p className="text-gray-600">
            Browse and search members of Congress who have filed stock trades
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
            placeholder="Search for a congressional member..."
            showFilters={false}
          />
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex gap-2">
            <Button
              variant={filterParty === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterParty(null)}
            >
              All Parties
            </Button>
            <Button
              variant={filterParty === 'democratic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterParty('democratic')}
            >
              Democratic
            </Button>
            <Button
              variant={filterParty === 'republican' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterParty('republican')}
            >
              Republican
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filterPosition === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition(null)}
            >
              All Positions
            </Button>
            <Button
              variant={filterPosition === 'senator' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition('senator')}
            >
              Senators
            </Button>
            <Button
              variant={filterPosition === 'representative' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition('representative')}
            >
              Representatives
            </Button>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/politician/${member.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {member.name}
                  </h3>
                  <Badge className={getPartyColor(member.partyAffiliation)}>
                    {member.partyAffiliation?.charAt(0).toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {formatMember(member)}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    View trading activity
                  </span>
                  <span className="text-blue-600">→</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-600">No members found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your filters
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
