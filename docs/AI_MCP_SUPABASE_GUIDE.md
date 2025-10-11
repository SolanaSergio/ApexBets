# AI Guide: Supabase Access via MCP Server

## 1. Introduction

This document provides comprehensive instructions for an AI agent to interact
with the Supabase database through the designated MCP (Managed Control Plane)
server. The MCP server acts as a secure and controlled intermediary, ensuring
all database operations adhere to project policies, maintain data integrity, and
prevent direct, unmonitored access to the production database.

## 2. MCP Server Overview

The MCP server is a critical component of our infrastructure, designed to
centralize and manage all interactions with the Supabase database. It provides a
layer of abstraction and control, offering several benefits:

- **Security:** All database operations are routed through the MCP, allowing for
  centralized authentication, authorization, and auditing.
- **Data Integrity:** The MCP can enforce schema validations, business rules,
  and prevent accidental data corruption.
- **Observability:** All database interactions are logged and monitored by the
  MCP, providing a clear audit trail.
- **Abstraction:** The AI interacts with a simplified API exposed by the MCP,
  rather than directly managing complex SQL queries or Supabase client
  configurations.

## 3. Supabase Access through MCP

The AI **MUST NOT** directly access Supabase using `@supabase/supabase-js` or
any other direct client library. All interactions must be performed using the
specialized MCP tools provided in the AI's environment. These tools abstract
away the Supabase client details and ensure compliance with security and
operational policies.

### Available MCP Tools for Supabase Interaction:

Your environment provides the following tools for interacting with Supabase via
the MCP server:

- `mcp_supabase_list_projects()`: Lists all Supabase projects accessible through
  the MCP.
- `mcp_supabase_execute_sql(project_id: string, sql_query: string)`: Executes a
  raw SQL query against a specified Supabase project. **Use with extreme
  caution.**
- `mcp_supabase_apply_migration(project_id: string, migration_script: string)`:
  Applies a database migration script to a specified Supabase project.
- `mcp_supabase_list_tables(project_id: string)`: Lists all tables within a
  specified Supabase project.
- `mcp_supabase_get_logs(project_id: string, log_type: string)`: Retrieves logs
  from a specified Supabase project.

## 4. Best Practices for Using MCP Tools

1.  **Always Use MCP Tools:** Never attempt to bypass the MCP tools for Supabase
    access. Direct access is strictly prohibited and will result in errors.
2.  **Identify Project ID:** Before performing any operation, use
    `mcp_supabase_list_projects()` to identify the correct `project_id` for the
    target Supabase instance.
3.  **Validate SQL Queries:** When using `mcp_supabase_execute_sql()`, ensure
    your SQL queries are well-formed, safe, and thoroughly tested. Avoid
    destructive operations unless explicitly instructed and confirmed.
4.  **Review Migrations:** Before applying migrations with
    `mcp_supabase_apply_migration()`, carefully review the `migration_script` to
    understand its impact on the database schema and data.
5.  **Monitor Logs:** Utilize `mcp_supabase_get_logs()` for debugging and
    monitoring the effects of your database operations.
6.  **Error Handling:** Always anticipate and handle potential errors from MCP
    tool invocations. The MCP will return detailed error messages for invalid
    operations or access violations.
7.  **No Hardcoding:** Continue the principle of no hardcoding. All dynamic
    data, configurations, and schema details should be retrieved
    programmatically through the appropriate MCP or application-level APIs.
8.  **Real-time Compliance:** Ensure that any real-time data requirements are
    met by leveraging Supabase's real-time features, as orchestrated by the MCP
    if necessary, and not through polling or other inefficient methods.

By adhering to these guidelines, the AI agent can safely and effectively manage
Supabase interactions, maintaining the integrity and security of the project's
data infrastructure.
