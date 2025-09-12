# MCP Integration Guide

This guide explains how to use the Supabase MCP (Management Control Plane) integration in your Project Apex application.

## Prerequisites

1. MCP Server running (should be running on http://localhost:3002)
2. Environment variables configured in `.env.local`

## Environment Configuration

Add the following to your `.env.local` file:

```env
# MCP Server Configuration
MCP_SERVER_URL=http://localhost:3002
MCP_SERVER_PORT=3002
```

## Using the MCP Client

The MCP client provides TypeScript functions to interact with the MCP server:

### Importing the Client

```typescript
import { 
  executeSql, 
  listTables, 
  getTableSchema, 
  applyMigration,
  getProjectInfo,
  listMigrations
} from '@/lib/supabase/mcp-client';
```

### Available Functions

1. **getProjectInfo()** - Get information about the connected Supabase project
2. **listTables()** - List all tables in the public schema
3. **getTableSchema(tableName)** - Get the schema (columns) for a specific table
4. **executeSql(query, params)** - Execute a SQL query
5. **listMigrations()** - List available migration files
6. **applyMigration(migrationFile)** - Apply a specific migration

### Example Usage

```typescript
// Get project information
const projectInfo = await getProjectInfo();
console.log('Project:', projectInfo);

// List all tables
const tables = await listTables();
console.log('Tables:', tables);

// Get schema for a specific table
const schema = await getTableSchema('teams');
console.log('Teams table schema:', schema);

// Execute a SQL query
const result = await executeSql('SELECT COUNT(*) FROM teams');
console.log('Team count:', result);

// List available migrations
const migrations = await listMigrations();
console.log('Migrations:', migrations);
```

## API Endpoint

There's a test API endpoint available at `GET /api/mcp-test` that demonstrates the MCP integration.

You can test it with:
```bash
curl http://localhost:3000/api/mcp-test
```

## Error Handling

All MCP client functions will throw errors if:
1. The MCP server is not reachable
2. The request fails
3. The MCP server returns an error

Always wrap calls in try/catch blocks:

```typescript
try {
  const tables = await listTables();
  // Process tables
} catch (error) {
  console.error('Failed to list tables:', error);
  // Handle error appropriately
}
```

## Security Considerations

1. The MCP server should only be accessible from trusted environments
2. The MCP client uses the configured MCP_SERVER_URL (defaults to localhost:3002)
3. In production, ensure the MCP server is properly secured with authentication

## Troubleshooting

### "Failed to fetch" errors
- Ensure the MCP server is running (`npm run mcp:start` or `npm run mcp:dev`)
- Check that MCP_SERVER_URL is correctly configured in your environment
- Verify network connectivity to the MCP server

### "MCP Server error" messages
- Check the MCP server logs for detailed error information
- Verify that the Supabase credentials are correct
- Ensure the requested operation is allowed

## Extending the Integration

You can extend the MCP client by adding new functions to `lib/supabase/mcp-client.ts`:

```typescript
/**
 * Custom MCP function example
 */
export async function customMcpFunction() {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/custom-endpoint`);
    
    if (!response.ok) {
      throw new Error(`MCP Server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in custom MCP function:', error);
    throw error;
  }
}
```

Remember to also add the corresponding endpoint to the MCP server (`supabase-mcp-server.js`).