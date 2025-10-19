// Congressional Trading Transparency Platform
// Shared Database Types - Based on Data Model
// Created: 2025-09-24

// Database row interfaces (exact mapping to PostgreSQL tables)
export interface UserRow {
  id: string;
  email: string;
  name?: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  subscription_status: 'active' | 'suspended' | 'cancelled';
  last_login_at?: Date;
}

export interface CongressionalMemberRow {
  id: string;
  name: string;
  position: 'senator' | 'representative';
  state_code: string;
  district?: number;
  party_affiliation?: 'democratic' | 'republican' | 'independent' | 'other';
  office_start_date?: Date;
  office_end_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CorporateInsiderRow {
  id: string;
  name: string;
  company_name: string;
  position?: string;
  ticker_symbol?: string;
  created_at: Date;
  updated_at: Date;
}

export interface StockTickerRow {
  symbol: string;
  company_name: string;
  sector?: string;
  industry?: string;
  market_cap?: number;
  last_price?: number;
  last_updated: Date;
  created_at: Date;
}

export interface StockTradeRow {
  id: string;
  trader_type: 'congressional' | 'corporate';
  trader_id: string;
  ticker_symbol: string;
  transaction_date: Date;
  transaction_type: 'buy' | 'sell' | 'exchange';
  amount_range?: string;
  estimated_value?: number;
  quantity?: number;
  filing_date?: Date;
  source_data?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface UserAlertRow {
  id: string;
  user_id: string;
  alert_type: 'politician' | 'stock' | 'pattern';
  alert_status: 'active' | 'paused' | 'deleted';
  politician_id?: string;
  ticker_symbol?: string;
  pattern_config?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  last_triggered_at?: Date;
}

export interface UserFollowRow {
  id: string;
  user_id: string;
  trader_type: 'congressional' | 'corporate';
  trader_id: string;
  followed_at: Date;
  unfollowed_at?: Date;
  billing_status: 'active' | 'suspended' | 'cancelled';
}

export interface AlertNotificationRow {
  id: string;
  alert_id: string;
  user_id: string;
  trade_id?: string;
  notification_type: 'in_app';
  message: string;
  delivered_at: Date;
  read_at?: Date;
}

export interface PortfolioConcentrationRow {
  trader_type: 'congressional' | 'corporate';
  trader_id: string;
  ticker_symbol: string;
  net_position_value: number;
  transaction_count: number;
  latest_transaction: Date;
  total_portfolio_value: number;
  position_percentage: number;
}

// Extended database interfaces with relations
export interface StockTradeWithRelations extends StockTradeRow {
  trader?: CongressionalMemberRow | CorporateInsiderRow;
  stock?: StockTickerRow;
}

export interface UserAlertWithRelations extends UserAlertRow {
  user?: UserRow;
  politician?: CongressionalMemberRow;
  stock?: StockTickerRow;
}

export interface UserFollowWithRelations extends UserFollowRow {
  user?: UserRow;
  trader?: CongressionalMemberRow | CorporateInsiderRow;
}

export interface AlertNotificationWithRelations extends AlertNotificationRow {
  alert?: UserAlertRow;
  user?: UserRow;
  trade?: StockTradeWithRelations;
}

// Database query interfaces
export interface DatabaseFilters {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface UserFilters extends DatabaseFilters {
  email?: string;
  subscription_status?: 'active' | 'suspended' | 'cancelled';
  created_after?: Date;
  created_before?: Date;
}

export interface CongressionalMemberFilters extends DatabaseFilters {
  name?: string;
  position?: 'senator' | 'representative';
  state_code?: string;
  district?: number;
  party_affiliation?: 'democratic' | 'republican' | 'independent' | 'other';
  active_only?: boolean;
}

export interface StockTradeFilters extends DatabaseFilters {
  trader_type?: 'congressional' | 'corporate';
  trader_id?: string;
  ticker_symbol?: string;
  transaction_type?: 'buy' | 'sell' | 'exchange';
  transaction_date_start?: Date;
  transaction_date_end?: Date;
  min_value?: number;
  max_value?: number;
  filing_date_start?: Date;
  filing_date_end?: Date;
}

export interface UserAlertFilters extends DatabaseFilters {
  user_id?: string;
  alert_type?: 'politician' | 'stock' | 'pattern';
  alert_status?: 'active' | 'paused' | 'deleted';
  politician_id?: string;
  ticker_symbol?: string;
}

export interface UserFollowFilters extends DatabaseFilters {
  user_id?: string;
  trader_type?: 'congressional' | 'corporate';
  trader_id?: string;
  billing_status?: 'active' | 'suspended' | 'cancelled';
  active_only?: boolean;
}

export interface AlertNotificationFilters extends DatabaseFilters {
  user_id?: string;
  alert_id?: string;
  trade_id?: string;
  unread_only?: boolean;
  delivered_after?: Date;
  delivered_before?: Date;
}

// Database operation interfaces
export interface CreateUserData {
  email: string;
  name?: string;
  password_hash: string;
  subscription_status?: 'active' | 'suspended' | 'cancelled';
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  password_hash?: string;
  subscription_status?: 'active' | 'suspended' | 'cancelled';
  last_login_at?: Date;
}

export interface CreateCongressionalMemberData {
  name: string;
  position: 'senator' | 'representative';
  state_code: string;
  district?: number;
  party_affiliation?: 'democratic' | 'republican' | 'independent' | 'other';
  office_start_date?: Date;
  office_end_date?: Date;
}

export interface UpdateCongressionalMemberData {
  name?: string;
  position?: 'senator' | 'representative';
  state_code?: string;
  district?: number;
  party_affiliation?: 'democratic' | 'republican' | 'independent' | 'other';
  office_start_date?: Date;
  office_end_date?: Date;
}

export interface CreateStockTradeData {
  trader_type: 'congressional' | 'corporate';
  trader_id: string;
  ticker_symbol: string;
  transaction_date: Date;
  transaction_type: 'buy' | 'sell' | 'exchange';
  amount_range?: string;
  estimated_value?: number;
  quantity?: number;
  filing_date?: Date;
  source_data?: Record<string, any>;
}

export interface CreateUserAlertData {
  user_id: string;
  alert_type: 'politician' | 'stock' | 'pattern';
  politician_id?: string;
  ticker_symbol?: string;
  pattern_config?: Record<string, any>;
}

export interface UpdateUserAlertData {
  alert_status?: 'active' | 'paused' | 'deleted';
  pattern_config?: Record<string, any>;
  last_triggered_at?: Date;
}

export interface CreateUserFollowData {
  user_id: string;
  trader_type: 'congressional' | 'corporate';
  trader_id: string;
  billing_status?: 'active' | 'suspended' | 'cancelled';
}

export interface CreateAlertNotificationData {
  alert_id: string;
  user_id: string;
  trade_id?: string;
  message: string;
  notification_type?: 'in_app';
}

// Aggregation and analytics interfaces
export interface TradingActivitySummary {
  trader_id: string;
  trader_type: 'congressional' | 'corporate';
  total_trades: number;
  total_buy_value: number;
  total_sell_value: number;
  net_position_value: number;
  unique_stocks: number;
  last_trade_date: Date;
  first_trade_date: Date;
}

export interface StockPopularityMetrics {
  ticker_symbol: string;
  company_name: string;
  total_traders: number;
  total_trades: number;
  total_volume: number;
  avg_trade_size: number;
  buy_sell_ratio: number;
  last_activity_date: Date;
}

export interface MonthlyTradingStats {
  year: number;
  month: number;
  total_trades: number;
  unique_traders: number;
  total_volume: number;
  top_stocks: string[];
  most_active_trader: string;
}

// Database connection and transaction interfaces
export interface DatabaseConnection {
  query<T = any>(text: string, params?: any[]): Promise<T[]>;
  transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface TransactionClient {
  query<T = any>(text: string, params?: any[]): Promise<T[]>;
  release(): void;
}

// Model interfaces for business logic layer
export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserModel extends BaseModel {
  email: string;
  name?: string;
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  lastLoginAt?: Date;
  
  // Methods
  checkPassword(password: string): Promise<boolean>;
  updateLastLogin(): Promise<void>;
  getActiveAlerts(): Promise<UserAlertRow[]>;
  getActiveFollows(): Promise<UserFollowRow[]>;
}

export interface CongressionalMemberModel extends BaseModel {
  name: string;
  position: 'senator' | 'representative';
  stateCode: string;
  district?: number;
  partyAffiliation?: 'democratic' | 'republican' | 'independent' | 'other';
  officeStartDate?: Date;
  officeEndDate?: Date;
  
