-- Migration: Sync Progress Tracking
-- Purpose: Track checkpoint data for resumable historical backfill
-- Date: 2025-10-20

CREATE TABLE IF NOT EXISTS sync_progress (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL UNIQUE, -- 'senate', 'house', 'insiders'
  last_processed_index INTEGER NOT NULL DEFAULT 0, -- Index in the fetched array
  total_records INTEGER NOT NULL DEFAULT 0, -- Total records fetched from API
  created_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'))
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_sync_progress_type ON sync_progress(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_progress_status ON sync_progress(status);

-- Insert initial records for the three sync types
INSERT INTO sync_progress (sync_type, status)
VALUES
  ('senate', 'pending'),
  ('house', 'pending'),
  ('insiders', 'pending')
ON CONFLICT (sync_type) DO NOTHING;

COMMENT ON TABLE sync_progress IS 'Tracks progress of historical data backfill to enable resume on restart';
COMMENT ON COLUMN sync_progress.last_processed_index IS 'Index of last successfully processed trade in the fetched array';
COMMENT ON COLUMN sync_progress.total_records IS 'Total number of records fetched from FMP API for this sync type';
