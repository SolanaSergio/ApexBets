const fs = require('fs');
const path = require('path');

// Path to the MCP config file
const mcpConfigPath = path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'Qoder', 'SharedClientCache', 'mcp.json');

// Read the current config
const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));

// Update the configuration to use the official Supabase MCP server with a placeholder for project reference
config.mcpServers.supabase = {
  "command": "cmd",
  "args": [
    "/c",
    "npx",
    "-y",
    "@supabase/mcp-server-supabase",
    "--read-only",
    "--project-ref=YOUR_PROJECT_REF_HERE"
  ],
  "env": {
    "SUPABASE_ACCESS_TOKEN": "sbp_292eb1bdab826b3cc8dd697c91a94fa8fc46d40e"
  }
};

// Remove the project-specific MCP server
delete config.mcpServers['project-apex-mcp'];

// Write the updated config back to the file
fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2));

console.log('✅ MCP configuration updated successfully!');
console.log('The configuration now uses the official Supabase MCP server.');
console.log('Please replace "YOUR_PROJECT_REF_HERE" with your actual Supabase project reference.');
console.log('You can find your project reference in your Supabase dashboard URL: https://supabase.com/dashboard/project/YOUR_PROJECT_REF_HERE');