# Supabase MCP Server for Project Apex

The Supabase Management Control Plane (MCP) Server provides a clean interface for managing your Project Apex database operations.

## Features

- Execute SQL queries safely
- List and inspect database tables
- Apply database migrations
- Monitor database operations
- Get project information

## Setup

1. Ensure you have set up your Supabase project and have the required environment variables in your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install express @supabase/supabase-js dotenv
   ```

## Running the MCP Server

### Development Mode
```bash
npm run mcp:dev
```

### Production Mode
```bash
npm run mcp:start
```

The server will start on port 3002 (or the port specified in `MCP_SERVER_PORT` environment variable).

## API Endpoints

### Health Check
```
GET /health
```
Check if the MCP server is running.

### Project Information
```
GET /project
```
Get information about the connected Supabase project.

### List Tables
```
GET /tables
```
List all tables in the public schema.

### Get Table Schema
```
GET /tables/:tableName/schema
```
Get the schema (columns) for a specific table.

### Execute SQL
```
POST /execute-sql
```
Execute a SQL query.

Body:
```json
{
  "sql": "SELECT * FROM teams LIMIT 10",
  "params": {}
}
```

### List Migrations
```
GET /migrations
```
List all available SQL migration scripts.

### Apply Migration
```
POST /migrations/apply
```
Apply a migration either by file name or by providing the content directly.

Body (using file):
```json
{
  "migrationFile": "001_create_core_tables.sql"
}
```

Body (using content):
```json
{
  "migrationContent": "CREATE TABLE IF NOT EXISTS test (id UUID PRIMARY KEY DEFAULT gen_random_uuid());"
}
```

## Security Notes

- The MCP server should only be run in trusted environments
- The server uses the Supabase service role key which has elevated privileges
- In production, you should add authentication to the MCP server endpoints
- SQL execution is limited to certain operations for safety

## Usage Examples

### Get all teams
```bash
curl http://localhost:3002/tables/teams/schema
```

### Execute a query
```bash
curl -X POST http://localhost:3002/execute-sql \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) FROM teams"}'
```

### Apply a migration
```bash
curl -X POST http://localhost:3002/migrations/apply \
  -H "Content-Type: application/json" \
  -d '{"migrationFile": "001_create_core_tables.sql"}'
```

## Extending the MCP Server

You can extend the MCP server by adding new endpoints in the `supabase-mcp-server.js` file. Common extensions might include:

- Backup and restore functionality
- Data import/export capabilities
- Custom reporting endpoints
- Advanced schema validation