-- Создание новой таблицы для трейдинговых сделок
CREATE TABLE IF NOT EXISTS trading_deals (
    id SERIAL PRIMARY KEY,
    trader_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'PL',
    trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    buy_rub DECIMAL(15, 2) NOT NULL,
    buy_usd DECIMAL(15, 4),
    buy_rate DECIMAL(10, 4),
    buy_deal_id VARCHAR(255),
    
    sell_rub DECIMAL(15, 2),
    sell_usdt DECIMAL(15, 8),
    sell_rate DECIMAL(10, 4) NOT NULL,
    sell_order_number VARCHAR(255),
    
    profit_usd DECIMAL(15, 8),
    trader_profit DECIMAL(15, 8),
    
    is_finalized BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trading_deals_platform ON trading_deals(platform);
CREATE INDEX IF NOT EXISTS idx_trading_deals_date ON trading_deals(trade_date);
CREATE INDEX IF NOT EXISTS idx_trading_deals_finalized ON trading_deals(is_finalized);
CREATE INDEX IF NOT EXISTS idx_trading_deals_trader ON trading_deals(trader_name);

INSERT INTO trading_deals (
    trader_name, platform, trade_date,
    buy_rub, buy_usd, buy_rate, buy_deal_id,
    sell_rub, sell_usdt, sell_rate, sell_order_number,
    profit_usd, trader_profit, is_finalized, created_by
) VALUES 
(
    'Трейдер Иванов', 'PL', '2024-12-20',
    500000, 5050.51, 99.00, 'BUY-001',
    500000, 5076.14, 98.50, 'SELL-001',
    25.63, 6.41, true, 1
),
(
    'Трейдер Петров', 'Bliss', '2024-12-21',
    450000, 4500.00, 100.00, 'BUY-002',
    450000, 4591.84, 98.00, 'SELL-002',
    91.84, 22.96, true, 1
),
(
    'Трейдер Сидоров', 'PL', '2024-12-22',
    600000, NULL, 99.50, 'BUY-003',
    NULL, NULL, 98.00, NULL,
    NULL, NULL, false, 1
);
