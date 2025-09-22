# Complete Supabase MCP Usage Guide 2025

## Table of Contents
1. [Introduction to Supabase MCP](#introduction)
2. [Installation and Setup](#installation)
3. [Configuration](#configuration)
4. [Security Best Practices](#security)
5. [Build Time Configuration](#build-time)
6. [Core Features and Tools](#features)
7. [TypeScript Integration](#typescript)
8. [Database Branching](#branching)
9. [Edge Functions Management](#edge-functions)
10. [Troubleshooting](#troubleshooting)
11. [Advanced Usage](#advanced)

## Introduction to Supabase MCP {#introduction}

The **Model Context Protocol (MCP)** is a standardized way for Large Language Models (LLMs) to interact with external tools and platforms like Supabase. Launched in April 2025, Supabase's MCP server enables seamless integration between AI tools and your Supabase projects, allowing for automated database management, schema design, query execution, and project configuration.

### Key Benefits
- **AI-Powered Database Operations**: Execute SQL queries, design schemas, and manage tables using natural language
- **Secure Authentication**: Uses Personal Access Tokens (PATs) and supports OAuth 2.0
- **Project Isolation**: Safely isolate operations in development branches
- **Multi-Tool Support**: Works with Cursor, Claude Desktop, VS Code, Windsurf, and more

## Installation and Setup {#installation}

### Prerequisites
- Node.js >= 16.x
- npm >= 8.x
- A Supabase project
- Personal Access Token from Supabase

### Basic Installation

#### Option 1: NPX (Recommended)
```bash
# Run directly without global installation
npx -y @supabase/mcp-server-supabase@latest
```

#### Option 2: Global Installation
```bash
# Install globally
npm install -g @supabase/mcp-server-supabase

# Or as dev dependency
npm install @supabase/mcp-server-supabase --save-dev
```

#### Option 3: Supabase CLI Installation
```bash
# Install Supabase CLI
npm install supabase@">=1.8.1" --save-dev

# Login to Supabase
npx supabase login

# Initialize project
npx supabase init
```

## Configuration {#configuration}

### Step 1: Create Personal Access Token

1. Go to your Supabase account settings
2. Navigate to **Access Tokens**
3. Click **Create New Token**
4. Name it descriptively (e.g., "MCP Server Access")
5. Copy the token (you won't see it again)

### Step 2: Configure MCP Client

#### Cursor Configuration
Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=<your-project-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<your-access-token>"
      }
    }
  }
}
```

#### Claude Desktop Configuration
Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y", 
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=<your-project-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<your-access-token>"
      }
    }
  }
}
```

#### VS Code (Copilot) Configuration
Create `.mcp.json` in project root:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=<your-project-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<your-access-token>"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Yes | None | Personal access token for authentication |
| `SUPABASE_PROJECT_REF` | No | Auto-detected | Project reference ID |
| `SUPABASE_REGION` | No | us-east-1 | AWS region for your project |
| `DATABASE_URL` | No | Auto-generated | Direct database connection string |

### Configuration Options

#### Read-Only Mode (Recommended)
```bash
--read-only
```
Restricts the server to SELECT queries only, preventing data modification.

#### Project Scoping (Recommended)
```bash
--project-ref=<your-project-id>
```
Limits access to a specific project instead of all projects in your account.

#### Windows Configuration
For Windows users, prefix commands with `cmd /c`:

```json
{
  "command": "cmd",
  "args": [
    "/c",
    "npx",
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--read-only",
    "--project-ref=<your-project-ref>"
  ]
}
```

## Security Best Practices {#security}

### Core Security Principles

#### 1. Use Read-Only Mode by Default
```bash
npx -y @supabase/mcp-server-supabase@latest --read-only
```

#### 2. Project Scoping
Always limit access to specific projects:
```bash
--project-ref=<your-project-id>
```

#### 3. Token Management
- Never commit tokens to version control
- Use environment variables or secure token storage
- Rotate tokens regularly
- Use minimal privilege tokens

#### 4. Database Branching for Development
```bash
# Create development branch
supabase branches create dev-branch

# Use branch for testing
--project-ref=<branch-ref>
```

### Environment Variable Security

#### Option 1: Global Environment Variables
```bash
# Set globally (recommended for development)
export SUPABASE_ACCESS_TOKEN="your-token-here"
```

#### Option 2: Project-Specific .env
Create `.env` file in project root:
```env
SUPABASE_ACCESS_TOKEN=your-token-here
SUPABASE_PROJECT_REF=your-project-ref
```

#### Option 3: Client Configuration
Keep tokens in MCP client configuration (ensure not committed):
```json
{
  "env": {
    "SUPABASE_ACCESS_TOKEN": "<token-here>"
  }
}
```

## Build Time Configuration {#build-time}

### Development Workflow Setup

#### 1. Local Development Configuration
```bash
# Initialize Supabase project
supabase init

# Start local development
supabase start

# Generate types for local development
npx supabase gen types typescript --local > database.types.ts
```

#### 2. Build Time Type Generation
```bash
# Add to package.json scripts
{
  "scripts": {
    "build:types": "supabase gen types typescript --project-id \"$PROJECT_REF\" > database.types.ts",
    "build:types:local": "supabase gen types typescript --local > database.types.ts",
    "prebuild": "npm run build:types"
  }
}
```

#### 3. CI/CD Integration
```yaml
# GitHub Actions example
name: Build with Supabase Types
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Supabase types
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_REF: ${{ secrets.PROJECT_REF }}
        run: |
          npx supabase gen types typescript --project-id "$PROJECT_REF" > database.types.ts
      
      - name: Build project
        run: npm run build
```

## Core Features and Tools {#features}

### Available MCP Tools

The Supabase MCP server provides 20+ tools for comprehensive database management:

#### Database Operations
- **Schema Design & Migrations**: Auto-generate SQL for table creation and schema updates
- **Query Execution**: Run secure, read-only SQL queries
- **Table Management**: Create, modify, and manage database tables

#### Project Management
- **Project Configuration**: Fetch URLs, API keys, and environment variables
- **Project Creation**: Spin up new Supabase projects
- **Project Control**: Pause and restore projects

#### Development Tools
- **Database Branching**: Create isolated development environments
- **TypeScript Generation**: Generate types from database schema
- **Log Retrieval**: Access project logs for debugging

#### Edge Functions (New in 2025)
- **Function Creation**: Create new Edge Functions
- **Function Deployment**: Deploy and update Edge Functions
- **Function Management**: Manage existing functions

### Usage Examples

#### Query Execution
```sql
-- AI can execute queries like this through MCP
SELECT 
  id, 
  title, 
  created_at 
FROM posts 
WHERE status = 'published' 
ORDER BY created_at DESC 
LIMIT 10;
```

#### Schema Generation
```sql
-- AI can generate and execute schema changes
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Project Configuration Fetching
The MCP can automatically fetch and configure:
- Project URL
- Anonymous key
- Service role key (if permissions allow)
- Database connection strings

## TypeScript Integration {#typescript}

### Automatic Type Generation

#### Setup Type Generation
```bash
# Generate types for remote project
npx supabase gen types typescript --project-id "your-project-id" > database.types.ts

# Generate types for local development
npx supabase gen types typescript --local > database.types.ts
```

#### Using Generated Types
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Now you have full type safety
const { data: posts, error } = await supabase
  .from('posts')
  .select('id, title, content, created_at')
  .eq('published', true)
```

#### MCP Type Generation Tool
The MCP server includes a tool for generating TypeScript types:

```json
{
  "tool": "generate_typescript_types",
  "parameters": {
    "output_path": "/absolute/path/to/database.types.ts",
    "included_schemas": ["public", "auth"],
    "output_filename": "database.types.ts"
  }
}
```

### Build Integration

#### Automated Type Updates
```json
{
  "scripts": {
    "dev": "npm run build:types && next dev",
    "build": "npm run build:types && next build",
    "build:types": "supabase gen types typescript --project-id \"$PROJECT_REF\" --schema public > database.types.ts"
  }
}
```

## Database Branching {#branching}

### Creating and Managing Branches

#### Branch Creation
```bash
# Create a new development branch
supabase branches create feature-branch

# Create branch with specific configuration
supabase branches create feature-branch --git-branch feature/new-auth
```

#### Branch Configuration in MCP
```json
{
  "mcpServers": {
    "supabase-dev": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=<branch-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<access-token>"
      }
    }
  }
}
```

### Branching Workflow

#### 1. Development Branch Setup
```bash
# Create development environment
supabase branches create development

# Apply migrations to branch
supabase db push --branch development

# Generate types for branch
supabase gen types typescript --project-id "branch-ref" > types/branch.types.ts
```

#### 2. Testing and Validation
```bash
# Test changes in isolated environment
# MCP can execute queries against branch
# Validate schema changes
```

#### 3. Merge to Production
```bash
# Create merge request
supabase branches merge development

# Or merge via dashboard/API
```

### Branching Best Practices

1. **Always use branches for development**
2. **Test schema changes in branches first**
3. **Use descriptive branch names**
4. **Clean up merged branches**
5. **Use seed data for testing**

## Edge Functions Management {#edge-functions}

### New Edge Function Capabilities (2025)

The Supabase MCP server now supports full Edge Function lifecycle management:

#### Creating Edge Functions
```typescript
// MCP can create Edge Functions like this
export default async function handler(req: Request) {
  const { method, url } = req
  
  if (method === 'POST') {
    const body = await req.json()
    
    // Function logic here
    return new Response(
      JSON.stringify({ success: true, data: body }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }
  
  return new Response('Method not allowed', { status: 405 })
}
```

#### Deployment via MCP
The MCP server can:
- Create new Edge Functions
- Update existing functions
- Deploy functions to production
- Manage function configurations
- Handle environment variables

#### Function Management Tools
- **create_edge_function**: Create new Edge Function
- **update_edge_function**: Update existing function code
- **deploy_edge_function**: Deploy function to environment
- **list_edge_functions**: List all project functions
- **get_function_logs**: Retrieve function execution logs

## Troubleshooting {#troubleshooting}

### Common Issues and Solutions

#### 1. MCP Server Not Connecting
```bash
# Check Node.js PATH
npm config get prefix

# Restart MCP client
# Verify token permissions
```

#### 2. Read-Only Mode Issues
```json
{
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest"
    // Remove --read-only flag for write operations
  ]
}
```

#### 3. Project Access Issues
```bash
# Verify project reference
--project-ref=<correct-project-id>

# Check token permissions
# Ensure project exists and accessible
```

#### 4. Type Generation Failures
```bash
# Verify CLI installation
npx supabase --version

# Check authentication
npx supabase login

# Verify project connection
npx supabase projects list
```

#### 5. Windows Path Issues
```json
{
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest"]
}
```

### Debug Mode

#### Enable Verbose Logging
```bash
# Run with debug output
DEBUG=* npx @supabase/mcp-server-supabase@latest
```

#### Check MCP Server Status
Most MCP clients show server status in their settings:
- **Green**: Server connected and active
- **Red**: Server error or disconnected
- **Yellow**: Server starting or issues

## Advanced Usage {#advanced}

### Multi-Environment Setup

#### Production Configuration
```json
{
  "mcpServers": {
    "supabase-prod": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=<prod-project-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<prod-token>"
      }
    }
  }
}
```

#### Development Configuration
```json
{
  "mcpServers": {
    "supabase-dev": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=<dev-branch-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<dev-token>"
      }
    }
  }
}
```

### Custom Tool Configuration

#### Selective Tool Enabling
```json
{
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--tools-config", "./mcp-tools.json"
  ]
}
```

#### MCP Tools Configuration
```json
{
  "enabled_tools": [
    "supabase_query",
    "generate_typescript_types",
    "create_table",
    "fetch_project_config"
  ],
  "disabled_tools": [
    "delete_project",
    "pause_project"
  ]
}
```

### Performance Optimization

#### Connection Pooling
```json
{
  "env": {
    "SUPABASE_ACCESS_TOKEN": "<token>",
    "MAX_CONNECTIONS": "10",
    "CONNECTION_TIMEOUT": "30000"
  }
}
```

#### Query Optimization
- Use specific column selection
- Implement proper indexing
- Limit result sets appropriately
- Use read replicas for read-only operations

### Integration with Other Tools

#### GitHub Actions Integration
```yaml
- name: Update Supabase Schema
  uses: supabase/setup-cli@v1
  with:
    version: latest
  
- name: Deploy Schema Changes
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  run: |
    supabase db push --project-ref ${{ secrets.PROJECT_REF }}
```

#### Docker Integration
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

# Install Supabase CLI
RUN npm install -g @supabase/mcp-server-supabase

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

## Conclusion

The Supabase MCP server represents a significant advancement in AI-powered database management, enabling seamless integration between AI tools and Supabase projects. By following the configurations and best practices outlined in this guide, you can leverage the full power of MCP for automated database operations, secure development workflows, and enhanced productivity.

### Key Takeaways

1. **Always use read-only mode** for production environments
2. **Implement proper project scoping** to limit access
3. **Use database branching** for safe development
4. **Generate TypeScript types** for type safety
5. **Follow security best practices** for token management
6. **Leverage Edge Functions** for serverless functionality
7. **Monitor and audit** MCP server activities

### Resources

- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/security)
- [TypeScript Integration Guide](https://supabase.com/docs/guides/api/rest/generating-types)

---

*This guide covers the latest Supabase MCP features and functionality as of September 2025. For the most up-to-date information, always refer to the official Supabase documentation.*