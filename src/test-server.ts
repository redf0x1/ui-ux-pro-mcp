/**
 * Test Script for UI/UX Pro Max MCP Server
 * Verifies server startup and tool registration
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3456/mcp';

async function testServer() {
  console.log('🧪 UI/UX Pro Max MCP Server Test Suite');
  console.log('════════════════════════════════════════');
  console.log();

  // Test 1: Health check
  console.log('Test 1: Health Check');
  try {
    const healthUrl = SERVER_URL.replace('/mcp', '/health');
    const healthResponse = await fetch(healthUrl);
    const healthData = await healthResponse.json();

    console.log(`  ✅ Server is healthy`);
    console.log(`     • Name: ${healthData.server}`);
    console.log(`     • Version: ${healthData.version}`);
    console.log(`     • Tools: ${healthData.tools}`);
    console.log(`     • Documents: ${healthData.documents}`);
    console.log();
  } catch (error) {
    console.log(`  ❌ Health check failed: ${error}`);
    console.log('     Make sure the server is running on port 3456');
    process.exit(1);
  }

  // Test 2: MCP Client Connection
  console.log('Test 2: MCP Client Connection');
  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  });

  try {
    const transport = new StreamableHTTPClientTransport(new URL(SERVER_URL));
    await client.connect(transport);
    console.log('  ✅ Connected to MCP server');
    console.log();
  } catch (error) {
    console.log(`  ❌ Connection failed: ${error}`);
    process.exit(1);
  }

  // Test 3: List Tools
  console.log('Test 3: List Available Tools');
  try {
    const toolsResponse = await client.listTools();
    const tools = toolsResponse.tools;

    console.log(`  ✅ Found ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`     • ${tool.name}: ${tool.description?.substring(0, 50)}...`);
    });
    console.log();
  } catch (error) {
    console.log(`  ❌ List tools failed: ${error}`);
    process.exit(1);
  }

  // Test 4: Call search_ui_styles
  console.log('Test 4: Call search_ui_styles');
  try {
    const result = await client.callTool({
      name: 'search_ui_styles',
      arguments: { query: 'modern minimal', max_results: 2 }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const textContent = content.find(c => c.type === 'text');

    if (textContent) {
      const parsed = JSON.parse(textContent.text);
      console.log(`  ✅ Got ${parsed.length} results for "modern minimal"`);
      if (parsed.length > 0) {
        console.log(`     First result score: ${parsed[0].score?.toFixed(4)}`);
      }
    }
    console.log();
  } catch (error) {
    console.log(`  ❌ Tool call failed: ${error}`);
    process.exit(1);
  }

  // Test 5: Call search_colors
  console.log('Test 5: Call search_colors');
  try {
    const result = await client.callTool({
      name: 'search_colors',
      arguments: { query: 'fintech professional', max_results: 2 }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const textContent = content.find(c => c.type === 'text');

    if (textContent) {
      const parsed = JSON.parse(textContent.text);
      console.log(`  ✅ Got ${parsed.length} results for "fintech professional"`);
    }
    console.log();
  } catch (error) {
    console.log(`  ❌ Tool call failed: ${error}`);
    process.exit(1);
  }

  // Test 6: Call search_all
  console.log('Test 6: Call search_all (unified search)');
  try {
    const result = await client.callTool({
      name: 'search_all',
      arguments: { query: 'dashboard analytics', max_results: 3 }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const textContent = content.find(c => c.type === 'text');

    if (textContent) {
      const parsed = JSON.parse(textContent.text);
      console.log(`  ✅ Got ${parsed.length} results for "dashboard analytics"`);
    }
    console.log();
  } catch (error) {
    console.log(`  ❌ Tool call failed: ${error}`);
    process.exit(1);
  }

  // Test 7: Error handling - unknown tool
  console.log('Test 7: Error Handling - Unknown Tool');
  try {
    const result = await client.callTool({
      name: 'unknown_tool',
      arguments: { query: 'test' }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const textContent = content.find(c => c.type === 'text');

    if (textContent && textContent.text.includes('Error')) {
      console.log('  ✅ Correctly returned error for unknown tool');
    } else if (result.isError) {
      console.log('  ✅ Correctly flagged as error');
    }
    console.log();
  } catch (error) {
    // This is actually expected behavior - server should reject unknown tools
    console.log('  ✅ Server correctly rejected unknown tool');
    console.log();
  }

  // Cleanup
  await client.close();

  console.log('════════════════════════════════════════');
  console.log('✅ All tests passed!');
  console.log();
}

// Run tests
testServer().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
