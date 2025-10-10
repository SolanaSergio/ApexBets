-- Create image audit log table for tracking logo/image operations
CREATE TABLE IF NOT EXISTS image_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  entity_name VARCHAR(200),
  sport VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  old_url TEXT,
  new_url TEXT,
  status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_audit_entity ON image_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_image_audit_created ON image_audit_log(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE image_audit_log IS 'Audit log for all image/logo operations including population, updates, and verification';
COMMENT ON COLUMN image_audit_log.entity_type IS 'Type of entity: team or player';
COMMENT ON COLUMN image_audit_log.action IS 'Action performed: populated, verified, updated, failed';
COMMENT ON COLUMN image_audit_log.status IS 'Result status: success, failed, stale';
