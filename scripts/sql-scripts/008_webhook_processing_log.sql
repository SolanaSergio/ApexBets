-- Create webhook processing log table for deduplication and audit trail
CREATE TABLE IF NOT EXISTS webhook_processing_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hash VARCHAR(64) NOT NULL,
    request_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processing_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    CONSTRAINT webhook_processing_log_hash_request_unique UNIQUE (hash, request_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_hash ON webhook_processing_log(hash);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_created_at ON webhook_processing_log(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_processed ON webhook_processing_log(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_event_type ON webhook_processing_log(event_type);

-- Create partial index for active processing (not completed)
CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_active 
ON webhook_processing_log(hash, created_at) 
WHERE completed_at IS NULL;

-- Add RLS (Row Level Security) if needed
ALTER TABLE webhook_processing_log ENABLE ROW LEVEL SECURITY;

-- Create policy for webhook processing log access
CREATE POLICY IF NOT EXISTS "Allow webhook processing log access" 
ON webhook_processing_log FOR ALL 
USING (true);

-- Add comments for documentation
COMMENT ON TABLE webhook_processing_log IS 'Tracks webhook processing for deduplication and audit purposes';
COMMENT ON COLUMN webhook_processing_log.hash IS 'SHA-256 hash of webhook payload for deduplication';
COMMENT ON COLUMN webhook_processing_log.request_id IS 'Unique request identifier for tracking';
COMMENT ON COLUMN webhook_processing_log.event_type IS 'Type of webhook event (game_update, score_update, etc.)';
COMMENT ON COLUMN webhook_processing_log.processed IS 'Whether the webhook was successfully processed';
COMMENT ON COLUMN webhook_processing_log.processing_time_ms IS 'Time taken to process webhook in milliseconds';
COMMENT ON COLUMN webhook_processing_log.error_message IS 'Error message if processing failed';

-- Create function to clean up old webhook logs (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_webhook_processing_log()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_processing_log 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('webhook-log-cleanup', '0 2 * * *', 'SELECT cleanup_webhook_processing_log();');