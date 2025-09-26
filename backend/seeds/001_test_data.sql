-- Congressional Trading Transparency Platform
-- Test Data Seeds
-- Created: 2025-09-24

-- Insert sample stock tickers
INSERT INTO stock_tickers (symbol, company_name, sector, industry, market_cap, last_price, last_updated) VALUES 
('AAPL', 'Apple Inc.', 'Technology', 'Consumer Electronics', 3000000000000, 150.00, NOW()),
('TSLA', 'Tesla Inc.', 'Consumer Discretionary', 'Auto Manufacturers', 800000000000, 250.00, NOW()),
('AMZN', 'Amazon.com Inc.', 'Consumer Discretionary', 'Internet Retail', 1500000000000, 3200.00, NOW()),
('GOOGL', 'Alphabet Inc.', 'Technology', 'Internet Content & Information', 1700000000000, 2800.00, NOW()),
('MSFT', 'Microsoft Corporation', 'Technology', 'Software—Infrastructure', 2800000000000, 375.00, NOW()),
('NVDA', 'NVIDIA Corporation', 'Technology', 'Semiconductors', 1200000000000, 480.00, NOW()),
('META', 'Meta Platforms Inc.', 'Technology', 'Internet Content & Information', 850000000000, 325.00, NOW()),
('JPM', 'JPMorgan Chase & Co.', 'Financial Services', 'Banks—Diversified', 450000000000, 155.00, NOW()),
('V', 'Visa Inc.', 'Financial Services', 'Credit Services', 520000000000, 240.00, NOW()),
('JNJ', 'Johnson & Johnson', 'Healthcare', 'Drug Manufacturers—General', 420000000000, 160.00, NOW());

-- Insert sample congressional members
INSERT INTO congressional_members (id, name, position, state_code, district, party_affiliation, office_start_date) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'Nancy Pelosi', 'representative', 'CA', 5, 'democratic', '1987-01-03'),
('123e4567-e89b-12d3-a456-426614174001', 'Ted Cruz', 'senator', 'TX', NULL, 'republican', '2013-01-03'),
('123e4567-e89b-12d3-a456-426614174002', 'Alexandria Ocasio-Cortez', 'representative', 'NY', 14, 'democratic', '2019-01-03'),
('123e4567-e89b-12d3-a456-426614174003', 'Josh Hawley', 'senator', 'MO', NULL, 'republican', '2019-01-03'),
('123e4567-e89b-12d3-a456-426614174004', 'Dan Crenshaw', 'representative', 'TX', 2, 'republican', '2019-01-03'),
('123e4567-e89b-12d3-a456-426614174005', 'Elizabeth Warren', 'senator', 'MA', NULL, 'democratic', '2013-01-03'),
('123e4567-e89b-12d3-a456-426614174006', 'Kevin McCarthy', 'representative', 'CA', 20, 'republican', '2007-01-03'),
('123e4567-e89b-12d3-a456-426614174007', 'Bernie Sanders', 'senator', 'VT', NULL, 'independent', '2007-01-03'),
('123e4567-e89b-12d3-a456-426614174008', 'Marjorie Taylor Greene', 'representative', 'GA', 14, 'republican', '2021-01-03'),
('123e4567-e89b-12d3-a456-426614174009', 'Chuck Schumer', 'senator', 'NY', NULL, 'democratic', '1999-01-03');

-- Insert sample corporate insiders (for Phase 2)
INSERT INTO corporate_insiders (id, name, company_name, position, ticker_symbol) VALUES 
('223e4567-e89b-12d3-a456-426614174000', 'Tim Cook', 'Apple Inc.', 'CEO', 'AAPL'),
('223e4567-e89b-12d3-a456-426614174001', 'Elon Musk', 'Tesla Inc.', 'CEO', 'TSLA'),
('223e4567-e89b-12d3-a456-426614174002', 'Andy Jassy', 'Amazon.com Inc.', 'CEO', 'AMZN'),
('223e4567-e89b-12d3-a456-426614174003', 'Sundar Pichai', 'Alphabet Inc.', 'CEO', 'GOOGL'),
('223e4567-e89b-12d3-a456-426614174004', 'Satya Nadella', 'Microsoft Corporation', 'CEO', 'MSFT');

