/**
 * UI/UX Pro Max MCP Tools
 * Export all tool handlers for MCP server integration
 */

export {
  // Initialization
  initializeIndexes,
  isInitialized,
  getDataStats,

  // Search Tools
  searchStyles,
  searchColors,
  searchTypography,
  searchCharts,
  searchUXGuidelines,
  searchIcons,
  searchLanding,
  searchProducts,
  searchAll,

  // Design System Generator
  getDesignSystem,

  // Domain Detection
  detectDomain,
  detectDomains,
  detectStacks,

  // Types
  type SearchResult,
  type DataStats,
  type DomainMatch,
  type DesignSystemResult
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
