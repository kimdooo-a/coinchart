-- Migration: Create stock_prices table for Stock SSOT (Single Source of Truth)
-- Created: 2025-12-27
-- Purpose: Store US stock OHLCV data from TwelveData API

CREATE TABLE IF NOT EXISTS stock_prices (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    time BIGINT NOT NULL,               -- Unix timestamp (seconds)
    open NUMERIC(12, 4) NOT NULL,
    high NUMERIC(12, 4) NOT NULL,
    low NUMERIC(12, 4) NOT NULL,
    close NUMERIC(12, 4) NOT NULL,
    volume BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    source VARCHAR(50) DEFAULT 'twelvedata',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(symbol, time)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_time
    ON stock_prices(symbol, time DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol
    ON stock_prices(symbol)
    WHERE deleted_at IS NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public SELECT
CREATE POLICY "stock_prices_select_public" ON stock_prices
    FOR SELECT
    USING (true);

-- Policy: Allow authenticated INSERT/UPDATE
CREATE POLICY "stock_prices_insert_authenticated" ON stock_prices
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "stock_prices_update_authenticated" ON stock_prices
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Table comment
COMMENT ON TABLE stock_prices IS 'Stock OHLCV data (SSOT) - Do not mix with market_prices (crypto)';
COMMENT ON COLUMN stock_prices.symbol IS 'Stock ticker symbol (e.g., AAPL, MSFT)';
COMMENT ON COLUMN stock_prices.time IS 'Unix timestamp in seconds';
COMMENT ON COLUMN stock_prices.source IS 'Data source (twelvedata, alphavantage, etc.)';