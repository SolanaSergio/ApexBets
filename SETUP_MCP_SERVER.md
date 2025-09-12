# Complete Supabase MCP Server Setup Guide

This guide will walk you through setting up the Supabase Management Control Plane (MCP) server for clean database management in Project Apex.

## Prerequisites

1. Node.js 18+ installed
2. Supabase project set up
3. Environment variables configured in `.env.local`

## Step 1: Configure Environment Variables

Ensure your `.env.local` file has the required Supabase configuration:

```env
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional MCP Configuration
MCP_SERVER_PORT=3002
MCP_SERVER_URL=http://localhost:3002
```

## Step 2: Install Dependencies

Install the required dependencies for the MCP server:

```bash
npm install express node-fetch
```

## Step 3: Set Up MCP Database Functions

Run the setup script to create the necessary database functions:

```bash
npm run mcp:setup
```

This will apply the MCP functions defined in `scripts/sql-scripts/009_mcp_functions.sql` to your Supabase database.

## Step 4: Start the MCP Server

You can start the MCP server in either development or production mode:

### Development Mode (with auto-reload)
```bash
npm run mcp:dev
```

### Production Mode
```bash
npm run mcp:start
```

The server will start on port 3002 by default (or the port specified in `MCP_SERVER_PORT`).

## Step 5: Test the MCP Server

Run the test script to verify that everything is working correctly:

```bash
npm run mcp:test
```

This will test all the MCP server endpoints and report the results.

## Using the MCP Server

Once the server is running, you can use it to manage your database through the provided API endpoints:

### List Tables
```bash
curl http://localhost:3002/tables
```

### Get Table Schema
```bash
curl http://localhost:3002/tables/teams/schema
```

### Execute SQL
```bash
curl -X POST http://localhost:3002/execute-sql \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM teams LIMIT 5"}'
```

### Apply Migrations
```bash
curl -X POST http://localhost:3002/migrations/apply \
  -H "Content-Type: application/json" \
  -d '{"migrationFile": "001_create_core_tables.sql"}'
```

## Security Considerations

1. **Network Security**: Only run the MCP server in trusted environments
2. **Authentication**: In production, add authentication to the MCP endpoints
3. **SQL Execution**: The server uses the service role key which has elevated privileges
4. **Access Control**: Restrict access to the MCP server ports

## Extending the MCP Server

You can extend the MCP server by adding new endpoints in `supabase-mcp-server.js`. Common extensions might include:

1. Backup and restore functionality
2. Data import/export capabilities
3. Custom reporting endpoints
4. Advanced schema validation
5. Performance monitoring

## Integration with Project Apex

The MCP client in `lib/supabase/mcp-client.ts` provides TypeScript functions to interact with the MCP server from your application code:

```typescript
import { listTables, executeSql } from '@/lib/supabase/mcp-client';

// List all tables
const tables = await listTables();

// Execute a query
const result = await executeSql('SELECT COUNT(*) FROM teams');
```

## Troubleshooting

### Server Won't Start
- Check that all environment variables are set correctly
- Verify that the Supabase URL and keys are correct
- Ensure the port is not already in use

### SQL Execution Fails
- Check that the SQL syntax is correct
- Verify that you have the necessary permissions
- Ensure the tables/columns exist

### Connection Issues
- Verify network connectivity to your Supabase project
- Check that your Supabase project is not paused
- Ensure your service role key is valid

## Next Steps

1. Review the [SUPABASE_MCP_README.md](SUPABASE_MCP_README.md) for detailed API documentation
2. Explore the available endpoints in `supabase-mcp-server.js`
3. Customize the MCP server for your specific needs
4. Add authentication for production use

With the MCP server running, you now have a clean, organized way to manage your Supabase database for Project Apex!