  // Methods
  getTrades(filters?: StockTradeFilters): Promise<StockTradeRow[]>;
  getRecentTrades(days?: number): Promise<StockTradeRow[]>;
  getPortfolioConcentration(): Promise<PortfolioConcentrationRow[]>;
  getFollowerCount(): Promise<number>;
}

export interface StockTradeModel extends BaseModel {
  traderType: 'congressional' | 'corporate';
  traderId: string;
  tickerSymbol: string;
  transactionDate: Date;
  transactionType: 'buy' | 'sell' | 'exchange';
  amountRange?: string;
  estimatedValue?: number;
  quantity?: number;
  filingDate?: Date;
  sourceData?: Record<string, any>;
  
  // Methods
  getTrader(): Promise<CongressionalMemberRow | CorporateInsiderRow>;
  getStock(): Promise<StockTickerRow>;
  triggerAlerts(): Promise<void>;
}

// Type guards for database rows
export function isCongressionalMemberRow(trader: CongressionalMemberRow | CorporateInsiderRow): trader is CongressionalMemberRow {
  return 'position' in trader && 'state_code' in trader;
}

export function isCorporateInsiderRow(trader: CongressionalMemberRow | CorporateInsiderRow): trader is CorporateInsiderRow {
  return 'company_name' in trader;
}

// Utility types
export type TableName = 
  | 'users'
  | 'congressional_members'
  | 'corporate_insiders'
  | 'stock_tickers'
  | 'stock_trades'
  | 'user_alerts'
  | 'user_follows'
  | 'alert_notifications';

export type SortDirection = 'ASC' | 'DESC';

export type TraderTypeDb = 'congressional' | 'corporate';
export type TransactionTypeDb = 'buy' | 'sell' | 'exchange';
export type AlertTypeDb = 'politician' | 'stock' | 'pattern';
export type AlertStatusDb = 'active' | 'paused' | 'deleted';
export type BillingStatusDb = 'active' | 'suspended' | 'cancelled';
export type SubscriptionStatusDb = 'active' | 'suspended' | 'cancelled';
export type PositionDb = 'senator' | 'representative';
export type PartyAffiliationDb = 'democratic' | 'republican' | 'independent' | 'other';
export type NotificationTypeDb = 'in_app';