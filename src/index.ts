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
  searchComponents,
  searchPatterns,
  searchStack,
  searchPlatforms,
  searchAll,
  getDataStats,
  getDesignSystem
} from './tools/handlers.js';

// Available stacks for search_stack tool
const AVAILABLE_STACKS = [
  'flutter', 'jetpack-compose', 'html-tailwind', 'nextjs', 'nuxt-ui',
  'nuxtjs', 'react-native', 'react', 'shadcn', 'svelte', 'swiftui', 'vue'
] as const;

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
  // 1. Complete Design System Generator
  {
    name: 'get_design_system',
    description: `Generate a complete design system by combining styles, colors, typography, and layout patterns.

WHEN TO USE: Starting a new project, need cohesive design foundation, want all design elements in one call.

PLATFORM DETECTION: Platform is auto-detected from query keywords (iOS, Android, Flutter, etc.) or can be explicitly specified via the platform parameter.
- If platform is specified, it overrides auto-detection
- Platform affects navigation patterns, safe areas, touch targets
- When iOS keywords (ios, swiftui, cupertino) or Android keywords (android, material 3, jetpack compose) are detected, returns platform_guidelines with HIG/Material patterns and cross-platform code equivalents (Flutter_Equiv, RN_Equiv)

INTENT DETECTION: Layout is auto-detected based on query structure:
- Multi-word phrases take priority: "landing page" → landing layout
- Single keywords scanned left-to-right: "analytics saas" → dashboard (analytics detected first)
- Position matters: first intent keyword wins

INTENT KEYWORDS:
- For landing layouts: "landing page", "homepage", "website", "hero", "cta"
- For dashboard layouts: "dashboard", "analytics", "admin panel", "metrics", "kpi"

QUERY TIPS: Place intent keywords at START of query for highest confidence.

RETURNS: Integrated design system with _meta showing detected/resolved platform, intent, colors (with dark_mode if mode="dark"), typography, UI style, layout with source indicator, and platform_guidelines when iOS/Android detected.

EXAMPLES: "landing page fintech dark glassmorphism", "dashboard analytics saas", "e-commerce website luxury", "admin panel healthcare", "flutter fintech mobile", "ios finance app", "android material dashboard"`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Product type + intent + style description. Intent keyword placement matters: "landing page saas" → landing layout, "analytics dashboard saas" → dashboard layout. Multi-word phrases like "landing page", "admin panel" have priority over single words.' },
        style: { type: 'string', description: 'Specific style preference (e.g., "glassmorphism", "minimalism", "brutalism")' },
        mode: { type: 'string', enum: ['light', 'dark'], description: 'Color mode preference. When "dark", the tool parses Dark_Mode_Colors and returns dark-optimized palette with dark background/text colors.' },
        max_results: { type: 'number', default: 1, minimum: 1, maximum: 5, description: 'Maximum items per domain' },
        platform: { type: 'string', enum: ['web', 'mobile-ios', 'mobile-android', 'mobile', 'react-native', 'flutter', 'swiftui', 'expo'], description: 'Target platform for design system. If not specified, will be auto-detected from query. Use to override auto-detection.' },
        output_format: { type: 'string', enum: ['ai-optimized', 'minimal', 'full', 'structured'], description: "⚠️ RECOMMENDED: Leave empty (defaults to 'ai-optimized' ~3.5K tokens). Only change if you have a specific reason. Options: 'ai-optimized' (default, best for AI coding), 'minimal' (~8K, includes HTML templates), 'full' (⚠️ NOT recommended - 15K+ tokens, programmatic use only), 'structured' (JSON only, no guide)." },
        include_hover_effects: { type: 'boolean', description: 'Include hover_effects CSS in output. Default: false for ai-optimized, true for other formats.' }
      },
      required: ['query']
    }
  },

  // 2. Smart Unified Search
  {
    name: 'search_all',
    description: `Unified search across ALL design domains with intelligent auto-detection. Searches: styles, colors, typography, charts, icons, ux-guidelines, landing, products, prompts, platforms (iOS HIG, Android Material 3).

WHEN TO USE: DEFAULT tool for broad queries. Use when unsure which specific tool, or need multi-domain results.

PLATFORM DETECTION: Platform keywords (ios, swiftui, cupertino, android, material, jetpack compose) trigger platform-specific results with cross-platform code equivalents (Flutter_Equiv, RN_Equiv).

QUERY TIPS: Use natural language describing your design goal. System auto-detects relevant domains.

RETURNS: Results grouped by domain with relevance scores. Each domain returns its specific fields.

EXAMPLES: "modern fintech dashboard dark", "ios button design", "android navigation patterns", "e-commerce checkout ux", "startup landing complete"`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query across all design domains' },
        max_results: { type: 'number', default: 3, minimum: 1, maximum: 50, description: 'Maximum number of results per domain' }
      },
      required: ['query']
    }
  },

  // 3. Visual Design Search (merged: styles, colors, typography, prompts)
  {
    name: 'search_styles',
    description: `Search visual design elements: UI styles (70+), color palettes (100+), typography pairings (70+), and AI prompts (40+).

WHEN TO USE: Visual aesthetics, color schemes, font choices, CSS effects, design tokens.

DOMAIN FILTER (optional): style | color | typography | prompt

RETURNS: Style CSS code, color hex values with Tailwind config, font pairings with Google Fonts imports.

EXAMPLES: "glassmorphism dark mode", "fintech blue palette", "modern sans-serif pairing"`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query for visual design' },
        domain: { type: 'string', enum: ['style', 'color', 'typography', 'prompt'], description: 'Filter to specific domain' },
        max_results: { type: 'number', default: 5, minimum: 1, maximum: 50, description: 'Maximum number of results to return' }
      },
      required: ['query']
    }
  },

  // 4. UI Components Search (merged: icons, charts)
  {
    name: 'search_components',
    description: `Search UI components: Lucide icons (176+) and chart types (37+) for data visualization.

WHEN TO USE: Finding icons for UI, selecting chart types for data.

TYPE FILTER (optional): icon | chart

RETURNS: Icon import codes with JSX, chart recommendations with library suggestions.

EXAMPLES: "user profile settings icon", "time series data chart", "analytics dashboard"`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query for UI components' },
        type: { type: 'string', enum: ['icon', 'chart'], description: 'Filter to icons or charts' },
        max_results: { type: 'number', default: 5, minimum: 1, maximum: 50, description: 'Maximum number of results to return' }
      },
      required: ['query']
    }
  },

  // 5. Design Patterns Search (merged: landing, ux, products)
  {
    name: 'search_patterns',
    description: `Search design patterns: landing page layouts (60+), UX guidelines (130+), product type recommendations (117+).

WHEN TO USE: Page layouts, UX best practices, accessibility, navigation patterns.

TYPE FILTER (optional): layout | ux | product

RETURNS: Section structures, do/don't practices, conversion tips, code examples.

EXAMPLES: "hero section with CTA", "form validation best practices", "e-commerce product page"`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query for design patterns' },
        type: { type: 'string', enum: ['layout', 'ux', 'product'], description: 'Filter to layout, ux, or product' },
        max_results: { type: 'number', default: 5, minimum: 1, maximum: 50, description: 'Maximum number of results to return' }
      },
      required: ['query']
    }
  },

  // 6. Framework Stack Search
  {
    name: 'search_stack',
    description: `Search framework-specific guidelines for: flutter, jetpack-compose, html-tailwind, nextjs, nuxt-ui, nuxtjs, react-native, react, shadcn, svelte, swiftui, vue.

WHEN TO USE: Framework-specific patterns, component best practices, state management.

QUERY TIPS: Include framework name AND topic.

RETURNS: Category, Guideline, Description, Do/Don't, Code Examples, Severity, Docs URL.

EXAMPLES: "react state management", "flutter animation", "swiftui navigation"`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        stack_name: {
          type: 'string',
          enum: AVAILABLE_STACKS,
          description: 'Framework/stack name'
        },
        query: { type: 'string', description: 'Search query for guidelines' },
        max_results: { type: 'number', default: 3, minimum: 1, maximum: 50, description: 'Maximum number of results to return' }
      },
      required: ['stack_name', 'query']
    }
  },

  // 7. Platform-Specific Search (iOS HIG, Android Material 3)
  {
    name: 'search_platforms',
    description: `Search iOS Human Interface Guidelines or Android Material 3 design patterns specifically.

WHEN TO USE: iOS design patterns, SwiftUI style in Flutter, Material 3 patterns in React Native, platform-specific UI/UX.

RETURNS: Platform-specific patterns with cross-platform implementation code (Flutter_Equiv, RN_Equiv).

PARAMETERS:
- query: Search query (e.g., 'button colors navigation')
- platform_name: 'ios' or 'android' (optional, searches all if omitted)
- max_results: Number of results (default 5)

EXAMPLES: "ios navigation patterns", "android material button", "swiftui style flutter", "ios safe area", "material 3 color system"`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query for platform patterns' },
        platform_name: { type: 'string', enum: ['ios', 'android'], description: 'Platform to search (ios or android). If omitted, searches all platforms.' },
        max_results: { type: 'number', default: 5, minimum: 1, maximum: 50, description: 'Maximum number of results to return' }
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
  platform_name?: 'ios' | 'android';  // for search_platforms
  style?: string;
  mode?: 'light' | 'dark';
  domain?: 'style' | 'color' | 'typography' | 'prompt';  // for search_styles
  type?: 'icon' | 'chart' | 'layout' | 'ux' | 'product';  // for search_components and search_patterns
  platform?: 'web' | 'mobile-ios' | 'mobile-android' | 'mobile' | 'react-native' | 'flutter' | 'swiftui' | 'expo';  // for get_design_system
  output_format?: 'ai-optimized' | 'minimal' | 'full' | 'structured';  // for get_design_system output filtering
  include_hover_effects?: boolean;  // for get_design_system hover effects inclusion
}

