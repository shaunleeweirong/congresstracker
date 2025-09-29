'use client'

import React, { useState, useEffect } from 'react'
import { UserPlus, UserMinus, User, Building2, DollarSign, Calendar, CreditCard, AlertCircle, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { cn } from '@/lib/utils'
import { UserFollow, CongressionalMember, CorporateInsider, CreateFollowRequest, isCongressionalMember } from '../../../../shared/types/api'

interface FollowManagerProps {
  follows?: UserFollow[]
  onCreateFollow?: (follow: CreateFollowRequest) => Promise<void>
  onUnfollow?: (followId: string) => Promise<void>
  onFollowClick?: (follow: UserFollow) => void
  loading?: boolean
  error?: string
  className?: string
}

interface FollowFormData {
  traderType: 'congressional' | 'corporate'
  traderId?: string
  traderName?: string
}

interface BillingInfo {
  totalMonthlyFee: number
  nextBillingDate: string
  paymentMethod: string
  followsIncluded: number
  additionalFollows: number
  pricePerFollow: number
}

export function FollowManager({
  follows = [],
  onCreateFollow,
  onUnfollow,
  onFollowClick,
  loading = false,
  error,
  className
}: FollowManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formData, setFormData] = useState<FollowFormData>({
    traderType: 'congressional'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'cancelled'>('all')

  // Mock follows data
  const mockFollows: UserFollow[] = [
    {
      id: '1',
      userId: 'user1',
      traderType: 'congressional',
      traderId: '1',
      followedAt: '2023-12-01T10:00:00Z',
      billingStatus: 'active',
      trader: {
        id: '1',
        name: 'Nancy Pelosi',
        position: 'representative',
        stateCode: 'CA',
        district: 12,
        partyAffiliation: 'democratic',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
    },
    {
      id: '2',
      userId: 'user1',
      traderType: 'congressional',
      traderId: '2',
      followedAt: '2023-11-15T14:00:00Z',
      billingStatus: 'active',
      trader: {
        id: '2',
        name: 'Chuck Schumer',
        position: 'senator',
        stateCode: 'NY',
        partyAffiliation: 'democratic',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
    },
    {
      id: '3',
      userId: 'user1',
      traderType: 'congressional',
      traderId: '3',
      followedAt: '2023-10-20T09:00:00Z',
      unfollowedAt: '2023-12-10T16:00:00Z',
      billingStatus: 'cancelled',
      trader: {
        id: '3',
        name: 'Mitch McConnell',
        position: 'senator',
        stateCode: 'KY',
        partyAffiliation: 'republican',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
    }
  ]

  // Mock available politicians and corporate insiders
  const mockPoliticians: CongressionalMember[] = [
    {
      id: '4',
      name: 'Alexandria Ocasio-Cortez',
      position: 'representative',
      stateCode: 'NY',
      district: 14,
      partyAffiliation: 'democratic',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '5',
      name: 'Ted Cruz',
      position: 'senator',
      stateCode: 'TX',
      partyAffiliation: 'republican',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ]

  const mockCorporateInsiders: CorporateInsider[] = [
    {
      id: '1',
      name: 'Elon Musk',
      companyName: 'Tesla, Inc.',
      position: 'CEO',
      tickerSymbol: 'TSLA',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Tim Cook',
      companyName: 'Apple Inc.',
      position: 'CEO',
      tickerSymbol: 'AAPL',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ]

  // Mock billing info
  const mockBillingInfo: BillingInfo = {
    totalMonthlyFee: 15.98,
    nextBillingDate: '2024-01-01',
    paymentMethod: '**** 4242',
    followsIncluded: 0, // Free tier includes 0 follows
    additionalFollows: 2,
    pricePerFollow: 7.99
  }

  const displayFollows = follows.length > 0 ? follows : mockFollows

  // Filter follows based on search and status
  const filteredFollows = displayFollows.filter(follow => {
    // Status filter
    if (statusFilter !== 'all' && follow.billingStatus !== statusFilter) {
      return false
    }

    // Search filter
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    const traderName = follow.trader.name.toLowerCase()
    
    if (isCongressionalMember(follow.trader)) {
      const stateCode = follow.trader.stateCode.toLowerCase()
      return traderName.includes(query) || stateCode.includes(query)
    } else {
      const companyName = follow.trader.companyName?.toLowerCase() || ''
      return traderName.includes(query) || companyName.includes(query)
    }
  })

  const resetForm = () => {
    setFormData({ traderType: 'congressional' })
  }

  const handleCreateFollow = async () => {
    if (!onCreateFollow || !formData.traderId) return

    setIsSubmitting(true)
    try {
      const followRequest: CreateFollowRequest = {
        traderType: formData.traderType,
        traderId: formData.traderId
      }

      await onCreateFollow(followRequest)
      setShowAddDialog(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create follow:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnfollow = async (followId: string) => {
    if (!onUnfollow) return

    try {
      await onUnfollow(followId)
    } catch (error) {
      console.error('Failed to unfollow:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatPolitician = (trader: CongressionalMember) => {
    const position = trader.position === 'senator' ? 'Sen.' : 'Rep.'
    const party = trader.partyAffiliation?.charAt(0).toUpperCase() || ''
    const district = trader.district ? `-${trader.district}` : ''
    return `${position} ${trader.name} (${party}-${trader.stateCode}${district})`
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'suspended':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Suspended</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPartyColor = (party?: string) => {
    switch (party?.toLowerCase()) {
      case 'democratic': return 'border-l-blue-500'
      case 'republican': return 'border-l-red-500'
      case 'independent': return 'border-l-gray-500'
      default: return 'border-l-gray-300'
    }
  }

  const activeFollows = filteredFollows.filter(f => f.billingStatus === 'active')
  const availablePoliticians = mockPoliticians.filter(p => 
    !displayFollows.some(f => f.traderId === p.id && f.billingStatus === 'active')
  )
  const availableCorporateInsiders = mockCorporateInsiders.filter(c => 
    !displayFollows.some(f => f.traderId === c.id && f.billingStatus === 'active')
  )

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Error loading follows</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header & Billing Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Following</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Track specific politicians and corporate insiders for detailed trading insights
                </p>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow Trader
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Follow New Trader</DialogTitle>
                    <DialogDescription>
                      Follow a politician or corporate insider to get detailed trading insights.
                      Each follow costs {formatCurrency(mockBillingInfo.pricePerFollow)}/month.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Trader Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={formData.traderType === 'congressional' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, traderType: 'congressional' }))}
                        >
                          <User className="h-3 w-3 mr-1" />
                          Politicians
                        </Button>
                        <Button
                          variant={formData.traderType === 'corporate' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, traderType: 'corporate' }))}
                        >
                          <Building2 className="h-3 w-3 mr-1" />
                          Corporate
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Select {formData.traderType === 'congressional' ? 'Politician' : 'Corporate Insider'}
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {formData.traderName || `Select ${formData.traderType === 'congressional' ? 'politician' : 'insider'}...`}
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          {formData.traderType === 'congressional' ? (
                            availablePoliticians.map(politician => (
                              <DropdownMenuItem
                                key={politician.id}
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  traderId: politician.id,
                                  traderName: formatPolitician(politician)
                                }))}
                              >
                                {formatPolitician(politician)}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            availableCorporateInsiders.map(insider => (
                              <DropdownMenuItem
                                key={insider.id}
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  traderId: insider.id,
                                  traderName: `${insider.name} (${insider.companyName})`
                                }))}
                              >
                                {insider.name} - {insider.companyName}
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateFollow}
                      disabled={isSubmitting || !formData.traderId}
                    >
                      {isSubmitting ? 'Following...' : `Follow for ${formatCurrency(mockBillingInfo.pricePerFollow)}/mo`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search follows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {statusFilter === 'all' ? 'All Status' : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('suspended')}>
                    Suspended
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>
                    Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="text-sm text-muted-foreground">
                {filteredFollows.length} follow{filteredFollows.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Active Follows</span>
              <span className="font-medium">{activeFollows.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monthly Fee</span>
              <span className="font-medium">{formatCurrency(mockBillingInfo.totalMonthlyFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Next Billing</span>
              <span className="font-medium">{formatDate(mockBillingInfo.nextBillingDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <span className="font-medium">{mockBillingInfo.paymentMethod}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Each follow: {formatCurrency(mockBillingInfo.pricePerFollow)}/month
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follows List */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                <span>Loading follows...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredFollows.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No follows match your search' : 'No follows yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? 'Try a different search term' : 'Follow politicians and corporate insiders to get detailed insights'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredFollows.map((follow) => (
            <Card 
              key={follow.id}
              className={cn(
                "cursor-pointer hover:shadow-md transition-shadow border-l-4",
                isCongressionalMember(follow.trader) ? getPartyColor(follow.trader.partyAffiliation) : 'border-l-blue-500'
              )}
              onClick={() => onFollowClick?.(follow)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-sm font-semibold">
                        {getInitials(follow.trader.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {isCongressionalMember(follow.trader) 
                            ? formatPolitician(follow.trader)
                            : follow.trader.name
                          }
                        </h3>
                        {getStatusBadge(follow.billingStatus)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Followed {formatDate(follow.followedAt)}
                        </div>
                        {!isCongressionalMember(follow.trader) && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {follow.trader.companyName}
                          </div>
                        )}
                        {follow.unfollowedAt && (
                          <div>
                            Unfollowed {formatDate(follow.unfollowedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className="font-medium">
                        {formatCurrency(mockBillingInfo.pricePerFollow)}
                      </div>
                      <div className="text-sm text-muted-foreground">per month</div>
                    </div>
                    
                    {follow.billingStatus === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnfollow(follow.id)
                        }}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}