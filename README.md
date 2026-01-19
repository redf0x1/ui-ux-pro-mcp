# 🎨 UI/UX Pro MCP Server

[![npm version](https://img.shields.io/npm/v/ui-ux-pro-mcp.svg?style=flat-square)](https://www.npmjs.com/package/ui-ux-pro-mcp)
[![npm downloads](https://img.shields.io/npm/dm/ui-ux-pro-mcp.svg?style=flat-square)](https://www.npmjs.com/package/ui-ux-pro-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg?style=flat-square)](https://modelcontextprotocol.io/)
[![GitHub stars](https://img.shields.io/github/stars/redf0x1/ui-ux-pro-mcp?style=flat-square)](https://github.com/redf0x1/ui-ux-pro-mcp/stargazers)

> **AI-powered UI/UX design intelligence** — Instantly access 1519+ curated design resources through natural language search.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 📚 **1519+ Documents** | Curated design knowledge across 11 domains |
| 🔧 **11 Tools** | Specialized search for styles, colors, typography, charts, icons, and more |
| ⚡ **BM25 Ranking** | Fast, relevant search results using industry-standard text ranking |
| 🔗 **Universal** | Works with VS Code, Claude Desktop, Cursor, and any MCP-compatible client |
| 🎯 **11 Frameworks** | Stack-specific guidelines for React, Vue, Next.js, Flutter, SwiftUI, and more |

---

## 🚀 Quick Start

### Option 1: NPX (Recommended)

```bash
npx ui-ux-pro-mcp
```

### Option 2: Global Install

```bash
npm install -g ui-ux-pro-mcp
ui-ux-pro-mcp
```

### Option 3: From Source

```bash
# Clone the repository
git clone https://github.com/redf0x1/ui-ux-pro-mcp.git
cd ui-ux-pro-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run the server
npm start
```

---

## ⚙️ MCP Configuration

### VS Code / Cursor

Add to your MCP settings (`settings.json` or `mcp.json`):

#### Option A: Using NPX (Recommended - No Installation Required)

```json
{
  "mcpServers": {
    "ui-ux-pro": {
      "command": "npx",
      "args": ["ui-ux-pro-mcp", "--stdio"]
    }
  }
}
```

#### Option B: Using Global Install

```json
{
  "mcpServers": {
    "ui-ux-pro": {
      "command": "ui-ux-pro-mcp",
      "args": ["--stdio"]
    }
  }
}
```

#### Option C: From Source

```json
{
  "mcpServers": {
    "ui-ux-pro": {
      "command": "node",
      "args": [
        "/path/to/ui-ux-pro-mcp/dist/index.js",
        "--stdio"
      ]
    }
  }
}
```

**Configuration file locations:**

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Code/User/mcp.json` |
| Windows | `%APPDATA%\Code\User\mcp.json` |
| Linux | `~/.config/Code/User/mcp.json` |

### Claude Desktop

Add to your Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

#### Option A: Using NPX (Recommended - No Installation Required)

```json
{
  "mcpServers": {
    "ui-ux-pro": {
      "command": "npx",
      "args": ["ui-ux-pro-mcp", "--stdio"]
    }
  }
}
```

#### Option B: Using Global Install

```json
{
  "mcpServers": {
    "ui-ux-pro": {
      "command": "ui-ux-pro-mcp",
      "args": ["--stdio"]
    }
  }
}
```

#### Option C: From Source

```json
{
  "mcpServers": {
    "ui-ux-pro": {
      "command": "node",
      "args": [
        "/path/to/ui-ux-pro-mcp/dist/index.js",
        "--stdio"
      ]
    }
  }
}
```

---

## 🔧 Available Tools

| Tool | Documents | Description |
|------|-----------|-------------|
| `search_ui_styles` | 85 | UI design styles (Glassmorphism, Minimalism, Brutalism, etc.) with colors, effects, and use cases |
| `search_colors` | 121 | Color palettes for industries (SaaS, Healthcare, Fintech) with hex codes |
| `search_typography` | 74 | Font pairings with Google Fonts imports and Tailwind configs |
| `search_charts` | 37 | Chart types with implementation recommendations for dashboards |
| `search_ux_guidelines` | 115 | UX best practices, do's and don'ts, accessibility (WCAG) |
| `search_icons` | 176 | Curated Lucide icons with import codes and use cases |
| `search_landing` | 49 | Landing patterns, Bento Grids (Config & Maps), Responsive Strategy |
| `search_products` | 114 | Product type design recommendations per industry |
| `search_prompts` | 39 | AI prompt templates with CSS snippets and implementation checklists |
| `search_stack` | 696 | Framework-specific guidelines (React, Vue, Next.js, Flutter, etc.) |
| `search_all` | All | Unified search across all design domains |
| `get_design_system` | — | Generate complete design system with colors, typography, UI style, and layout in one call |

---

## 💬 Example Prompts

Use these with Claude, Cursor, or any MCP-compatible AI:

```
🎨 Design Systems
"What UI style works best for a fintech dashboard?"
"Give me a color palette for a healthcare app"
"Find modern font pairings for a SaaS landing page"

📊 Data Visualization
"What chart type should I use for time-series data?"
"How do I make charts accessible?"

🖥️ Landing Pages
"Show me landing page patterns for SaaS conversion"
"What sections should a pricing page have?"

📱 UX Guidelines
"What are mobile touch target best practices?"
"Show me accessibility guidelines for forms"

⚛️ Framework-Specific
"React hooks best practices"
"Vue 3 composition API patterns"
"Next.js App Router guidelines"
"Flutter state management recommendations"
```

---

## 📂 Data Sources

This server aggregates curated design intelligence from multiple domains:

| Domain | File | Count | Content |
|--------|------|-------|---------|
| Styles | `styles.csv` | 85 | UI design trends, effects, animations |
| Colors | `colors.csv` | 121 | Industry-specific color palettes |
| Typography | `typography.csv` | 74 | Font pairings and configurations |
| Charts | `charts.csv` | 37 | Data visualization recommendations |
| UX Guidelines | `ux-guidelines.csv` | 115 | Usability and accessibility best practices |
| Icons | `icons.csv` | 176 | Lucide icon recommendations |
| Landing | `landing.csv` | 49 | Patterns, Bento Layout Maps, Responsive Strategy |
| Products | `products.csv` | 114 | Industry design recommendations |
| Prompts | `prompts.csv` | 39 | AI prompt templates |
| Stacks | `stacks/*.csv` | 660 | Framework-specific guidelines (11 stacks) |

**Available Framework Stacks:**
`flutter` · `html-tailwind` · `nextjs` · `nuxt-ui` · `nuxtjs` · `react-native` · `react` · `shadcn` · `svelte` · `swiftui` · `vue`

---

## 📖 API Reference

### Common Input Parameters

All search tools accept:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | Natural language search query |
| `max_results` | number | 3 | Maximum results to return (1-50) |

### `search_stack` Additional Parameter

| Parameter | Type | Description |
|-----------|------|-------------|
| `stack_name` | string | Framework name: `react`, `vue`, `nextjs`, `flutter`, `swiftui`, etc. |

### Response Format

All tools return results in this structure:

```typescript
{
  results: Array<{
    id: string;           // Document identifier
    score: number;        // BM25 relevance score
    type: string;         // Document type (style, color, etc.)
    data: object;         // Full document data
  }>;
  total: number;          // Total results returned
  query: string;          // Original search query
}
```

### Error Response

```typescript
{
  error: string;          // Error description
}
```

---

## 🛠️ Development

### Build Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Development mode with hot reload
npm run dev

# Start production server (stdio mode)
npm start

# Start HTTP server for testing
npm run start:http
```

### Testing

```bash
# Run test suite
npm test
```

### HTTP Mode for Testing

The server can run in HTTP mode for testing without MCP clients:

```bash
# Start HTTP server on port 3456
PORT=3456 npm run start:http
```

Then test with curl:

```bash
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"search_colors","arguments":{"query":"fintech"}},"id":1}'
```

### Project Structure

```
ui-ux-pro-mcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── data/
│   │   └── loader.ts     # CSV data loading utilities
│   ├── search/
│   │   └── bm25.ts       # BM25 search implementation
│   └── tools/
│       ├── index.ts      # Tool exports
│       └── handlers.ts   # Search handlers
├── data/
│   ├── *.csv             # Design domain data files
│   └── stacks/           # Framework-specific guidelines
└── dist/                 # Compiled JavaScript output
```

---

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |
| `PORT` | `3000` | HTTP server port (when using HTTP transport) |
| `MCP_HTTP_HOST` | `localhost` | HTTP server host |

---

## 🔌 HTTP Transport Mode

For development and testing, you can run the server in HTTP mode:

```bash
# Start HTTP server
npm run start:http

# Server runs at http://localhost:3000
# SSE endpoint: GET /sse
# Message endpoint: POST /message
```

Test with curl:
```bash
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_colors","arguments":{"query":"fintech"}}}'
```

---

## ❓ Troubleshooting

### MCP Connection Issues

**"Cannot find MCP server"**
- Ensure `npm run build` completed successfully
- Check the path in your MCP config points to `dist/index.js`
- Verify Node.js is in your PATH

**"No results returned"**
- Try broader search terms
- Use `search_all` for cross-domain queries
- Check if the domain matches your query type

**"Server not responding"**
- Restart VS Code/Claude Desktop
- Check terminal for error messages
- Verify the server process is running

### Common Queries

| Need | Best Tool |
|------|----------|
| Color palettes | `search_colors` |
| UI components | `search_ui_styles` |
| Best practices | `search_ux_guidelines` |
| Icons | `search_icons` |
| Framework tips | `search_stack` |
| Everything | `search_all` |

---

## � Contact

- **Telegram**: [@redf0x1](https://t.me/redf0x1)
- **GitHub**: [@redf0x1](https://github.com/redf0x1)

---

## �📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Original Data:** Based on [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- **MCP SDK:** Built with [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)
- **Search:** BM25 ranking algorithm for relevance scoring

---

<div align="center">

**[⭐ Star this repo](https://github.com/redf0x1/ui-ux-pro-mcp)** if you find it useful!

Made with ❤️ by [redf0x1](https://github.com/redf0x1)

</div>
