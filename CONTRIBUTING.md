# Contributing to UI/UX Pro MCP

Thank you for your interest in contributing to UI/UX Pro MCP! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Ways to Contribute](#ways-to-contribute)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [CSV Data Guidelines](#csv-data-guidelines)
- [License](#license)

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ui-ux-pro-mcp.git
   cd ui-ux-pro-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Test locally with HTTP mode**
   ```bash
   npm run start:http
   ```
   The server will start on `http://localhost:3456`

5. **Test with stdio mode** (for MCP client integration)
   ```bash
   npm start
   ```

## Ways to Contribute

### Adding Design Data

The design knowledge base is stored in CSV files in the `data/` folder. You can contribute by:

- Adding new entries to existing CSV files
- Following the existing column format exactly
- Including comprehensive descriptions and practical examples
- Ensuring accuracy and relevance of information

### Improving Search

- Enhance the BM25 search algorithm in `src/search/bm25.ts`
- Add domain detection keywords in `src/tools/handlers.ts`
- Improve relevance scoring and result ranking
- Add new search features or filters

### Bug Reports

Use GitHub Issues to report bugs. Please include:

- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Environment info** (OS, Node.js version, etc.)
- **Error messages** or logs if applicable
- **Screenshots** if relevant

### Feature Requests

1. Open a GitHub Discussion first to gauge community interest
2. Describe your use case clearly
3. Propose a solution or implementation approach
4. Be open to feedback and alternative approaches

### Documentation

- Improve README clarity
- Add code comments
- Create tutorials or examples
- Fix typos or outdated information

## Code Style

This project follows these conventions:

- **TypeScript** with strict mode enabled
- **ESLint** for code linting
- **Prettier** for consistent formatting
- Meaningful variable and function names
- Clear comments for complex logic

### General Guidelines

```typescript
// ✅ Good: Descriptive names and clear structure
async function searchUIStyles(query: string, maxResults: number): Promise<SearchResult[]> {
  const normalizedQuery = query.toLowerCase().trim();
  // ... implementation
}

// ❌ Avoid: Unclear names and magic numbers
async function search(q: string): Promise<any[]> {
  const x = q.toLowerCase();
  // ... implementation
}
```

## Pull Request Process

1. **Create a feature branch from `main`**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes with clear, atomic commits**
   ```bash
   git commit -m "feat: add new glassmorphism style variations"
   git commit -m "fix: correct icon search indexing"
   ```

3. **Update documentation if needed**
   - Update README.md for new features
   - Update CHANGELOG.md with your changes
   - Add inline code comments where appropriate

4. **Verify your changes**
   ```bash
   npm run build
   npm run start:http  # Test the server
   ```

5. **Submit PR with a clear description**
   - Describe what changes you made
   - Explain why these changes are needed
   - Reference any related issues

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## CSV Data Guidelines

### Required Fields by Domain

#### styles.csv
| Field | Description |
|-------|-------------|
| STT | Sequential number |
| Style Name | Name of the UI style |
| Key Characteristics | Main visual traits |
| Colors | Color palette description |
| Effects & Textures | Visual effects used |
| Typography | Font recommendations |
| Use Cases | When to use this style |

#### colors.csv
| Field | Description |
|-------|-------------|
| Category No. | Sequential number |
| Category | Industry/domain name |
| Main Colors | Primary color hex codes |
| Accent Colors | Secondary color hex codes |
| Background | Background color options |
| Industry/Usage | Target industries |

#### typography.csv
| Field | Description |
|-------|-------------|
| STT | Sequential number |
| Pair Name | Font pairing name |
| Heading Font | Primary heading font |
| Body Font | Body text font |
| Google Fonts Import | Import URL |
| Tailwind Config | Configuration snippet |
| Best For | Recommended use cases |

#### icons.csv
| Field | Description |
|-------|-------------|
| Category | Icon category |
| Icon Name | Display name |
| Lucide Import | Import statement |
| Use Cases | When to use |
| Best For | Ideal scenarios |
| Alternatives | Similar icons |
| Accessibility | A11y considerations |

#### charts.csv
| Field | Description |
|-------|-------------|
| STT | Sequential number |
| Chart Type | Name of chart |
| Best For | Data types suited for |
| Implementation | Library/code guidance |
| Accessibility | A11y considerations |

#### ux-guidelines.csv
| Field | Description |
|-------|-------------|
| STT | Sequential number |
| Category | Guideline category |
| Guideline | The UX principle |
| Do's | Recommended practices |
| Don'ts | Anti-patterns to avoid |
| Examples | Practical examples |

#### landing.csv
| Field | Description |
|-------|-------------|
| STT | Sequential number |
| Pattern Name | Landing page pattern |
| Structure | Layout description |
| Key Elements | Required components |
| Best For | Ideal use cases |
| Examples | Real-world examples |

#### products.csv
| Field | Description |
|-------|-------------|
| STT | Sequential number |
| Product Type | Category of product |
| Design Recommendations | UI/UX guidance |
| Key Features | Essential features |
| Examples | Reference products |

#### prompts.csv
| Field | Description |
|-------|-------------|
| STT | Sequential number |
| Style/Tool | AI tool or style |
| Prompt Template | Ready-to-use prompt |
| Keywords | Key terms to include |
| Best For | Ideal use cases |

### Quality Standards

1. **Accuracy**: Ensure all information is accurate and up-to-date
2. **Completeness**: Fill all required fields with meaningful content
3. **CSV Formatting**: 
   - Escape quotes with double quotes (`""`)
   - Wrap fields containing commas in quotes
   - Use UTF-8 encoding
4. **Practical Examples**: Include real-world, actionable examples
5. **Accessibility**: Consider and document accessibility implications
6. **Consistency**: Match the style and tone of existing entries

### Testing Your Data

After adding data, test that it's properly indexed:

```bash
npm run build
npm run start:http
# In another terminal:
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "search_ui_styles", "arguments": {"query": "your new entry", "max_results": 5}}}'
```

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers get started
- Share knowledge generously

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **README.md**: For setup and usage instructions

## License

By contributing to UI/UX Pro MCP, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to UI/UX Pro MCP! Your contributions help make design knowledge more accessible to developers worldwide. 🎨
