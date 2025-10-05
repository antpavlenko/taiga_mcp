import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClientFromEnv } from './client';
import { registerTools } from './tools';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const server = new McpServer(
  { name: 'Taiga MCP', version: '1.1.2' },
  { capabilities: { tools: {} } }
);

// Register all tools using a Taiga client built from env (which also parses CLI args)
const client = createClientFromEnv();
registerTools(server, client);

// Diagnostics tool for debugging configuration issues (only when TAIGA_MCP_DEBUG is set)
if (process.env.TAIGA_MCP_DEBUG) {
  server.registerTool('taiga_debug_info', { title: 'Debug info', description: 'Report effective MCP config (argv/env).' }, async () => {
    const info = {
      argv: process.argv,
      env: {
        TAIGA_BASE_URL: process.env.TAIGA_BASE_URL ? 'set' : 'missing',
        TAIGA_TOKEN: process.env.TAIGA_TOKEN ? 'set' : 'missing',
        TAIGA_PROJECT_ID: process.env.TAIGA_PROJECT_ID ? String(process.env.TAIGA_PROJECT_ID) : 'missing'
      }
    } as any;
    try { info.cwd = process.cwd(); } catch {}
    return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] } as any;
  });
}

(async () => {
  // Write a small debug file on startup to help diagnose env/argv handoff even if tools aren't visible
  try {
    const debugPayload = {
      ts: new Date().toISOString(),
      argv: process.argv,
      env: {
        TAIGA_BASE_URL: process.env.TAIGA_BASE_URL ? 'set' : 'missing',
        TAIGA_TOKEN: process.env.TAIGA_TOKEN ? 'set' : 'missing',
        TAIGA_PROJECT_ID: process.env.TAIGA_PROJECT_ID ? String(process.env.TAIGA_PROJECT_ID) : 'missing',
        TAIGA_MCP_DEBUG: process.env.TAIGA_MCP_DEBUG ? String(process.env.TAIGA_MCP_DEBUG) : undefined
      },
      cwd: (() => { try { return process.cwd(); } catch { return undefined; } })()
    };
    const dir = path.join(os.tmpdir(), 'taiga-mcp');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'last-start.json'), JSON.stringify(debugPayload, null, 2), 'utf8');
  } catch {}
  await server.connect(new StdioServerTransport());
})();
