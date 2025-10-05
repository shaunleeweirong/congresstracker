'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { SearchBar } from '@/components/search/SearchBar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CongressionalMember } from '@/types/api';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function MembersPage() {
  const router = useRouter();
  const [filterParty, setFilterParty] = useState<string | null>(null);
  const [filterPosition, setFilterPosition] = useState<string | null>(null);
  const [members, setMembers] = useState<CongressionalMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch members from API
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = { limit: 100 };
        if (filterParty) params.partyAffiliation = filterParty;
        if (filterPosition) params.position = filterPosition;

        const response = await fetch(
          `http://localhost:3001/api/v1/members?${new URLSearchParams(params)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }

        const data = await response.json();
        if (data.success && data.data.members) {
          setMembers(data.data.members);
        }
      } catch (err: any) {
        console.error('Error fetching members:', err);
        setError(err.message || 'Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [filterParty, filterPosition]);

  const filteredMembers = members;

  const formatMember = (member: CongressionalMember) => {
    const position = member.position === 'senator' ? 'Senator' : 'Representative';
    const district = member.district ? `, District ${member.district}` : '';
    return `${position} from ${member.stateCode}${district}`;
  };

  const getPartyColor = (party: string) => {
    if (party === 'democratic') return 'bg-blue-100 text-blue-800';
    if (party === 'republican') return 'bg-red-100 text-red-800';
    return 'bg-accent text-accent-foreground';
  };

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
            <BreadcrumbPage>Congressional Members</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Congressional Members
        </h1>
        <p className="text-muted-foreground">
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

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
              <span>Loading members...</span>
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

      {/* Members Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
          <Card
            key={member.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/politician/${member.id}`)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {member.name}
                </h3>
                <Badge className={getPartyColor(member.partyAffiliation)}>
                  {member.partyAffiliation?.charAt(0).toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {formatMember(member)}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  View trading activity
                </span>
                <span className="text-blue-600">→</span>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredMembers.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">No members found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
