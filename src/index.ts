#!/usr/bin/env node
/**
 * UI/UX Pro Max MCP Server
 * Supports both stdio transport (for VS Code) and HTTP/SSE transport
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolResult,
  isInitializeRequest
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import type { Server as HttpServer } from 'node:http';

// Check if running in stdio mode (VS Code) or HTTP mode (standalone server)
const isStdioMode = process.argv.includes('--stdio') || (!process.env.PORT && !process.argv.includes('--http'));

import {
  initializeIndexes,
  searchStyles,
  searchColors,
  searchTypography,
  searchCharts,
  searchUXGuidelines,
  searchIcons,
  searchLanding,
  searchProducts,
  searchPrompts,
  searchStack,
  listAvailableStacks,
  searchAll,
  getDataStats,
  getDesignSystem
} from './tools/handlers.js';

// ============================================================================
// LOGGING UTILITY (suppressed in stdio mode)
// ============================================================================

function log(...args: unknown[]): void {
  if (!isStdioMode) {
    console.log(...args);
  }
}

function logError(...args: unknown[]): void {
  if (!isStdioMode) {
    console.error(...args);
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '3456', 10);
const SERVER_NAME = 'ui-ux-pro-mcp';
const SERVER_VERSION = '1.0.0';

// Session management configuration
const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_MS || String(30 * 60 * 1000), 10); // 30 minutes default
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || '100', 10);
const SESSION_CLEANUP_INTERVAL_MS = 60 * 1000; // Check every minute

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
  {
    name: 'search_ui_styles',
    description: 'Search 70+ UI styles with implementation-ready colors, effects, and CSS guidance.\n\nWHEN TO USE: Visual aesthetics, design systems, specific style implementation (glassmorphism, brutalism, etc.).\n\nQUERY TIPS: Combine style name with mood or industry. Use descriptive terms like "dark mode", "minimal", "playful".\n\nRETURNS: Style Category, Type, Keywords, Primary/Secondary Colors (hex), Effects & Animation, Best For, Framework Compatibility.\n\nEXAMPLES: "glassmorphism dark mode", "minimalist saas dashboard", "brutalist portfolio"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for UI styles'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_colors',
    description: 'Search 100+ color palettes with hex codes for industries and design contexts.\n\nWHEN TO USE: Brand colors, UI themes, industry-specific schemes, dark/light mode palettes.\n\nQUERY TIPS: Specify industry (fintech, healthcare) or mood (calm, energetic). Include context like "dark mode".\n\nRETURNS: Product Type, Keywords, Primary/Secondary/CTA/Background/Text hex codes, Usage Notes.\n\nEXAMPLES: "fintech crypto dark", "healthcare calm accessible", "e-commerce luxury gold"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for color palettes'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_typography',
    description: 'Search 70+ font pairings with Google Fonts imports and Tailwind configurations.\n\nWHEN TO USE: Heading/body font combos, brand typography, readability optimization.\n\nQUERY TIPS: Describe mood (modern, elegant), category (sans-serif), or use case (developer docs).\n\nRETURNS: Pairing Name, Heading Font, Body Font, Keywords, Google Fonts URL, CSS Import, Tailwind Config.\n\nEXAMPLES: "modern tech startup", "elegant luxury serif", "developer documentation mono"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for typography and font pairings'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_charts',
    description: 'Search 25+ chart types with implementation recommendations for data visualization.\n\nWHEN TO USE: Dashboard charts, data presentation, selecting appropriate chart type.\n\nQUERY TIPS: Describe data type (time series, comparison) or visualization goal (trends, distribution).\n\nRETURNS: Data Type, Best Chart Type, Secondary Options, Color Guidance, Library Recommendation.\n\nEXAMPLES: "time series price data", "category comparison bar", "real-time streaming dashboard"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for chart types and data visualization'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_ux_guidelines',
    description: 'Search 100+ UX best practices with do\'s, don\'ts, and code examples.\n\nWHEN TO USE: Accessibility compliance, interaction patterns, platform-specific guidelines.\n\nQUERY TIPS: Be specific about UX aspect (forms, navigation) or platform (mobile, web).\n\nRETURNS: Category, Issue, Platform, Do/Don\'t practices, Code Good/Bad examples, Severity.\n\nEXAMPLES: "form validation errors", "mobile navigation patterns", "accessibility screen reader"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for UX guidelines and best practices'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_icons',
    description: 'Search 100+ curated Lucide icons with import codes and use cases.\n\nWHEN TO USE: Finding icons for UI elements, consistent icon selection.\n\nQUERY TIPS: Describe action or concept (settings, user) or context (navigation, status).\n\nRETURNS: Category, Icon Name, Keywords, Import Code, JSX Usage, Best For.\n\nEXAMPLES: "user profile settings", "chart analytics", "notification alert warning"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for icons'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_landing',
    description: 'Search 40+ landing page patterns with section structures and conversion tips.\n\nWHEN TO USE: Page layout planning, section ordering, CTA placement, conversion optimization.\n\nQUERY TIPS: Specify page type (hero, pricing) or goal (lead capture, product showcase).\n\nRETURNS: Pattern Name, Keywords, Section Order, CTA Placement, Color Strategy, Conversion Tips.\n\nEXAMPLES: "hero with testimonials", "pricing comparison table", "lead capture minimal"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for landing page patterns'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_products',
    description: 'Search 100+ product type design recommendations with style and layout guidance.\n\nWHEN TO USE: Initial project setup, understanding design conventions for specific product types.\n\nQUERY TIPS: Name the product category (SaaS, e-commerce, fintech) or describe product purpose.\n\nRETURNS: Product Type, Keywords, Primary/Secondary Style, Landing Pattern, Dashboard Style, Color Focus.\n\nEXAMPLES: "fintech crypto trading", "saas b2b dashboard", "e-commerce fashion luxury"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for product design recommendations'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_all',
    description: 'Unified search across ALL design domains with intelligent auto-detection. Searches: styles, colors, typography, charts, icons, ux-guidelines, landing, products, prompts.\n\nWHEN TO USE: DEFAULT tool for broad queries. Use when unsure which specific tool, or need multi-domain results.\n\nQUERY TIPS: Use natural language describing your design goal. System auto-detects relevant domains.\n\nRETURNS: Results grouped by domain with relevance scores. Each domain returns its specific fields.\n\nEXAMPLES: "modern fintech dashboard dark", "e-commerce checkout ux", "startup landing complete"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query across all design domains'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results per domain',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_prompts',
    description: 'Search AI prompt templates with CSS keywords, implementation checklists, and design tokens.\n\nWHEN TO USE: AI-assisted design workflows, style-specific implementation, design system setup.\n\nQUERY TIPS: Name the style (glassmorphism) or aesthetic goal (futuristic, organic).\n\nRETURNS: Style Category, AI Prompt Keywords, CSS Keywords, Implementation Checklist, Design Tokens.\n\nEXAMPLES: "glassmorphism implementation", "dark mode design tokens", "minimalist design system"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for AI prompts (e.g., "minimalism", "glassmorphism", "dark mode")'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_stack',
    description: 'Search framework-specific guidelines for: flutter, html-tailwind, nextjs, nuxt-ui, nuxtjs, react-native, react, shadcn, svelte, swiftui, vue.\n\nWHEN TO USE: Framework-specific patterns, component best practices, state management.\n\nQUERY TIPS: Include framework name AND topic (e.g., "react hooks forms", "nextjs api routes").\n\nRETURNS: Category, Guideline, Description, Do/Don\'t, Code Examples, Severity, Docs URL.\n\nEXAMPLES: "react state management", "nextjs server components", "vue composition api"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        stack_name: {
          type: 'string',
          description: 'Framework/stack name (e.g., "react", "vue", "nextjs", "flutter", "swiftui")',
          enum: ['flutter', 'html-tailwind', 'nextjs', 'nuxt-ui', 'nuxtjs', 'react-native', 'react', 'shadcn', 'svelte', 'swiftui', 'vue']
        },
        query: {
          type: 'string',
          description: 'Search query for guidelines (e.g., "state management", "hooks", "components")'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 3,
          minimum: 1,
          maximum: 50
        }
      },
      required: ['stack_name', 'query']
    }
  },
  {
    name: 'get_design_system',
    description: 'Generate a complete design system by combining styles, colors, typography, and layout patterns.\n\nWHEN TO USE: Starting a new project, need cohesive design foundation, want all design elements in one call.\n\nQUERY TIPS: Specify product type and optionally style preference or mode.\n\nRETURNS: Integrated design system with colors (including Tailwind config), typography (with CSS imports), UI style (with CSS code), and landing layout (with CSS grid).\n\nEXAMPLES: "fintech dark glassmorphism", "saas minimal clean", "e-commerce luxury", "startup landing"',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Product type or design description (e.g., "fintech dark", "saas minimal", "e-commerce luxury")'
        },
        style: {
          type: 'string',
          description: 'Specific style preference (e.g., "glassmorphism", "minimalism", "brutalism")'
        },
        mode: {
          type: 'string',
          enum: ['light', 'dark'],
          description: 'Color mode preference'
        },
        max_results: {
          type: 'number',
          description: 'Maximum items per domain',
          default: 1,
          minimum: 1,
          maximum: 5
        }
      },
      required: ['query']
    }
  }
];

// ============================================================================
// TOOL HANDLER ROUTING
// ============================================================================

interface ToolArguments {
  query: string;
  max_results?: number;
  stack_name?: string;
  style?: string;
  mode?: 'light' | 'dark';
}

function isSearchError(result: unknown): result is { error: string } {
  return typeof result === 'object' && result !== null && 'error' in result;
}

function handleToolCall(name: string, args: ToolArguments): CallToolResult {
  const { query, max_results, stack_name } = args;
  let results: unknown;

  switch (name) {
    case 'search_ui_styles':
      results = searchStyles(query, max_results ?? 3);
      break;
    case 'search_colors':
      results = searchColors(query, max_results ?? 3);
      break;
    case 'search_typography':
      results = searchTypography(query, max_results ?? 3);
      break;
    case 'search_charts':
      results = searchCharts(query, max_results ?? 3);
      break;
    case 'search_ux_guidelines':
      results = searchUXGuidelines(query, max_results ?? 3);
      break;
    case 'search_icons':
      results = searchIcons(query, max_results ?? 3);
      break;
    case 'search_landing':
      results = searchLanding(query, max_results ?? 3);
      break;
    case 'search_products':
      results = searchProducts(query, max_results ?? 3);
      break;
    case 'search_all':
      results = searchAll(query, max_results ?? 2);
      break;
    case 'search_prompts':
      results = searchPrompts(query, max_results ?? 3);
      break;
    case 'search_stack':
      results = searchStack(stack_name, query, max_results ?? 3);
      break;
    case 'get_design_system':
      results = getDesignSystem(query, args.style, args.mode, max_results ?? 1);
      break;
    default:
      return {
        content: [{
          type: 'text',
          text: `Error: Unknown tool "${name}"`
        }],
        isError: true
      };
  }

  // Handle validation/error responses
  if (isSearchError(results)) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${results.error}`
      }],
      isError: true
    };
  }

  const resultsArray = results as unknown[];
  if (resultsArray.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `No results found for query: "${query}"`
      }]
    };
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(resultsArray, null, 2)
    }]
  };
}

// ============================================================================
// SERVER FACTORY
// ============================================================================

function createMCPServer(): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: { listChanged: true } } }
  );

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;
    return handleToolCall(name, (args || {}) as unknown as ToolArguments);
  });

  return server;
}

// ============================================================================
// HTTP SERVER SETUP
// ============================================================================

// Session tracking with timestamps
interface SessionInfo {
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
}

// ============================================================================
// STDIO MODE (VS Code)
// ============================================================================

async function runStdioMode(): Promise<void> {
  // Initialize search indexes silently
  try {
    initializeIndexes();
  } catch (error) {
    // Write to stderr in stdio mode for debugging
    console.error('Failed to initialize data:', error);
    process.exit(1);
  }

  const server = createMCPServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}

// ============================================================================
// HTTP MODE (Standalone Server)
// ============================================================================

async function runHttpMode(): Promise<void> {
  log('╔════════════════════════════════════════════════════════════╗');
  log('║          UI/UX Pro Max MCP Server                          ║');
  log('║          Design Intelligence for AI Agents                 ║');
  log('╚════════════════════════════════════════════════════════════╝');
  log();

  // Initialize search indexes
  log('📊 Loading design data and building search indexes...');

  try {
    initializeIndexes();
    const stats = getDataStats();

    log('✅ Data loaded successfully:');
    log(`   • Styles:        ${stats.styles} entries`);
    log(`   • Colors:        ${stats.colors} entries`);
    log(`   • Typography:    ${stats.typography} entries`);
    log(`   • Charts:        ${stats.charts} entries`);
    log(`   • UX Guidelines: ${stats.uxGuidelines} entries`);
    log(`   • Icons:         ${stats.icons} entries`);
    log(`   • Landing:       ${stats.landing} entries`);
    log(`   • Products:      ${stats.products} entries`);
    log(`   • Prompts:       ${stats.prompts} entries`);
    log(`   • Stacks:        ${Object.keys(stats.stacks).length} frameworks`);
    for (const [stackName, count] of Object.entries(stats.stacks)) {
      log(`     - ${stackName}: ${count} guidelines`);
    }
    log(`   ─────────────────────────────`);
    log(`   • Total:         ${stats.total} searchable documents`);
    log();
  } catch (error) {
    logError('❌ Failed to initialize data:', error);
    process.exit(1);
  }

  // Setup Express app
  const app = express();

  // Request body size limit (10kb max)
  app.use(express.json({ limit: '10kb' }));

  // Rate limiting: 100 requests per minute per IP
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Rate limit exceeded. Please try again later.' },
      id: null
    }
  });
  app.use(limiter);

  // Session management with TTL tracking
  const sessions: Record<string, SessionInfo> = {};

  // Session cleanup timer
  const cleanupExpiredSessions = () => {
    const now = Date.now();
    for (const [sessionId, sessionInfo] of Object.entries(sessions)) {
      if (now - sessionInfo.lastActivity > SESSION_TTL_MS) {
        log(`🧹 Cleaning up expired session: ${sessionId}`);
        try {
          sessionInfo.transport.close();
        } catch (e) {
          // Session may already be closed
        }
        delete sessions[sessionId];
      }
    }
  };

  const cleanupInterval = setInterval(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL_MS);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    const stats = getDataStats();
    res.json({
      status: 'healthy',
      server: SERVER_NAME,
      version: SERVER_VERSION,
      tools: TOOLS.length,
      documents: stats.total,
      activeSessions: Object.keys(sessions).length,
      stats
    });
  });

  // MCP endpoint - POST for requests
  app.post('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && sessions[sessionId]) {
      // Reuse existing session and update activity timestamp
      sessions[sessionId].lastActivity = Date.now();
      transport = sessions[sessionId].transport;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Check max sessions limit
      if (Object.keys(sessions).length >= MAX_SESSIONS) {
        res.status(503).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Server at capacity. Please try again later.' },
          id: null
        });
        return;
      }

      // New session initialization
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions[id] = {
            transport,
            lastActivity: Date.now()
          };
          log(`📡 New session: ${id} (active: ${Object.keys(sessions).length})`);
        }
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete sessions[transport.sessionId];
          log(`📴 Session closed: ${transport.sessionId} (active: ${Object.keys(sessions).length})`);
        }
      };

      const server = createMCPServer();
      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid session or missing initialization' },
        id: null
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  // MCP endpoint - GET for SSE streams
  app.get('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    const sessionInfo = sessions[sessionId];

    if (sessionInfo) {
      sessionInfo.lastActivity = Date.now();
      await sessionInfo.transport.handleRequest(req, res);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid session' },
        id: null
      });
    }
  });

  // MCP endpoint - DELETE for session cleanup
  app.delete('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    const sessionInfo = sessions[sessionId];

    if (sessionInfo) {
      await sessionInfo.transport.handleRequest(req, res);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid session' },
        id: null
      });
    }
  });

  // Start server
  let httpServer: HttpServer;
  httpServer = app.listen(PORT, () => {
    log(`🚀 MCP Server running on http://localhost:${PORT}`);
    log(`   • Health check: http://localhost:${PORT}/health`);
    log(`   • MCP endpoint: http://localhost:${PORT}/mcp`);
    log(`   • Tools registered: ${TOOLS.length}`);
    log(`   • Rate limit: 100 req/min per IP`);
    log(`   • Session TTL: ${SESSION_TTL_MS / 1000 / 60} minutes`);
    log(`   • Max sessions: ${MAX_SESSIONS}`);
    log();
    log('📋 Available tools:');
    TOOLS.forEach(tool => {
      log(`   • ${tool.name}`);
    });
    log();
    log('Ready to accept connections...');
  });

  // Graceful shutdown handlers
  const gracefulShutdown = (signal: string) => {
    log(`\n📴 Received ${signal}. Shutting down gracefully...`);

    // Stop accepting new connections
    clearInterval(cleanupInterval);

    // Close all active sessions
    for (const [sessionId, sessionInfo] of Object.entries(sessions)) {
      try {
        sessionInfo.transport.close();
        log(`   Closed session: ${sessionId}`);
      } catch (e) {
        // Session may already be closed
      }
    }

    // Close HTTP server
    httpServer.close((err) => {
      if (err) {
        logError('Error closing server:', err);
        process.exit(1);
      }
      log('✅ Server shutdown complete.');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logError('⚠️ Graceful shutdown timeout. Forcing exit.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function main(): Promise<void> {
  if (isStdioMode) {
    // VS Code / stdio mode
    await runStdioMode();
  } else {
    // HTTP server mode
    await runHttpMode();
  }
}

// Run the server
main().catch((error) => {
  // Always log fatal errors to stderr
  console.error('Fatal error:', error);
  process.exit(1);
});