function isSearchError(result: unknown): result is { error: string } {
  return typeof result === 'object' && result !== null && 'error' in result;
}

function handleToolCall(name: string, args: ToolArguments): CallToolResult {
  const { query, max_results, stack_name, domain, type } = args;
  let results: unknown;

  switch (name) {
    // 1. Design System Generator
    case 'get_design_system':
      results = getDesignSystem(query, args.style, args.mode, max_results ?? 1, args.platform, args.output_format, args.include_hover_effects);
      break;

    // 2. Unified Search
    case 'search_all':
      results = searchAll(query, max_results ?? 3);
      break;

    // 3. Visual Design (merged: styles, colors, typography, prompts)
    case 'search_styles':
      results = searchStyles(query, domain, max_results ?? 5);
      break;

    // 4. UI Components (merged: icons, charts)
    case 'search_components':
      results = searchComponents(query, type as 'icon' | 'chart' | undefined, max_results ?? 5);
      break;

    // 5. Design Patterns (merged: landing, ux, products)
    case 'search_patterns':
      results = searchPatterns(query, type as 'layout' | 'ux' | 'product' | undefined, max_results ?? 5);
      break;

    // 6. Framework Stack
    case 'search_stack':
      results = searchStack(stack_name, query, max_results ?? 3);
      break;

    // 7. Platform-Specific (iOS HIG, Android Material 3)
    case 'search_platforms':
      results = searchPlatforms(query, args.platform_name, max_results ?? 5);
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