-- Insert sample stock trades for congressional members
INSERT INTO stock_trades (trader_type, trader_id, ticker_symbol, transaction_date, transaction_type, amount_range, estimated_value, quantity, filing_date, source_data) VALUES
-- Nancy Pelosi trades
('congressional', '123e4567-e89b-12d3-a456-426614174000', 'AAPL', '2025-09-20', 'buy', '$15,001 - $50,000', 32500.00, 217, '2025-09-25', '{"source": "house_disclosure", "disclosure_id": "HD001"}'),
('congressional', '123e4567-e89b-12d3-a456-426614174000', 'NVDA', '2025-09-18', 'buy', '$1,001 - $15,000', 8000.00, 17, '2025-09-25', '{"source": "house_disclosure", "disclosure_id": "HD002"}'),
('congressional', '123e4567-e89b-12d3-a456-426614174000', 'TSLA', '2025-09-15', 'sell', '$50,001 - $100,000', 75000.00, 300, '2025-09-20', '{"source": "house_disclosure", "disclosure_id": "HD003"}'),

-- Ted Cruz trades
('congressional', '123e4567-e89b-12d3-a456-426614174001', 'TSLA', '2025-09-22', 'sell', '$1,001 - $15,000', 8000.00, 32, '2025-09-27', '{"source": "senate_disclosure", "disclosure_id": "SD001"}'),
('congressional', '123e4567-e89b-12d3-a456-426614174001', 'JPM', '2025-09-19', 'buy', '$15,001 - $50,000', 32500.00, 210, '2025-09-24', '{"source": "senate_disclosure", "disclosure_id": "SD002"}'),

-- Alexandria Ocasio-Cortez trades
('congressional', '123e4567-e89b-12d3-a456-426614174002', 'AMZN', '2025-09-23', 'buy', '$1,001 - $15,000', 8000.00, 3, '2025-09-28', '{"source": "house_disclosure", "disclosure_id": "HD004"}'),
('congressional', '123e4567-e89b-12d3-a456-426614174002', 'V', '2025-09-21', 'buy', '$1,001 - $15,000', 8000.00, 33, '2025-09-26', '{"source": "house_disclosure", "disclosure_id": "HD005"}'),

-- Josh Hawley trades
('congressional', '123e4567-e89b-12d3-a456-426614174003', 'MSFT', '2025-09-17', 'buy', '$15,001 - $50,000', 32500.00, 87, '2025-09-22', '{"source": "senate_disclosure", "disclosure_id": "SD003"}'),
('congressional', '123e4567-e89b-12d3-a456-426614174003', 'GOOGL', '2025-09-16', 'buy', '$1,001 - $15,000', 8000.00, 3, '2025-09-21', '{"source": "senate_disclosure", "disclosure_id": "SD004"}'),

-- Dan Crenshaw trades
('congressional', '123e4567-e89b-12d3-a456-426614174004', 'META', '2025-09-14', 'buy', '$1,001 - $15,000', 8000.00, 25, '2025-09-19', '{"source": "house_disclosure", "disclosure_id": "HD006"}'),
('congressional', '123e4567-e89b-12d3-a456-426614174004', 'JNJ', '2025-09-13', 'buy', '$1,001 - $15,000', 8000.00, 50, '2025-09-18', '{"source": "house_disclosure", "disclosure_id": "HD007"}'),

-- Elizabeth Warren trades
('congressional', '123e4567-e89b-12d3-a456-426614174005', 'JPM', '2025-09-12', 'sell', '$1,001 - $15,000', 8000.00, 52, '2025-09-17', '{"source": "senate_disclosure", "disclosure_id": "SD005"}'),
('congressional', '123e4567-e89b-12d3-a456-426614174005', 'V', '2025-09-11', 'buy', '$1,001 - $15,000', 8000.00, 33, '2025-09-16', '{"source": "senate_disclosure", "disclosure_id": "SD006"}'),

-- Historical trades for portfolio concentration testing
('congressional', '123e4567-e89b-12d3-a456-426614174000', 'AAPL', '2025-08-15', 'buy', '$50,001 - $100,000', 75000.00, 500, '2025-08-20', '{"source": "house_disclosure", "disclosure_id": "HD008"}'),
('congressional', '123e4567-e89b-12d3-a456-426614174000', 'MSFT', '2025-07-10', 'buy', '$15,001 - $50,000', 32500.00, 87, '2025-07-15', '{"source": "house_disclosure", "disclosure_id": "HD009"}'),
('congressional', '123e4567-e89b-12d3-a456-426614174001', 'TSLA', '2025-06-05', 'buy', '$100,001 - $250,000', 175000.00, 700, '2025-06-10', '{"source": "senate_disclosure", "disclosure_id": "SD007"}');

