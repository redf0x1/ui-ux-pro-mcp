/**
 * UI/UX Pro Max MCP Tools
 * Export all tool handlers for MCP server integration
 *
 * Consolidated 6-tool architecture:
 * 1. getDesignSystem - Complete design system generator
 * 2. searchAll - Unified search across all domains
 * 3. searchStyles - Visual design (styles, colors, typography, prompts)
 * 4. searchComponents - UI components (icons, charts)
 * 5. searchPatterns - Design patterns (landing, ux, products)
 * 6. searchStack - Framework-specific guidelines
 */

export {
  // Initialization
  initializeIndexes,
  isInitialized,
  getDataStats,

  // Consolidated Search Tools (6 tools)
  getDesignSystem,
  searchAll,
  searchStyles,
  searchComponents,
  searchPatterns,
  searchStack,

  // Legacy individual search functions (for backward compatibility)
  searchColors,
  searchTypography,
  searchCharts,
  searchUXGuidelines,
  searchIcons,
  searchLanding,
  searchProducts,
  searchPrompts,

  // Domain Detection
  detectDomain,
  detectDomains,
  detectStacks,

  // Types
  type SearchResult,
  type DataStats,
  type DomainMatch,
  type DesignSystemResult,
  type PlatformParameter
} from './handlers.js';

// Re-export data types for consumers
export type {
  StyleData,
  ColorData,
  TypographyData,
  ChartData,
  UXGuidelineData,
  IconData,
  LandingData,
  ProductData
} from '../data/loader.js';
