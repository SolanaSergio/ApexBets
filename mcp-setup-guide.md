# Project Apex MCP Setup Guide

## Current MCP Configuration

Your Project Apex now includes a custom Supabase MCP (Management Control Plane) server that's specifically tailored for your application's needs.

## MCP Server Details

- **Server Location**: `supabase-mcp-server.js` in your project root
- **Running Port**: 3002 (http://localhost:3002)
- **API Endpoints**: 
  - GET `/health` - Health check
  - GET `/project` - Project information
  - GET `/tables` - List all tables
  - GET `/tables/:tableName/schema` - Get table schema
  - POST `/execute-sql` - Execute SQL queries
  - GET `/migrations` - List available migrations
  - POST `/migrations/apply` - Apply migrations

## Integration with Existing MCP Configuration

If you're using the standard MCP tools, you can reference the server using the configuration file we created:

**File**: `project-apex-mcp.json`

```json
{
  "mcpServers": {
    "project-apex-mcp": {
      "command": "node",
      "args": [
        "supabase-mcp-server.js"
      ],
      "env": {
        "MCP_SERVER_PORT": "3002",
        "MCP_SERVER_URL": "http://localhost:3002"
      }
    }
  }
}
```

## Using the MCP Client in Your Code

You can use the TypeScript client we created at `lib/supabase/mcp-client.ts`:

```typescript
import { 
  executeSql, 
  listTables, 
  getTableSchema, 
  getProjectInfo,
  listMigrations,
  applyMigration
} from '@/lib/supabase/mcp-client';

// Example usage:
async function example() {
  // Get project information
  const project = await getProjectInfo();
  
  // List all tables
  const tables = await listTables();
  
  // Execute a SQL query
  const result = await executeSql('SELECT COUNT(*) FROM teams');
  
  // Get schema for a specific table
  const schema = await getTableSchema('games');
}
```

## Available npm Scripts

We've added several npm scripts to make working with the MCP server easier:

- `npm run mcp:start` - Start the MCP server
- `npm run mcp:dev` - Start the MCP server in development mode
- `npm run mcp:test` - Test the MCP server endpoints
- `npm run mcp:setup` - Set up MCP database functions

## Testing the Integration

1. Ensure the MCP server is running:
   ```bash
   npm run mcp:start
   ```

2. Test the endpoints:
   ```bash
   npm run mcp:test
   ```

3. Or manually test with curl:
   ```bash
   curl http://localhost:3002/health
   curl http://localhost:3002/project
   curl http://localhost:3002/tables
   ```

## API Endpoint for Testing

We've also created a Next.js API route at `app/api/mcp-test/route.ts` that demonstrates using the MCP client:

Once your Next.js development server is running, you can test it at:
```
http://localhost:3001/api/mcp-test
```

Note: The development server is running on port 3001 because port 3000 was already in use.

## Troubleshooting

### "Port already in use" error
If you see a message that port 3002 is already in use, you can change it by setting the `MCP_SERVER_PORT` environment variable in your `.env.local` file:

```env
MCP_SERVER_PORT=3003
```

### "Connection refused" error
Ensure the MCP server is running with:
```bash
npm run mcp:start
```

### "Module not found" error
Make sure all dependencies are installed:
```bash
npm install
```

## Security Considerations

1. The MCP server should only be accessible from trusted environments
2. Never expose the MCP server to the public internet
3. The server uses your Supabase service role key which has elevated privileges
4. In production, add authentication to all MCP endpoints

## Extending the MCP Server

You can add new endpoints to the MCP server by modifying `supabase-mcp-server.js`. For example:

```javascript
// Add a new endpoint
app.get('/custom-endpoint', async (req, res) => {
  try {
    // Your custom logic here
    res.json({ message: 'Custom endpoint working!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Remember to also add the corresponding client function in `lib/supabase/mcp-client.ts`.

## Documentation

For more detailed information, refer to:
- `SUPABASE_MCP_README.md` - Complete API documentation
- `SETUP_MCP_SERVER.md` - Detailed setup instructions
- `MCP_INTEGRATION_GUIDE.md` - Integration guide
- `MCP_SERVER_SUMMARY.md` - Summary of what was built

Your Project Apex MCP integration is now complete and ready to use!