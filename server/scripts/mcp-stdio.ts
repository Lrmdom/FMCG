import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fmcgMcpServer } from '../mcp/server.ts';

async function main() {
  const transport = new StdioServerTransport();
  await fmcgMcpServer.connect(transport);
  console.error('FMCG Cart MCP Server started using @modelcontextprotocol/sdk (stdio transport)');
}

main().catch((error) => {
  console.error('Fatal error in MCP stdio runner:', error);
  process.exit(1);
});