-- Insert test user (password is 'password123' hashed with bcrypt)
INSERT INTO users (id, email, name, password_hash, subscription_status) VALUES 
('323e4567-e89b-12d3-a456-426614174000', 'test@example.com', 'Test User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyc1pXAK.8YbAQ8WYdQW6q', 'active'),
('323e4567-e89b-12d3-a456-426614174001', 'demo@example.com', 'Demo User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyc1pXAK.8YbAQ8WYdQW6q', 'active'),
('323e4567-e89b-12d3-a456-426614174002', 'admin@example.com', 'Admin User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyc1pXAK.8YbAQ8WYdQW6q', 'active');

-- Insert sample user alerts
INSERT INTO user_alerts (user_id, alert_type, politician_id, alert_status) VALUES 
('323e4567-e89b-12d3-a456-426614174000', 'politician', '123e4567-e89b-12d3-a456-426614174000', 'active'),
('323e4567-e89b-12d3-a456-426614174000', 'politician', '123e4567-e89b-12d3-a456-426614174001', 'active'),
('323e4567-e89b-12d3-a456-426614174001', 'politician', '123e4567-e89b-12d3-a456-426614174002', 'active');

INSERT INTO user_alerts (user_id, alert_type, ticker_symbol, alert_status) VALUES 
('323e4567-e89b-12d3-a456-426614174000', 'stock', 'AAPL', 'active'),
('323e4567-e89b-12d3-a456-426614174001', 'stock', 'TSLA', 'active'),
('323e4567-e89b-12d3-a456-426614174002', 'stock', 'NVDA', 'active');

-- Insert sample user follows (billing relationships)
INSERT INTO user_follows (user_id, trader_type, trader_id, billing_status) VALUES 
('323e4567-e89b-12d3-a456-426614174000', 'congressional', '123e4567-e89b-12d3-a456-426614174000', 'active'),
('323e4567-e89b-12d3-a456-426614174000', 'congressional', '123e4567-e89b-12d3-a456-426614174001', 'active'),
('323e4567-e89b-12d3-a456-426614174001', 'congressional', '123e4567-e89b-12d3-a456-426614174002', 'active'),
('323e4567-e89b-12d3-a456-426614174002', 'congressional', '123e4567-e89b-12d3-a456-426614174005', 'active');

-- Insert sample alert notifications
INSERT INTO alert_notifications (alert_id, user_id, trade_id, message) VALUES 
((SELECT id FROM user_alerts WHERE user_id = '323e4567-e89b-12d3-a456-426614174000' AND politician_id = '123e4567-e89b-12d3-a456-426614174000' LIMIT 1),
 '323e4567-e89b-12d3-a456-426614174000',
 (SELECT id FROM stock_trades WHERE trader_id = '123e4567-e89b-12d3-a456-426614174000' AND ticker_symbol = 'AAPL' ORDER BY transaction_date DESC LIMIT 1),
 'Nancy Pelosi bought $32,500 worth of AAPL stock'),
((SELECT id FROM user_alerts WHERE user_id = '323e4567-e89b-12d3-a456-426614174000' AND ticker_symbol = 'AAPL' LIMIT 1),
 '323e4567-e89b-12d3-a456-426614174000',
 (SELECT id FROM stock_trades WHERE trader_id = '123e4567-e89b-12d3-a456-426614174000' AND ticker_symbol = 'AAPL' ORDER BY transaction_date DESC LIMIT 1),
 'New AAPL trade: Nancy Pelosi bought $32,500 worth');

-- Refresh the materialized view with sample data
REFRESH MATERIALIZED VIEW portfolio_concentration;

-- Display summary of seeded data
SELECT 'Congressional Members' as table_name, COUNT(*) as count FROM congressional_members
UNION ALL
SELECT 'Stock Tickers', COUNT(*) FROM stock_tickers
UNION ALL  
SELECT 'Stock Trades', COUNT(*) FROM stock_trades
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'User Alerts', COUNT(*) FROM user_alerts
UNION ALL
SELECT 'User Follows', COUNT(*) FROM user_follows
UNION ALL
SELECT 'Alert Notifications', COUNT(*) FROM alert_notifications;

-- Display recent trading activity
SELECT 
    cm.name as trader_name,
    st.ticker_symbol,
    st.transaction_type,
    st.estimated_value,
    st.transaction_date
FROM stock_trades st
JOIN congressional_members cm ON st.trader_id = cm.id
WHERE st.trader_type = 'congressional'
ORDER BY st.transaction_date DESC
LIMIT 10;