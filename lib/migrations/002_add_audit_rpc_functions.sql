-- Migration: Add Audit RPC Functions
-- Provides secure access to system catalog data for database auditing

-- Function to get public schema indexes
CREATE OR REPLACE FUNCTION get_public_indexes()
RETURNS TABLE(
  schemaname text,
  tablename text,
  indexname text,
  indexdef text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.schemaname::text,
    i.tablename::text,
    i.indexname::text,
    i.indexdef::text
  FROM pg_indexes i
  WHERE i.schemaname = 'public'
  ORDER BY i.tablename, i.indexname;
END;
$$;

-- Function to get public schema foreign key constraints
CREATE OR REPLACE FUNCTION get_public_foreign_keys()
RETURNS TABLE(
  table_name text,
  column_name text,
  foreign_table_name text,
  foreign_column_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text AS foreign_table_name,
    ccu.column_name::text AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
END;
$$;

-- Function to get public schema table sizes and row counts
CREATE OR REPLACE FUNCTION get_public_table_sizes()
RETURNS TABLE(
  tablename text,
  size_pretty text,
  row_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT 
      t.tablename,
      pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) as size_pretty,
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.tablename AND table_schema = 'public') as row_count
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    ORDER BY pg_total_relation_size('public.' || t.tablename) DESC
  LOOP
    tablename := rec.tablename;
    size_pretty := rec.size_pretty;
    row_count := rec.row_count;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_public_indexes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_foreign_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_table_sizes() TO authenticated;

-- Insert migration record
INSERT INTO schema_migrations (name, applied_at) 
VALUES ('002_add_audit_rpc_functions', NOW())
ON CONFLICT (name) DO NOTHING;
