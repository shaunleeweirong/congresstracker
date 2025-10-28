'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Bell, BellOff, Edit, Trash2, AlertCircle, Users, Building2, TrendingUp } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { AlertManager } from '@/components/alerts/AlertManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserAlert, CreateAlertRequest, UpdateAlertRequest } from '@/types/api'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<UserAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setShowCreateAlert] = useState(false)

  // Mock data - will be replaced with real API calls
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Mock alerts data
        const mockAlerts: UserAlert[] = [
          {
            id: '1',
            userId: 'user123',
            alertType: 'politician',
            alertStatus: 'active',
            politicianId: '1',
            createdAt: '2024-01-10T10:00:00Z',
            updatedAt: '2024-01-10T10:00:00Z',
            lastTriggeredAt: '2024-01-15T14:30:00Z'
          },
          {
            id: '2',
            userId: 'user123',
            alertType: 'stock',
            alertStatus: 'active',
            tickerSymbol: 'AAPL',
            createdAt: '2024-01-08T15:20:00Z',
            updatedAt: '2024-01-08T15:20:00Z'
          },
          {
            id: '3',
            userId: 'user123',
            alertType: 'politician',
            alertStatus: 'paused',
            politicianId: '2',
            createdAt: '2024-01-05T09:15:00Z',
            updatedAt: '2024-01-12T11:45:00Z'
          },
          {
            id: '4',
            userId: 'user123',
            alertType: 'stock',
            alertStatus: 'active',
            tickerSymbol: 'TSLA',
            createdAt: '2024-01-03T16:30:00Z',
            updatedAt: '2024-01-03T16:30:00Z',
            lastTriggeredAt: '2024-01-14T12:15:00Z'
          },
          {
            id: '5',
            userId: 'user123',
            alertType: 'pattern',
            alertStatus: 'active',
            patternConfig: {
              minValue: 50000,
              transactionType: 'buy',
              sector: 'Technology'
            },
            createdAt: '2024-01-01T12:00:00Z',
            updatedAt: '2024-01-01T12:00:00Z',
            lastTriggeredAt: '2024-01-16T09:30:00Z'
          }
        ]

        setAlerts(mockAlerts)
      } catch (err) {
        setError('Failed to load alerts')
        console.error('Error fetching alerts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  const handleCreateAlert = async (alertData: CreateAlertRequest) => {
    try {
      // TODO: Implement API call to create alert
      const newAlert: UserAlert = {
        id: Date.now().toString(),
        userId: 'user123',
        alertType: alertData.alertType,
        alertStatus: 'active',
        politicianId: alertData.politicianId,
        tickerSymbol: alertData.tickerSymbol,
        patternConfig: alertData.patternConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setAlerts(prev => [newAlert, ...prev])
      setShowCreateAlert(false)
      console.log('Alert created:', newAlert)
    } catch (err) {
      console.error('Error creating alert:', err)
    }
  }

  const handleUpdateAlert = async (id: string, updateData: UpdateAlertRequest) => {
    try {
      // TODO: Implement API call to update alert
      setAlerts(prev => prev.map(alert => 
        alert.id === id 
          ? { ...alert, ...updateData, updatedAt: new Date().toISOString() }
          : alert
      ))
      console.log('Alert updated:', id, updateData)
    } catch (err) {
      console.error('Error updating alert:', err)
    }
  }

  const handleDeleteAlert = async (id: string) => {
    try {
      // TODO: Implement API call to delete alert
      setAlerts(prev => prev.filter(alert => alert.id !== id))
      console.log('Alert deleted:', id)
    } catch (err) {
      console.error('Error deleting alert:', err)
    }
  }

  const handleAlertClick = (alert: UserAlert) => {
    console.log('Alert clicked:', alert)
    // TODO: Show alert details or navigate to relevant page
  }

  // Calculate alert statistics
  const alertStats = React.useMemo(() => {
    const totalAlerts = alerts.length
    const activeAlerts = alerts.filter(a => a.alertStatus === 'active').length
    const pausedAlerts = alerts.filter(a => a.alertStatus === 'paused').length
    const politicianAlerts = alerts.filter(a => a.alertType === 'politician').length
    const stockAlerts = alerts.filter(a => a.alertType === 'stock').length
    const patternAlerts = alerts.filter(a => a.alertType === 'pattern').length
    const recentlyTriggered = alerts.filter(a => {
      if (!a.lastTriggeredAt) return false
      const triggerDate = new Date(a.lastTriggeredAt)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return triggerDate > dayAgo
    }).length

    return {
      totalAlerts,
      activeAlerts,
      pausedAlerts,
      politicianAlerts,
      stockAlerts,
      patternAlerts,
      recentlyTriggered
    }
  }, [alerts])

  const getAlertDescription = (alert: UserAlert): string => {
    switch (alert.alertType) {
      case 'politician':
        return `Alert for politician ID: ${alert.politicianId}`
      case 'stock':
        return `Alert for ${alert.tickerSymbol} stock trades`
      case 'pattern':
        const config = alert.patternConfig as Record<string, unknown>
        const transactionType = config?.transactionType as string || 'any'
        const minValue = config?.minValue as number
        return `Alert for ${transactionType} trades ${minValue ? `over $${minValue.toLocaleString()}` : ''}`
      default:
        return 'Custom alert'
    }
  }

  const getAlertIcon = (alertType: UserAlert['alertType']) => {
    switch (alertType) {
      case 'politician':
        return <Users className="h-4 w-4" />
      case 'stock':
        return <Building2 className="h-4 w-4" />
      case 'pattern':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading alerts...</p>
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
              Unable to load your alerts at this time.
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Alert Management</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Monitor congressional trading activity with custom alerts
            </p>
          </div>
          <Button onClick={() => setShowCreateAlert(true)} className="h-10 sm:h-auto w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>

        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertStats.totalAlerts}</div>
              <p className="text-xs text-muted-foreground">
                {alertStats.activeAlerts} active, {alertStats.pausedAlerts} paused
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Triggered</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertStats.recentlyTriggered}</div>
              <p className="text-xs text-muted-foreground">
                In the last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Politician Alerts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertStats.politicianAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Member-specific alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertStats.stockAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Stock-specific alerts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="all">All Alerts</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Alerts ({alerts.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first alert to start monitoring congressional trading activity.
                    </p>
                    <Button onClick={() => setShowCreateAlert(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Alert
                    </Button>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          alert.alertStatus === 'active' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {alert.alertStatus === 'active' ? getAlertIcon(alert.alertType) : <BellOff className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {getAlertDescription(alert)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created {new Date(alert.createdAt).toLocaleDateString()}
                            {alert.lastTriggeredAt && (
                              <span className="ml-2">
                                • Last triggered {new Date(alert.lastTriggeredAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={alert.alertStatus === 'active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {alert.alertStatus}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {alert.alertType}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateAlert(alert.id, {
                              alertStatus: alert.alertStatus === 'active' ? 'paused' : 'active'
                            })
                          }}
                          className="h-10 sm:h-8"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 sm:h-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteAlert(alert.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts ({alertStats.activeAlerts})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.filter(a => a.alertStatus === 'active').map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-green-100 text-green-600">
                        {getAlertIcon(alert.alertType)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {getAlertDescription(alert)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Created {new Date(alert.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {alert.alertType}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdateAlert(alert.id, { alertStatus: 'paused' })
                        }}
                      >
                        <BellOff className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paused" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paused Alerts ({alertStats.pausedAlerts})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.filter(a => a.alertStatus === 'paused').map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                        <BellOff className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {getAlertDescription(alert)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Created {new Date(alert.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="capitalize">
                        {alert.alertStatus}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdateAlert(alert.id, { alertStatus: 'active' })
                        }}
                      >
                        <Bell className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <AlertManager
              onCreateAlert={handleCreateAlert}
              onUpdateAlert={handleUpdateAlert}
              onDeleteAlert={handleDeleteAlert}
              onAlertClick={handleAlertClick}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}