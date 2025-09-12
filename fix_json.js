const fs = require('fs');

const correctJson = {
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp@latest"
      ]
    },
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase",
        "--read-only",
        "--project-ref=<project-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_292eb1bdab826b3cc8dd697c91a94fa8fc46d40e"
      }
    },
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
};

// Write the corrected JSON to the target file
fs.writeFileSync('c:/Users/sergi/AppData/Roaming/Qoder/SharedClientCache/mcp.json', JSON.stringify(correctJson, null, 2));
console.log('JSON file has been fixed successfully!');