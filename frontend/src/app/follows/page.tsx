'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Eye, EyeOff, DollarSign, CreditCard, Users, Building2, AlertCircle, Calendar } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { FollowManager } from '@/components/follows/FollowManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserFollow, CreateFollowRequest, CongressionalMember } from '../../../shared/types/api'

export default function FollowsPage() {
  const [follows, setFollows] = useState<UserFollow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock data - will be replaced with real API calls
  useEffect(() => {
    const fetchFollows = async () => {
      try {
        setLoading(true)
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Mock politicians for follows
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
            name: 'Ted Cruz',
            position: 'senator',
            stateCode: 'TX',
            partyAffiliation: 'republican',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          },
          {
            id: '3',
            name: 'Josh Gottheimer',
            position: 'representative',
            stateCode: 'NJ',
            district: 5,
            partyAffiliation: 'democratic',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ]

        // Mock follows data
        const mockFollows: UserFollow[] = [
          {
            id: '1',
            userId: 'user123',
            traderType: 'congressional',
            traderId: '1',
            followedAt: '2024-01-10T10:00:00Z',
            billingStatus: 'active',
            trader: mockPoliticians[0]
          },
          {
            id: '2',
            userId: 'user123',
            traderType: 'congressional',
            traderId: '2',
            followedAt: '2024-01-08T15:20:00Z',
            billingStatus: 'active',
            trader: mockPoliticians[1]
          },
          {
            id: '3',
            userId: 'user123',
            traderType: 'congressional',
            traderId: '3',
            followedAt: '2024-01-05T09:15:00Z',
            unfollowedAt: '2024-01-15T12:30:00Z',
            billingStatus: 'cancelled',
            trader: mockPoliticians[2]
          }
        ]

        setFollows(mockFollows)
      } catch (err) {
        setError('Failed to load follows')
        console.error('Error fetching follows:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFollows()
  }, [])

  const handleCreateFollow = async (followData: CreateFollowRequest) => {
    try {
      // TODO: Implement API call to create follow
      const newFollow: UserFollow = {
        id: Date.now().toString(),
        userId: 'user123',
        traderType: followData.traderType,
        traderId: followData.traderId,
        followedAt: new Date().toISOString(),
        billingStatus: 'active',
        trader: {
          id: followData.traderId,
          name: 'New Politician',
          position: 'representative',
          stateCode: 'XX',
          partyAffiliation: 'independent',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as CongressionalMember
      }
      
      setFollows(prev => [newFollow, ...prev])
      console.log('Follow created:', newFollow)
    } catch (err) {
      console.error('Error creating follow:', err)
    }
  }

  const handleUnfollow = async (id: string) => {
    try {
      // TODO: Implement API call to unfollow
      setFollows(prev => prev.map(follow => 
        follow.id === id 
          ? { 
              ...follow, 
              unfollowedAt: new Date().toISOString(),
              billingStatus: 'cancelled' as const
            }
          : follow
      ))
      console.log('Unfollowed:', id)
    } catch (err) {
      console.error('Error unfollowing:', err)
    }
  }

  const handleFollowClick = (follow: UserFollow) => {
    console.log('Follow clicked:', follow)
    // TODO: Navigate to politician detail page
  }

  // Calculate follow statistics
  const followStats = React.useMemo(() => {
    const totalFollows = follows.length
    const activeFollows = follows.filter(f => !f.unfollowedAt && f.billingStatus === 'active').length
    const cancelledFollows = follows.filter(f => f.unfollowedAt || f.billingStatus === 'cancelled').length
    const suspendedFollows = follows.filter(f => f.billingStatus === 'suspended').length
    
    // Mock pricing - $10 per active follow per month
    const monthlyBill = activeFollows * 10
    const annualBill = monthlyBill * 12

    return {
      totalFollows,
      activeFollows,
      cancelledFollows,
      suspendedFollows,
      monthlyBill,
      annualBill
    }
  }, [follows])

  const getTraderName = (follow: UserFollow): string => {
    if ('name' in follow.trader) {
      return follow.trader.name
    }
    return 'Unknown Trader'
  }

  const getTraderPosition = (follow: UserFollow): string => {
    if ('position' in follow.trader) {
      const trader = follow.trader as CongressionalMember
      return trader.position === 'representative' 
        ? `Rep. ${trader.stateCode}${trader.district ? `-${trader.district}` : ''}`
        : `Sen. ${trader.stateCode}`
    }
    return 'Corporate Insider'
  }

  const getTraderParty = (follow: UserFollow): string | null => {
    if ('partyAffiliation' in follow.trader) {
      return (follow.trader as CongressionalMember).partyAffiliation || null
    }
    return null
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading follows...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error}
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to load your follows at this time.
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Following</h1>
            <p className="text-gray-600 mt-2">
              Manage your followed politicians and view billing information
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Follow New Politician
          </Button>
        </div>

        {/* Billing Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Follows</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{followStats.activeFollows}</div>
              <p className="text-xs text-muted-foreground">
                Currently following
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Bill</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${followStats.monthlyBill}</div>
              <p className="text-xs text-muted-foreground">
                ${followStats.activeFollows} × $10 per follow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Estimate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${followStats.annualBill}</div>
              <p className="text-xs text-muted-foreground">
                Based on current follows
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Current</div>
              <p className="text-xs text-muted-foreground">
                Next bill: Jan 1, 2024
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    Pay-per-Follow Pricing
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p className="mb-2">
                      You are charged <strong>$10 per month</strong> for each politician you actively follow.
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Billing occurs monthly on the 1st of each month</li>
                      <li>You can follow/unfollow at any time</li>
                      <li>Pro-rated billing for partial months</li>
                      <li>No setup fees or cancellation charges</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="active">Active ({followStats.activeFollows})</TabsTrigger>
            <TabsTrigger value="all">All Follows ({followStats.totalFollows})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({followStats.cancelledFollows})</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Follows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {follows.filter(f => !f.unfollowedAt && f.billingStatus === 'active').length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active follows</h3>
                    <p className="text-gray-600 mb-4">
                      Start following politicians to get detailed trading insights.
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Follow Your First Politician
                    </Button>
                  </div>
                ) : (
                  follows
                    .filter(f => !f.unfollowedAt && f.billingStatus === 'active')
                    .map((follow) => (
                      <div
                        key={follow.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleFollowClick(follow)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {getTraderName(follow).split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {getTraderName(follow)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getTraderPosition(follow)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Following since {new Date(follow.followedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getTraderParty(follow) && (
                            <Badge 
                              variant={getTraderParty(follow) === 'democratic' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {getTraderParty(follow)}
                            </Badge>
                          )}
                          <Badge variant="outline" className="capitalize">
                            {follow.traderType}
                          </Badge>
                          <div className="text-sm text-gray-600 font-medium">
                            $10/month
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUnfollow(follow.id)
                            }}
                          >
                            <EyeOff className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Follows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {follows.map((follow) => (
                  <div
                    key={follow.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleFollowClick(follow)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        follow.billingStatus === 'active' 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : 'bg-gray-400'
                      }`}>
                        {getTraderName(follow).split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {getTraderName(follow)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getTraderPosition(follow)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {follow.unfollowedAt 
                            ? `Unfollowed ${new Date(follow.unfollowedAt).toLocaleDateString()}`
                            : `Following since ${new Date(follow.followedAt).toLocaleDateString()}`
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={follow.billingStatus === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {follow.billingStatus}
                      </Badge>
                      {follow.billingStatus === 'active' && (
                        <div className="text-sm text-gray-600 font-medium">
                          $10/month
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cancelled Follows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {follows
                  .filter(f => f.unfollowedAt || f.billingStatus === 'cancelled')
                  .map((follow) => (
                    <div
                      key={follow.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                          {getTraderName(follow).split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {getTraderName(follow)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getTraderPosition(follow)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Unfollowed {follow.unfollowedAt ? new Date(follow.unfollowedAt).toLocaleDateString() : 'Recently'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          Cancelled
                        </Badge>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <FollowManager
              onCreateFollow={handleCreateFollow}
              onUnfollow={handleUnfollow}
              onFollowClick={handleFollowClick}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}