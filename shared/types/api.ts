// Congressional Trading Transparency Platform
// Shared API Types - Based on OpenAPI Schema
// Created: 2025-09-24

// Base response interfaces
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Core entity types
export interface User {
  id: string;
  email: string;
  name?: string;
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  createdAt: string;
  lastLoginAt?: string;
}

export interface CongressionalMember {
  id: string;
  name: string;
  position: 'senator' | 'representative';
  stateCode: string;
  district?: number;
  partyAffiliation?: 'democratic' | 'republican' | 'independent' | 'other';
  officeStartDate?: string;
  officeEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CorporateInsider {
  id: string;
  name: string;
  companyName: string;
  position?: string;
  tickerSymbol?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTicker {
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  lastPrice?: number;
  lastUpdated: string;
  createdAt: string;
}

export interface StockTrade {
  id: string;
  traderType: 'congressional' | 'corporate';
  traderId: string;
  tickerSymbol: string;
  transactionDate: string;
  transactionType: 'buy' | 'sell' | 'exchange';
  amountRange?: string;
  estimatedValue?: number;
  quantity?: number;
  filingDate?: string;
  trader?: CongressionalMember | CorporateInsider;
  stock?: StockTicker;
  createdAt: string;
  updatedAt: string;
}

export interface UserAlert {
  id: string;
  userId: string;
  alertType: 'politician' | 'stock' | 'pattern';
  alertStatus: 'active' | 'paused' | 'deleted';
  politicianId?: string;
  tickerSymbol?: string;
  patternConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
}

export interface UserFollow {
  id: string;
  userId: string;
  traderType: 'congressional' | 'corporate';
  traderId: string;
  followedAt: string;
  unfollowedAt?: string;
  billingStatus: 'active' | 'suspended' | 'cancelled';
  trader: CongressionalMember | CorporateInsider;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  userId: string;
  tradeId?: string;
  message: string;
  deliveredAt: string;
  readAt?: string;
  trade?: StockTrade;
}

export interface PortfolioConcentration {
  traderId: string;
  traderType: 'congressional' | 'corporate';
  holdings: PortfolioHolding[];
}

export interface PortfolioHolding {
  tickerSymbol: string;
  companyName: string;
  netPositionValue: number;
  positionPercentage: number;
  transactionCount: number;
  latestTransaction: string;
}

// Request/Response types
export interface SearchRequest {
  query: string;
  type?: 'politician' | 'stock' | 'all';
  limit?: number;
}

export interface SearchResponse {
  politicians: CongressionalMember[];
  stocks: StockTicker[];
}

export interface TradeFilters {
  startDate?: string;
  endDate?: string;
  transactionType?: 'buy' | 'sell' | 'exchange';
  minValue?: number;
  maxValue?: number;
  tickerSymbol?: string;
  traderId?: string;
  page?: number;
  limit?: number;
}

export interface CreateAlertRequest {
  alertType: 'politician' | 'stock' | 'pattern';
  politicianId?: string;
  tickerSymbol?: string;
  patternConfig?: Record<string, any>;
}

export interface UpdateAlertRequest {
  alertStatus?: 'active' | 'paused' | 'deleted';
}

export interface CreateFollowRequest {
  traderType: 'congressional' | 'corporate';
  traderId: string;
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  limit?: number;
  page?: number;
}

// Server-Sent Events types
export interface SSENotification {
  type: 'trade_alert' | 'follow_update' | 'system_message';
  data: {
    id: string;
    message: string;
    timestamp: string;
    metadata?: Record<string, any>;
  };
}

// Error types
export interface ApiError {
  error: string;
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationErrorResponse extends ApiError {
  errors: ValidationError[];
}

// Utility types
export type TraderType = 'congressional' | 'corporate';
export type TransactionType = 'buy' | 'sell' | 'exchange';
export type AlertType = 'politician' | 'stock' | 'pattern';
export type AlertStatus = 'active' | 'paused' | 'deleted';
export type BillingStatus = 'active' | 'suspended' | 'cancelled';
export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled';
export type Position = 'senator' | 'representative';
export type PartyAffiliation = 'democratic' | 'republican' | 'independent' | 'other';

// Generic API function types
export type ApiFunction<TRequest = any, TResponse = any> = (
  data: TRequest
) => Promise<ApiResponse<TResponse>>;

export type PaginatedApiFunction<TRequest = any, TResponse = any> = (
  data: TRequest
) => Promise<PaginatedResponse<TResponse>>;

// Type guards
export function isCongressionalMember(trader: CongressionalMember | CorporateInsider | undefined | null): trader is CongressionalMember {
  return trader !== undefined && trader !== null && 'position' in trader && 'stateCode' in trader;
}

export function isCorporateInsider(trader: CongressionalMember | CorporateInsider | undefined | null): trader is CorporateInsider {
  return trader !== undefined && trader !== null && 'companyName' in trader;
}

export function isApiError(response: any): response is ApiError {
  return response && typeof response.error === 'string';
}

export function isValidationError(response: any): response is ValidationErrorResponse {
  return isApiError(response) && Array.isArray((response as ValidationErrorResponse).errors);
}