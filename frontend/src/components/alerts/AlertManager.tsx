'use client'

import React, { useState, useEffect } from 'react'
import { Bell, BellOff, Plus, Trash2, Edit, User, Building2, Settings, Calendar, AlertTriangle } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { UserAlert, CongressionalMember, StockTicker, CreateAlertRequest, UpdateAlertRequest } from '../../../../shared/types/api'

interface AlertManagerProps {
  alerts?: UserAlert[]
  onCreateAlert?: (alert: CreateAlertRequest) => Promise<void>
  onUpdateAlert?: (alertId: string, update: UpdateAlertRequest) => Promise<void>
  onDeleteAlert?: (alertId: string) => Promise<void>
  onAlertClick?: (alert: UserAlert) => void
  loading?: boolean
  error?: string
  className?: string
}

interface AlertFormData {
  alertType: 'politician' | 'stock' | 'pattern'
  politicianId?: string
  politicianName?: string
  tickerSymbol?: string
  stockName?: string
  patternConfig?: Record<string, unknown>
}

export function AlertManager({
  alerts = [],
  onCreateAlert,
  onUpdateAlert,
  onDeleteAlert,
  onAlertClick,
  loading = false,
  error,
  className
}: AlertManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingAlert, setEditingAlert] = useState<UserAlert | null>(null)
  const [formData, setFormData] = useState<AlertFormData>({
    alertType: 'politician'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Mock alerts data
  const mockAlerts: UserAlert[] = [
    {
      id: '1',
      userId: 'user1',
      alertType: 'politician',
      alertStatus: 'active',
      politicianId: '1',
      createdAt: '2023-12-01T10:00:00Z',
      updatedAt: '2023-12-01T10:00:00Z',
      lastTriggeredAt: '2023-12-15T14:30:00Z'
    },
    {
      id: '2',
      userId: 'user1',
      alertType: 'stock',
      alertStatus: 'active',
      tickerSymbol: 'AAPL',
      createdAt: '2023-11-20T15:00:00Z',
      updatedAt: '2023-11-20T15:00:00Z',
      lastTriggeredAt: '2023-12-10T09:15:00Z'
    },
    {
      id: '3',
      userId: 'user1',
      alertType: 'pattern',
      alertStatus: 'paused',
      patternConfig: {
        minValue: 50000,
        transactionType: 'buy',
        timeframe: '24h'
      },
      createdAt: '2023-11-15T12:00:00Z',
      updatedAt: '2023-12-01T16:00:00Z'
    }
  ]

  // Mock politicians and stocks for form suggestions
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
      lastPrice: 195.50,
      lastUpdated: '2023-12-01T16:00:00Z',
      createdAt: '2023-01-01T00:00:00Z'
    },
    {
      symbol: 'TSLA',
      companyName: 'Tesla, Inc.',
      sector: 'Consumer Cyclical',
      lastPrice: 250.75,
      lastUpdated: '2023-12-01T16:00:00Z',
      createdAt: '2023-01-01T00:00:00Z'
    }
  ]

  const displayAlerts = alerts.length > 0 ? alerts : mockAlerts

  // Filter alerts based on search query
  const filteredAlerts = displayAlerts.filter(alert => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    if (alert.alertType === 'politician' && alert.politicianId) {
      const politician = mockPoliticians.find(p => p.id === alert.politicianId)
      return politician?.name.toLowerCase().includes(query)
    }
    if (alert.alertType === 'stock' && alert.tickerSymbol) {
      return alert.tickerSymbol.toLowerCase().includes(query)
    }
    return alert.alertType.toLowerCase().includes(query)
  })

  const resetForm = () => {
    setFormData({ alertType: 'politician' })
    setEditingAlert(null)
  }

  const handleCreateAlert = async () => {
    if (!onCreateAlert) return

    setIsSubmitting(true)
    try {
      const alertRequest: CreateAlertRequest = {
        alertType: formData.alertType,
        politicianId: formData.politicianId,
        tickerSymbol: formData.tickerSymbol,
        patternConfig: formData.patternConfig
      }

      await onCreateAlert(alertRequest)
      setShowCreateDialog(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create alert:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateAlert = async (alertId: string, status: 'active' | 'paused' | 'deleted') => {
    if (!onUpdateAlert) return

    try {
      await onUpdateAlert(alertId, { alertStatus: status })
    } catch (error) {
      console.error('Failed to update alert:', error)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    if (!onDeleteAlert) return

    try {
      await onDeleteAlert(alertId)
    } catch (error) {
      console.error('Failed to delete alert:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'politician': return <User className="h-4 w-4" />
      case 'stock': return <Building2 className="h-4 w-4" />
      case 'pattern': return <Settings className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'politician': return 'text-blue-600'
      case 'stock': return 'text-green-600'
      case 'pattern': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getAlertDescription = (alert: UserAlert) => {
    switch (alert.alertType) {
      case 'politician':
        const politician = mockPoliticians.find(p => p.id === alert.politicianId)
        return politician ? `New trades by ${politician.name}` : 'Politician trading activity'
      case 'stock':
        return alert.tickerSymbol ? `New trades in ${alert.tickerSymbol}` : 'Stock trading activity'
      case 'pattern':
        const config = alert.patternConfig
        if (config?.minValue) {
          return `Trades over $${config.minValue.toLocaleString()}`
        }
        return 'Pattern-based trading activity'
      default:
        return 'Trading activity'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>
      case 'deleted':
        return <Badge variant="destructive">Deleted</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Error loading alerts</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Alert Management</CardTitle>
              <p className="text-muted-foreground mt-1">
                Get notified when politicians or stocks you&apos;re tracking have new trading activity
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Alert</DialogTitle>
                  <DialogDescription>
                    Set up notifications for trading activity that matters to you.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Alert Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={formData.alertType === 'politician' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, alertType: 'politician' }))}
                      >
                        <User className="h-3 w-3 mr-1" />
                        Politician
                      </Button>
                      <Button
                        variant={formData.alertType === 'stock' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, alertType: 'stock' }))}
                      >
                        <Building2 className="h-3 w-3 mr-1" />
                        Stock
                      </Button>
                      <Button
                        variant={formData.alertType === 'pattern' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, alertType: 'pattern' }))}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Pattern
                      </Button>
                    </div>
                  </div>

                  {formData.alertType === 'politician' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Politician</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {formData.politicianName || 'Select politician...'}
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          {mockPoliticians.map(politician => (
                            <DropdownMenuItem
                              key={politician.id}
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                politicianId: politician.id,
                                politicianName: politician.name
                              }))}
                            >
                              {politician.name} ({politician.stateCode})
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {formData.alertType === 'stock' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Stock</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {formData.stockName || 'Select stock...'}
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          {mockStocks.map(stock => (
                            <DropdownMenuItem
                              key={stock.symbol}
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                tickerSymbol: stock.symbol,
                                stockName: `${stock.symbol} - ${stock.companyName}`
                              }))}
                            >
                              {stock.symbol} - {stock.companyName}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {formData.alertType === 'pattern' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Minimum Trade Value</label>
                        <Input
                          type="number"
                          placeholder="e.g., 50000"
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            patternConfig: {
                              ...prev.patternConfig,
                              minValue: parseInt(e.target.value) || 0
                            }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAlert}
                    disabled={isSubmitting || (
                      formData.alertType === 'politician' && !formData.politicianId ||
                      formData.alertType === 'stock' && !formData.tickerSymbol
                    )}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Alert'}
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
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                <span>Loading alerts...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No alerts match your search' : 'No alerts created yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? 'Try a different search term' : 'Create your first alert to get started'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card 
              key={alert.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onAlertClick?.(alert)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex-shrink-0", getAlertTypeColor(alert.alertType))}>
                      {getAlertTypeIcon(alert.alertType)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{getAlertDescription(alert)}</h3>
                        {getStatusBadge(alert.alertStatus)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {formatDate(alert.createdAt)}
                        </div>
                        {alert.lastTriggeredAt && (
                          <div>
                            Last triggered {formatDate(alert.lastTriggeredAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Alert Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {alert.alertStatus === 'active' ? (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateAlert(alert.id, 'paused')
                            }}
                          >
                            <BellOff className="h-4 w-4 mr-2" />
                            Pause Alert
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateAlert(alert.id, 'active')
                            }}
                          >
                            <Bell className="h-4 w-4 mr-2" />
                            Activate Alert
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingAlert(alert)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Alert
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteAlert(alert.id)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Alert
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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