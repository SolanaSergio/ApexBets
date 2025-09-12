/**
 * Supabase MCP Client
 * Provides a client-side interface to Supabase MCP tools
 */

// Environment variable for MCP server URL
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3002';

/**
 * Execute SQL query through MCP server
 * @param query SQL query to execute
 * @param params Optional parameters for the query
 * @returns Promise with query results
 */
export async function executeSql(query: string, params: Record<string, any> = {}) {
  try {
    const url = MCP_SERVER_URL + '/execute-sql';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: query, params }),
    });
    
    if (!response.ok) {
      throw new Error(`MCP Server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error executing SQL via MCP:', error);
    throw error;
  }
}

/**
 * List all tables in the database
 * @returns Promise with table list
 */
export async function listTables() {
  try {
    const url = MCP_SERVER_URL + '/tables';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MCP Server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error listing tables via MCP:', error);
    throw error;
  }
}

/**
 * Get schema for a specific table
 * @param tableName Name of the table
 * @returns Promise with table schema
 */
export async function getTableSchema(tableName: string) {
  try {
    const url = MCP_SERVER_URL + '/tables/' + tableName + '/schema';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MCP Server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting schema for ${tableName} via MCP:`, error);
    throw error;
  }
}

/**
 * Apply a database migration
 * @param migrationFile Name of the migration file to apply
 * @returns Promise with migration result
 */
export async function applyMigration(migrationFile: string) {
  try {
    const url = MCP_SERVER_URL + '/migrations/apply';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ migrationFile }),
    });
    
    if (!response.ok) {
      throw new Error(`MCP Server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error applying migration via MCP:', error);
    throw error;
  }
}

/**
 * Get project information
 * @returns Promise with project information
 */
export async function getProjectInfo() {
  try {
    const url = MCP_SERVER_URL + '/project';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MCP Server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting project info via MCP:', error);
    throw error;
  }
}

/**
 * List available migrations
 * @returns Promise with migration list
 */
export async function listMigrations() {
  try {
    const url = MCP_SERVER_URL + '/migrations';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MCP Server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error listing migrations via MCP:', error);
    throw error;
  }
}