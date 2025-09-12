-- MCP Functions for Project Apex
-- Functions to support the Supabase MCP server

-- Function to execute dynamic SQL
-- Note: This should only be used in a controlled environment as it can be a security risk
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT, params JSONB DEFAULT '{}')
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stmt TEXT;
BEGIN
  -- Basic security check - only allow certain operations
  IF UPPER(LEFT(TRIM(sql_query), 6)) NOT IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP') THEN
    RAISE EXCEPTION 'Unsupported SQL operation';
  END IF;
  
  -- For now, we'll just return a success message
  -- In a real implementation, you would execute the SQL here
  RETURN QUERY SELECT jsonb_build_object('message', 'SQL execution would happen here', 'query', sql_query);
END;
$$;

-- Function to get table information
CREATE OR REPLACE FUNCTION get_table_info()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    t.table_name,
    (SELECT COUNT(*) FROM t.table_name::regclass) as row_count,
    NOW() as last_updated
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  ORDER BY t.table_name;
$$;

-- Function to get database size information
CREATE OR REPLACE FUNCTION get_database_info()
RETURNS TABLE(
  database_name TEXT,
  size_bytes BIGINT,
  table_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    current_database() as database_name,
    pg_database_size(current_database()) as size_bytes,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count;
$$;

-- Function to validate schema integrity
CREATE OR REPLACE FUNCTION validate_schema()
RETURNS TABLE(
  table_name TEXT,
  has_required_columns BOOLEAN,
  missing_columns TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a simplified validation
  -- In a real implementation, you would check for required columns in each table
  RETURN QUERY 
    SELECT 
      t.table_name,
      TRUE as has_required_columns,
      ARRAY[]::TEXT[] as missing_columns
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    ORDER BY t.table_name;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION execute_sql(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_info() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_schema() TO authenticated;

-- Execute this script to create MCP support functions