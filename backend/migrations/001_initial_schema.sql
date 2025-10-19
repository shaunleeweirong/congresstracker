-- Congressional Trading Transparency Platform
-- Initial Database Schema Migration
-- Created: 2025-09-24

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom ENUM types
CREATE TYPE subscription_status AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE position_type AS ENUM ('senator', 'representative');
CREATE TYPE party_affiliation AS ENUM ('democratic', 'republican', 'independent', 'other');
CREATE TYPE trader_type AS ENUM ('congressional', 'corporate');
CREATE TYPE transaction_type AS ENUM ('buy', 'sell', 'exchange');
CREATE TYPE alert_type AS ENUM ('politician', 'stock', 'pattern');
CREATE TYPE alert_status AS ENUM ('active', 'paused', 'deleted');
CREATE TYPE billing_status AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE notification_type AS ENUM ('in_app');

-- 1. Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_status subscription_status DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- 2. Congressional Members table
CREATE TABLE congressional_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    position position_type NOT NULL,
    state_code CHAR(2) NOT NULL,
    district INTEGER,
    party_affiliation party_affiliation,
    office_start_date DATE,
    office_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_senator_no_district CHECK (
        (position = 'senator' AND district IS NULL) OR 
        (position = 'representative' AND district IS NOT NULL)
    )
);

CREATE INDEX idx_congressional_members_name ON congressional_members(name);
CREATE INDEX idx_congressional_members_state ON congressional_members(state_code);
CREATE INDEX idx_congressional_members_position ON congressional_members(position);
CREATE UNIQUE INDEX idx_congressional_members_unique_rep ON congressional_members(state_code, district) 
    WHERE position = 'representative';

-- 3. Corporate Insiders table (for Phase 2)
CREATE TABLE corporate_insiders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    ticker_symbol VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_corporate_insiders_name ON corporate_insiders(name);
CREATE INDEX idx_corporate_insiders_company ON corporate_insiders(company_name);
CREATE INDEX idx_corporate_insiders_ticker ON corporate_insiders(ticker_symbol);

-- 4. Stock Tickers table
CREATE TABLE stock_tickers (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    last_price DECIMAL(10,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_tickers_company_name ON stock_tickers(company_name);
CREATE INDEX idx_stock_tickers_sector ON stock_tickers(sector);

-- 5. Stock Trades table
CREATE TABLE stock_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trader_type trader_type NOT NULL,
    trader_id UUID NOT NULL,
    ticker_symbol VARCHAR(10) NOT NULL REFERENCES stock_tickers(symbol),
    transaction_date DATE NOT NULL,
    transaction_type transaction_type NOT NULL,
    amount_range VARCHAR(50),
    estimated_value DECIMAL(12,2),
    quantity INTEGER,
    filing_date DATE,
    source_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stock_trades_trader ON stock_trades(trader_type, trader_id);
CREATE INDEX idx_stock_trades_ticker ON stock_trades(ticker_symbol);
CREATE INDEX idx_stock_trades_date ON stock_trades(transaction_date DESC);
CREATE INDEX idx_stock_trades_type ON stock_trades(transaction_type);
CREATE INDEX idx_stock_trades_compound ON stock_trades(trader_type, trader_id, transaction_date DESC);

-- Foreign key constraints based on trader_type
CREATE INDEX idx_stock_trades_congressional_fk ON stock_trades(trader_id) 
    WHERE trader_type = 'congressional';
CREATE INDEX idx_stock_trades_corporate_fk ON stock_trades(trader_id) 
    WHERE trader_type = 'corporate';

-- 6. User Alerts table
CREATE TABLE user_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    alert_status alert_status DEFAULT 'active',
    
    -- Alert criteria (polymorphic based on alert_type)
    politician_id UUID,
    ticker_symbol VARCHAR(10),
    pattern_config JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_triggered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_alerts_user ON user_alerts(user_id);
CREATE INDEX idx_user_alerts_status ON user_alerts(alert_status);
CREATE INDEX idx_user_alerts_politician ON user_alerts(politician_id) WHERE politician_id IS NOT NULL;
CREATE INDEX idx_user_alerts_ticker ON user_alerts(ticker_symbol) WHERE ticker_symbol IS NOT NULL;

-- 7. User Follows table (billing)
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trader_type trader_type NOT NULL,
    trader_id UUID NOT NULL,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unfollowed_at TIMESTAMP WITH TIME ZONE,
    billing_status billing_status DEFAULT 'active'
);

CREATE UNIQUE INDEX idx_user_follows_unique_active ON user_follows(user_id, trader_type, trader_id)
    WHERE unfollowed_at IS NULL;
CREATE INDEX idx_user_follows_user ON user_follows(user_id);
CREATE INDEX idx_user_follows_billing ON user_follows(billing_status);
CREATE INDEX idx_user_follows_trader ON user_follows(trader_type, trader_id);

-- 8. Alert Notifications table
CREATE TABLE alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES user_alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES stock_trades(id),
    notification_type notification_type DEFAULT 'in_app',
    message TEXT NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_alert_notifications_user ON alert_notifications(user_id, delivered_at DESC);
CREATE INDEX idx_alert_notifications_alert ON alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_unread ON alert_notifications(user_id) WHERE read_at IS NULL;

-- 9. Portfolio Concentration Materialized View
CREATE MATERIALIZED VIEW portfolio_concentration AS
SELECT 
    trader_type,
    trader_id,
    ticker_symbol,
    SUM(CASE WHEN transaction_type = 'buy' THEN estimated_value 
             WHEN transaction_type = 'sell' THEN -estimated_value 
             ELSE 0 END) as net_position_value,
    COUNT(*) as transaction_count,
    MAX(transaction_date) as latest_transaction,
    -- Portfolio concentration metrics
    SUM(estimated_value) OVER (PARTITION BY trader_type, trader_id) as total_portfolio_value,
    (SUM(CASE WHEN transaction_type = 'buy' THEN estimated_value 
              WHEN transaction_type = 'sell' THEN -estimated_value 
              ELSE 0 END) / 
     NULLIF(SUM(estimated_value) OVER (PARTITION BY trader_type, trader_id), 0)) * 100 as position_percentage
FROM stock_trades
WHERE transaction_date >= NOW() - INTERVAL '2 years'
  AND estimated_value IS NOT NULL
GROUP BY trader_type, trader_id, ticker_symbol
HAVING SUM(CASE WHEN transaction_type = 'buy' THEN estimated_value 
                WHEN transaction_type = 'sell' THEN -estimated_value 
                ELSE 0 END) > 0;

CREATE INDEX idx_portfolio_concentration_trader ON portfolio_concentration(trader_type, trader_id);
CREATE INDEX idx_portfolio_concentration_position ON portfolio_concentration(position_percentage DESC);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_portfolio_concentration()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_concentration;
END;
$$ LANGUAGE plpgsql;

-- Update triggers for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_congressional_members_updated_at BEFORE UPDATE ON congressional_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporate_insiders_updated_at BEFORE UPDATE ON corporate_insiders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_trades_updated_at BEFORE UPDATE ON stock_trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_alerts_updated_at BEFORE UPDATE ON user_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO congresstracker_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO congresstracker_user;