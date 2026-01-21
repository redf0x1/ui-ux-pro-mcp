/**
 * MCP Tool Handlers for UI/UX Pro Max Design Search
 * Provides BM25-powered search across all design data domains
 */

import { BM25, Document } from '../search/bm25.js';
import {
  loadStyles, loadColors, loadTypography, loadCharts,
  loadUXGuidelines, loadIcons, loadLanding, loadProducts,
  loadPrompts, loadStack, loadAllStacks, getAvailableStacks,
  loadPlatform, loadAllPlatforms, getAvailablePlatforms,
  StyleData, ColorData, TypographyData, ChartData,
  UXGuidelineData, IconData, LandingData, ProductData,
  PromptData, StackData, PlatformData,
  AVAILABLE_STACKS, AVAILABLE_PLATFORMS
} from '../data/loader.js';
import { DOMAIN_MAPPINGS } from '../data/mappings.js';

// ============================================================================
// DOMAIN DETECTION
// ============================================================================

/**
 * Result of domain detection with confidence score
 */
export interface DomainMatch {
  domain: string;
  confidence: number;
}

/**
 * Keywords mapped to domains for auto-routing queries
 * Each keyword has an associated weight for confidence scoring
 * Based on original Python implementation, enhanced with weighted scoring
 */
interface KeywordEntry {
  keyword: string;
  weight: number; // 0.0 - 1.0, higher = more specific/confident
}

const domainKeywordsWeighted: Record<string, KeywordEntry[]> = {
  color: [
    { keyword: "color palette", weight: 1.0 },
    { keyword: "color scheme", weight: 1.0 },
    { keyword: "hex code", weight: 0.95 },
    { keyword: "palette", weight: 0.9 },
    { keyword: "color", weight: 0.7 },
    { keyword: "hex", weight: 0.6 },
    { keyword: "rgb", weight: 0.5 },
    { keyword: "#", weight: 0.3 }
  ],
  chart: [
    { keyword: "chart type", weight: 1.0 },
    { keyword: "data visualization", weight: 1.0 },
    { keyword: "visualization", weight: 0.9 },
    { keyword: "chart", weight: 0.85 },
    { keyword: "graph", weight: 0.8 },
    { keyword: "pie chart", weight: 0.95 },
    { keyword: "bar chart", weight: 0.95 },
    { keyword: "scatter plot", weight: 0.95 },
    { keyword: "heatmap", weight: 0.9 },
    { keyword: "funnel", weight: 0.7 },
    { keyword: "trend", weight: 0.5 },
    { keyword: "bar", weight: 0.4 },
    { keyword: "pie", weight: 0.4 },
    { keyword: "scatter", weight: 0.5 }
  ],
  landing: [
    { keyword: "landing page", weight: 1.0 },
    { keyword: "landing pattern", weight: 1.0 },
    { keyword: "hero section", weight: 0.95 },
    { keyword: "cta button", weight: 0.9 },
    { keyword: "conversion", weight: 0.8 },
    { keyword: "landing", weight: 0.75 },
    { keyword: "hero", weight: 0.7 },
    { keyword: "testimonial", weight: 0.7 },
    { keyword: "pricing section", weight: 0.8 },
    { keyword: "cta", weight: 0.6 },
    { keyword: "section", weight: 0.3 }
  ],
  product: [
    { keyword: "product type", weight: 1.0 },
    { keyword: "saas design", weight: 1.0 },
    { keyword: "ecommerce design", weight: 1.0 },
    { keyword: "fintech", weight: 0.9 },
    { keyword: "healthcare", weight: 0.85 },
    { keyword: "saas", weight: 0.8 },
    { keyword: "ecommerce", weight: 0.8 },
    { keyword: "e-commerce", weight: 0.8 },
    { keyword: "gaming", weight: 0.7 },
    { keyword: "portfolio", weight: 0.6 },
    { keyword: "crypto", weight: 0.7 },
    { keyword: "dashboard", weight: 0.6 }
  ],
  prompt: [
    { keyword: "ai prompt", weight: 1.0 },
    { keyword: "prompt template", weight: 1.0 },
    { keyword: "css snippet", weight: 0.9 },
    { keyword: "implementation checklist", weight: 0.9 },
    { keyword: "design system variable", weight: 0.85 },
    { keyword: "prompt", weight: 0.7 },
    { keyword: "checklist", weight: 0.5 },
    { keyword: "variable", weight: 0.3 }
  ],
  style: [
    { keyword: "ui style", weight: 1.0 },
    { keyword: "design style", weight: 1.0 },
    { keyword: "glassmorphism", weight: 0.95 },
    { keyword: "neumorphism", weight: 0.95 },
    { keyword: "brutalism", weight: 0.95 },
    { keyword: "minimalism", weight: 0.9 },
    { keyword: "dark mode", weight: 0.85 },
    { keyword: "flat design", weight: 0.9 },
    { keyword: "aurora", weight: 0.7 },
    { keyword: "style", weight: 0.5 },
    { keyword: "design", weight: 0.3 },
    { keyword: "ui", weight: 0.3 }
  ],
  ux: [
    { keyword: "ux guideline", weight: 1.0 },
    { keyword: "ux best practice", weight: 1.0 },
    { keyword: "usability", weight: 0.9 },
    { keyword: "accessibility", weight: 0.9 },
    { keyword: "wcag", weight: 0.95 },
    { keyword: "a11y", weight: 0.9 },
    { keyword: "ux", weight: 0.75 },
    { keyword: "user experience", weight: 0.85 },
    { keyword: "touch target", weight: 0.8 },
    { keyword: "scroll", weight: 0.4 },
    { keyword: "animation", weight: 0.4 },
    { keyword: "keyboard", weight: 0.5 },
    { keyword: "navigation", weight: 0.4 },
    { keyword: "mobile", weight: 0.3 }
  ],
  typography: [
    { keyword: "font pairing", weight: 1.0 },
    { keyword: "typography", weight: 0.9 },
    { keyword: "google fonts", weight: 0.85 },
    { keyword: "font family", weight: 0.85 },
    { keyword: "heading font", weight: 0.9 },
    { keyword: "body font", weight: 0.9 },
    { keyword: "font", weight: 0.6 },
    { keyword: "serif", weight: 0.5 },
    { keyword: "sans-serif", weight: 0.5 },
    { keyword: "sans", weight: 0.4 },
    { keyword: "heading", weight: 0.3 }
  ],
  icons: [
    { keyword: "lucide icon", weight: 1.0 },
    { keyword: "icon search", weight: 1.0 },
    { keyword: "lucide", weight: 0.95 },
    { keyword: "heroicons", weight: 0.9 },
    { keyword: "svg icon", weight: 0.9 },
    { keyword: "icons", weight: 0.8 },
    { keyword: "icon", weight: 0.7 },
    { keyword: "symbol", weight: 0.4 },
    { keyword: "glyph", weight: 0.5 },
    { keyword: "pictogram", weight: 0.6 }
  ],
  platform: [
    // iOS keywords
    { keyword: "ios guideline", weight: 1.0 },
    { keyword: "ios hig", weight: 1.0 },
    { keyword: "human interface", weight: 0.95 },
    { keyword: "apple design", weight: 0.95 },
    { keyword: "ios native", weight: 0.9 },
    { keyword: "ios pattern", weight: 0.9 },
    { keyword: "cupertino", weight: 0.85 },
    { keyword: "uikit", weight: 0.85 },
    { keyword: "ios color", weight: 0.8 },
    { keyword: "ios typography", weight: 0.8 },
    { keyword: "ios navigation", weight: 0.8 },
    { keyword: "safe area", weight: 0.75 },
    { keyword: "notch", weight: 0.7 },
    { keyword: "home indicator", weight: 0.75 },
    { keyword: "dynamic island", weight: 0.8 },
    // Android keywords
    { keyword: "android guideline", weight: 1.0 },
    { keyword: "material design", weight: 1.0 },
    { keyword: "material 3", weight: 1.0 },
    { keyword: "m3", weight: 0.95 },
    { keyword: "material you", weight: 0.95 },
    { keyword: "google design", weight: 0.9 },
    { keyword: "android native", weight: 0.9 },
    { keyword: "android pattern", weight: 0.9 },
    { keyword: "jetpack compose", weight: 0.95 },
    { keyword: "compose", weight: 0.7 },
    { keyword: "kotlin ui", weight: 0.85 },
    { keyword: "android hig", weight: 0.9 },
    { keyword: "android color", weight: 0.8 },
    { keyword: "android typography", weight: 0.8 },
    { keyword: "android navigation", weight: 0.8 },
    { keyword: "dynamic color", weight: 0.85 },
    { keyword: "tonal elevation", weight: 0.8 },
    { keyword: "material", weight: 0.6 },
    { keyword: "android", weight: 0.6 }
  ]
};

/**
 * Stack/framework detection keywords with weights
 */
const stackKeywordsWeighted: Record<string, KeywordEntry[]> = {
  react: [
    { keyword: "react hooks", weight: 1.0 },
    { keyword: "usestate", weight: 0.95 },
    { keyword: "useeffect", weight: 0.95 },
    { keyword: "usememo", weight: 0.95 },
    { keyword: "usecallback", weight: 0.95 },
    { keyword: "useref", weight: 0.95 },
    { keyword: "usecontext", weight: 0.95 },
    { keyword: "jsx", weight: 0.85 },
    { keyword: "react component", weight: 0.9 },
    { keyword: "react", weight: 0.7 }
  ],
  nextjs: [
    { keyword: "next.js", weight: 1.0 },
    { keyword: "nextjs", weight: 1.0 },
    { keyword: "app router", weight: 0.95 },
    { keyword: "server components", weight: 0.95 },
    { keyword: "server actions", weight: 0.95 },
    { keyword: "getserversideprops", weight: 0.95 },
    { keyword: "getstaticprops", weight: 0.95 },
    { keyword: "pages router", weight: 0.9 },
    { keyword: "next/image", weight: 0.9 },
    { keyword: "next/link", weight: 0.9 }
  ],
  vue: [
    { keyword: "vue 3", weight: 1.0 },
    { keyword: "vuejs", weight: 1.0 },
    { keyword: "vue.js", weight: 1.0 },
    { keyword: "composition api", weight: 0.95 },
    { keyword: "options api", weight: 0.9 },
    { keyword: "pinia", weight: 0.95 },
    { keyword: "vuex", weight: 0.9 },
    { keyword: "ref(", weight: 0.85 },
    { keyword: "reactive(", weight: 0.85 },
    { keyword: "vue", weight: 0.6 }
  ],
  svelte: [
    { keyword: "sveltekit", weight: 1.0 },
    { keyword: "svelte 5", weight: 1.0 },
    { keyword: "svelte store", weight: 0.95 },
    { keyword: "$:", weight: 0.7 },
    { keyword: "svelte", weight: 0.8 }
  ],
  flutter: [
    { keyword: "flutter widget", weight: 1.0 },
    { keyword: "flutter", weight: 0.9 },
    { keyword: "dart", weight: 0.7 },
    { keyword: "statefulwidget", weight: 0.95 },
    { keyword: "statelesswidget", weight: 0.95 },
    { keyword: "buildcontext", weight: 0.9 },
    { keyword: "widget", weight: 0.4 }
  ],
  swiftui: [
    { keyword: "swiftui", weight: 1.0 },
    { keyword: "swift ui", weight: 1.0 },
    { keyword: "ios development", weight: 0.8 },
    { keyword: "@state", weight: 0.9 },
    { keyword: "@binding", weight: 0.9 },
    { keyword: "@observedobject", weight: 0.9 },
    { keyword: "ios", weight: 0.5 }
  ],
  'react-native': [
    { keyword: "react native", weight: 1.0 },
    { keyword: "react-native", weight: 1.0 },
    { keyword: "expo", weight: 0.85 },
    { keyword: "expo router", weight: 0.95 },
    { keyword: "native module", weight: 0.8 }
  ],
  'html-tailwind': [
    { keyword: "tailwind css", weight: 1.0 },
    { keyword: "tailwindcss", weight: 1.0 },
    { keyword: "tailwind", weight: 0.85 },
    { keyword: "utility css", weight: 0.9 },
    { keyword: "utility class", weight: 0.8 },
    { keyword: "utility-first", weight: 0.9 }
  ],
  shadcn: [
    { keyword: "shadcn/ui", weight: 1.0 },
    { keyword: "shadcn", weight: 0.95 },
    { keyword: "radix ui", weight: 0.85 },
    { keyword: "radix", weight: 0.7 }
  ],
  nuxtjs: [
    { keyword: "nuxt 3", weight: 1.0 },
    { keyword: "nuxtjs", weight: 1.0 },
    { keyword: "nuxt.js", weight: 1.0 },
    { keyword: "nuxt", weight: 0.85 },
    { keyword: "usefetch", weight: 0.9 },
    { keyword: "useasyncdata", weight: 0.9 }
  ],
  'nuxt-ui': [
    { keyword: "nuxt ui", weight: 1.0 },
    { keyword: "@nuxt/ui", weight: 1.0 }
  ]
};

/**
 * Escape special regex characters in a string
 * @param str - String to escape
 * @returns Escaped string safe for use in RegExp
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a keyword matches in query with word boundary awareness
 * Handles both single words and multi-word phrases
 * @param query - Lowercased search query
 * @param keyword - Keyword to match (already lowercase)
 * @returns true if keyword matches as whole word(s)
 */
function matchesKeyword(query: string, keyword: string): boolean {
  // For multi-word keywords, use includes (they're specific enough)
  if (keyword.includes(' ')) {
    return query.includes(keyword);
  }
  // For single-word keywords, use word boundary regex to avoid false positives
  // e.g., "bar" should not match "sidebar", "pie" should not match "recipe"
  // Escape special regex characters in keyword (e.g., "ref(" contains "(")
  const escapedKeyword = escapeRegex(keyword);
  const wordBoundaryRegex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
  return wordBoundaryRegex.test(query);
}

// Legacy flat keyword map for backward compatibility
const domainKeywords: Record<string, string[]> = {
  color: ["color", "palette", "hex", "#", "rgb"],
  chart: ["chart", "graph", "visualization", "trend", "bar", "pie", "scatter", "heatmap", "funnel"],
  landing: ["landing", "page", "cta", "conversion", "hero", "testimonial", "pricing", "section"],
  product: ["saas", "ecommerce", "e-commerce", "fintech", "healthcare", "gaming", "portfolio", "crypto", "dashboard"],
  prompt: ["prompt", "css", "implementation", "variable", "checklist", "tailwind"],
  style: ["style", "design", "ui", "minimalism", "glassmorphism", "neumorphism", "brutalism", "dark mode", "flat", "aurora"],
  ux: ["ux", "usability", "accessibility", "wcag", "touch", "scroll", "animation", "keyboard", "navigation", "mobile"],
  typography: ["font", "typography", "heading", "serif", "sans"],
  icons: ["icon", "icons", "lucide", "heroicons", "symbol", "glyph", "pictogram", "svg icon"],
  platform: ["ios", "hig", "human interface", "apple design", "cupertino", "uikit", "safe area", "notch", "dynamic island", "android", "material", "material design", "material 3", "m3", "material you", "google design", "jetpack compose", "compose", "kotlin ui", "dynamic color", "tonal elevation"]
};

/**
 * Map domain names to their document type prefixes
 */
const domainToTypeMap: Record<string, string> = {
  color: 'color',
  chart: 'chart',
  landing: 'landing',
  product: 'product',
  prompt: 'prompt',
  style: 'style',
  ux: 'ux-guideline',
  typography: 'typography',
  icons: 'icon',
  platform: 'platform'
};

/**
 * Auto-detect domain from query based on keywords (legacy version for backward compatibility)
 * @param query - Search query
 * @returns Detected domain name or null if no specific domain detected
 * @deprecated Use detectDomains() for confidence-based detection
 */
export function detectDomain(query: string): string | null {
  const matches = detectDomains(query);
  if (matches.length > 0 && matches[0].confidence >= 0.3) {
    return matches[0].domain;
  }
  return null;
}

/**
 * Enhanced domain detection with confidence scoring
 * Returns multiple domain matches sorted by confidence descending
 * @param query - Search query
 * @returns Array of DomainMatch sorted by confidence (highest first), empty if no clear domain
 */
export function detectDomains(query: string): DomainMatch[] {
  const lowerQuery = query.toLowerCase();
  const domainScores: Map<string, number> = new Map();

  // Check domain keywords
  for (const [domain, keywords] of Object.entries(domainKeywordsWeighted)) {
    let maxScore = 0;
    let matchCount = 0;

    for (const { keyword, weight } of keywords) {
      if (matchesKeyword(lowerQuery, keyword)) {
        maxScore = Math.max(maxScore, weight);
        matchCount++;
      }
    }

    // Boost score slightly if multiple keywords match (max 0.1 boost)
    if (matchCount > 0) {
      const multiMatchBoost = Math.min(0.1, (matchCount - 1) * 0.03);
      const finalScore = Math.min(1.0, maxScore + multiMatchBoost);
      domainScores.set(domain, finalScore);
    }
  }

  // Convert to array and sort by confidence descending
  const results: DomainMatch[] = [];
  for (const [domain, confidence] of domainScores) {
    results.push({ domain, confidence });
  }

  results.sort((a, b) => b.confidence - a.confidence);

  // Filter out very low confidence matches (below 0.2)
  return results.filter(r => r.confidence >= 0.2);
}

/**
 * Detect framework/stack from query
 * @param query - Search query
 * @returns Array of DomainMatch with stack names, sorted by confidence descending
 */
export function detectStacks(query: string): DomainMatch[] {
  const lowerQuery = query.toLowerCase();
  const stackScores: Map<string, number> = new Map();

  for (const [stack, keywords] of Object.entries(stackKeywordsWeighted)) {
    let maxScore = 0;
    let matchCount = 0;

    for (const { keyword, weight } of keywords) {
      if (matchesKeyword(lowerQuery, keyword)) {
        maxScore = Math.max(maxScore, weight);
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const multiMatchBoost = Math.min(0.1, (matchCount - 1) * 0.03);
      const finalScore = Math.min(1.0, maxScore + multiMatchBoost);
      stackScores.set(stack, finalScore);
    }
  }

  const results: DomainMatch[] = [];
  for (const [domain, confidence] of stackScores) {
    results.push({ domain, confidence });
  }

  results.sort((a, b) => b.confidence - a.confidence);

  return results.filter(r => r.confidence >= 0.3);
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  query: string;
  originalQuery: string;
  maxResults: number;
  error?: string;
}

const DOMAIN_EXPANSION = DOMAIN_MAPPINGS;

function expandQuery(query: string): string {
  let expanded = query;
  const lowerQuery = query.toLowerCase();

  // Sort keys by length (descending) to match longer phrases first
  // e.g. match "thuong mai dien tu" before "thuong mai" if we had both
  const sortedKeys = Object.keys(DOMAIN_EXPANSION).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (lowerQuery.includes(key)) {
      const value = DOMAIN_EXPANSION[key];
      // Avoid duplicating if simpler keys already added similar terms
      // But for now, simple concatenation is requested
      expanded += ` ${value}`;
    }
  }

  if (expanded !== query) {
    console.error(`Query expanded: "${query}" -> "${expanded}"`);
  }

  return expanded;
}

/**
 * Validate and sanitize search input parameters
 * @param query - Raw search query input
 * @param maxResults - Raw max results input
 * @returns ValidationResult with sanitized values or error
 */
export function validateSearchInput(query: unknown, maxResults: unknown = 3): ValidationResult {
  // Validate query
  if (query === undefined || query === null) {
    return { valid: false, query: '', originalQuery: '', maxResults: 3, error: 'Query is required' };
  }

  const queryStr = String(query).trim();

  if (queryStr.length === 0) {
    return { valid: false, query: '', originalQuery: '', maxResults: 3, error: 'Query cannot be empty' };
  }

  if (queryStr.length > 500) {
    return { valid: false, query: '', originalQuery: '', maxResults: 3, error: 'Query exceeds maximum length of 500 characters' };
  }

  // Validate maxResults
  let maxResultsNum = 3;
  if (maxResults !== undefined && maxResults !== null) {
    maxResultsNum = Number(maxResults);

    if (!Number.isInteger(maxResultsNum) || isNaN(maxResultsNum)) {
      return { valid: false, query: queryStr, originalQuery: queryStr, maxResults: 3, error: 'max_results must be a positive integer' };
    }

    if (maxResultsNum < 1) {
      return { valid: false, query: queryStr, originalQuery: queryStr, maxResults: 3, error: 'max_results must be at least 1' };
    }

    if (maxResultsNum > 50) {
      return { valid: false, query: queryStr, originalQuery: queryStr, maxResults: 3, error: 'max_results cannot exceed 50' };
    }
  }

  return { valid: true, query: expandQuery(queryStr), originalQuery: queryStr, maxResults: maxResultsNum };
}

// BM25 Indexes for each data type
let stylesIndex: BM25 | null = null;
let colorsIndex: BM25 | null = null;
let typographyIndex: BM25 | null = null;
let chartsIndex: BM25 | null = null;
let uxGuidelinesIndex: BM25 | null = null;
let iconsIndex: BM25 | null = null;
let landingIndex: BM25 | null = null;
let productsIndex: BM25 | null = null;
let promptsIndex: BM25 | null = null;
let stackIndexes: Map<string, BM25> = new Map();
let platformIndexes: Map<string, BM25> = new Map();

// All documents for unified search
let allDocuments: Document[] = [];
let unifiedIndex: BM25 | null = null;

// Raw data storage
let stylesData: StyleData[] = [];
let colorsData: ColorData[] = [];
let typographyData: TypographyData[] = [];
let chartsData: ChartData[] = [];
let uxGuidelinesData: UXGuidelineData[] = [];
let iconsData: IconData[] = [];
let landingData: LandingData[] = [];
let productsData: ProductData[] = [];
let promptsData: PromptData[] = [];
let stacksData: Map<string, StackData[]> = new Map();
let platformsData: Map<string, PlatformData[]> = new Map();

/**
 * Create searchable content from style data
 */
function createStyleContent(style: StyleData): string {
  return [
    style['Style Category'] || '',
    style.Type || '',
    style.Keywords || '',
    style['Best For'] || '',
    style['Do Not Use For'] || '',
    style['Effects & Animation'] || '',
    style['Framework Compatibility'] || '',
    style['Era/Origin'] || '',
    style.CSS_Code || '',
    style.Motion_Config || '',
    style.Animation_Variants || ''
  ].filter(Boolean).join(' ');
}

/**
 * Create searchable content from color data
 */
function createColorContent(color: ColorData): string {
  return [
    color['Product Type'] || '',
    color.Keywords || '',
    color.Notes || '',
    color.Tailwind_Config || '',
    color.Glow_Effects || '',
    color.Dark_Mode_Colors || '',
    color.Semantic_Mapping || '',
    color.Data_Viz_Palette || '',
    color.Semantic_Tokens || ''
  ].filter(Boolean).join(' ');
}

/**
 * Create searchable content from typography data
 */
function createTypographyContent(typo: TypographyData): string {
  return [
    typo['Font Pairing Name'] || '',
    typo.Category || '',
    typo['Heading Font'] || '',
    typo['Body Font'] || '',
    typo['Mood/Style Keywords'] || '',
    typo['Best For'] || '',
    typo.Notes || ''
  ].filter(Boolean).join(' ');
}

/**
 * Create searchable content from chart data
 */
function createChartContent(chart: ChartData): string {
  return [
    chart['Data Type'] || '',
    chart.Keywords || '',
    chart['Best Chart Type'] || '',
    chart['Secondary Options'] || '',
    chart['Accessibility Notes'] || '',
    chart['Library Recommendation'] || '',
    chart.ChartJS_Config || '',
    chart.Recharts_Config || '',
    chart.Data_Schema || '',
    chart.Mock_Data_Example || ''
  ].filter(Boolean).join(' ');
}

/**
 * Create searchable content from UX guideline data
 */
function createUXGuidelineContent(ux: UXGuidelineData): string {
  return [
    ux.Category || '',
    ux.Issue || '',
    ux.Platform || '',
    ux.Description || '',
    ux.Do || '',
    ux["Don't"] || ''
  ].filter(Boolean).join(' ');
}

/**
 * Create searchable content from icon data
 */
function createIconContent(icon: IconData): string {
  return [
    icon.Category || '',
    icon['Icon Name'] || '',
    icon.Keywords || '',
    icon['Best For'] || '',
    icon.Style || '',
    icon.Animation_Class || ''
  ].filter(Boolean).join(' ');
}

/**
 * Create searchable content from landing page data
 */
function createLandingContent(landing: LandingData): string {
  return [
    landing['Pattern Name'] || '',
    landing.Keywords || '',
    landing['Section Order'] || '',
    landing['Primary CTA Placement'] || '',
    landing['Color Strategy'] || '',
    landing['Recommended Effects'] || '',
    landing['Primary CTA Placement'] || '',
    landing['Color Strategy'] || '',
    landing['Recommended Effects'] || '',
    landing['Conversion Optimization'] || '',
    landing.Layout_CSS || '',
    landing.Responsive_Strategy || '',
    landing.Grid_System_Config || '',
    landing.Bento_Layout_Map || ''
  ].filter(Boolean).join(' ');
}

/**
 * Create searchable content from product data
 */
function createProductContent(product: ProductData): string {
  return [
    product['Product Type'] || '',
    product.Keywords || '',
    product['Primary Style Recommendation'] || '',
    product['Secondary Styles'] || '',
    product['Key Considerations'] || ''
  ].filter(Boolean).join(' ');
}

/**
 * Create searchable content from prompt data
 */
function createPromptContent(prompt: PromptData): string {
  return [
    prompt['Style Category'] || '',
    prompt['AI Prompt Keywords (Copy-Paste Ready)'] || '',
    prompt['CSS/Technical Keywords'] || '',
    prompt['Implementation Checklist'] || '',
    prompt['Design System Variables'] || ''
  ].filter(Boolean).join(' ');
}

/**
 * Create searchable content from stack guideline data
 */
function createStackContent(stack: StackData): string {
  return [
    stack.Category || '',
    stack.Guideline || '',
    stack.Description || '',
    stack.Do || '',
    stack["Don't"] || '',
    stack['Code Good'] || '',
    stack['Code Bad'] || ''
  ].filter(Boolean).join(' ');
}

/**
 * Create searchable content from platform guideline data
 */
function createPlatformContent(platform: PlatformData): string {
  return [
    platform.Category || '',
    platform.Pattern || '',
    platform.Description || '',
    platform.Do || '',
    platform["Don't"] || '',
    platform.iOS_Value || '',
    platform.Flutter_Equiv || '',
    platform.RN_Equiv || ''
  ].filter(Boolean).join(' ');
}

/**
 * Initialize all BM25 indexes with loaded data
 */
export function initializeIndexes(): void {
  console.error('Initializing UI/UX Pro Max indexes...');

  // Load all data
  stylesData = loadStyles();
  colorsData = loadColors();
  typographyData = loadTypography();
  chartsData = loadCharts();
  uxGuidelinesData = loadUXGuidelines();
  iconsData = loadIcons();
  landingData = loadLanding();
  productsData = loadProducts();
  promptsData = loadPrompts();
  stacksData = loadAllStacks();
  platformsData = loadAllPlatforms();

  console.error(`Loaded: ${stylesData.length} styles, ${colorsData.length} colors, ${typographyData.length} typography, ${chartsData.length} charts, ${uxGuidelinesData.length} UX guidelines, ${iconsData.length} icons, ${landingData.length} landing patterns, ${productsData.length} products, ${promptsData.length} prompts, ${stacksData.size} stacks, ${platformsData.size} platforms`);

  // Create style documents
  const styleDocs: Document[] = stylesData.map((style, idx) => ({
    id: `style-${idx}`,
    content: createStyleContent(style),
    data: { type: 'style', ...style }
  }));

  // Create color documents
  const colorDocs: Document[] = colorsData.map((color, idx) => ({
    id: `color-${idx}`,
    content: createColorContent(color),
    data: { type: 'color', ...color }
  }));

  // Create typography documents
  const typographyDocs: Document[] = typographyData.map((typo, idx) => ({
    id: `typography-${idx}`,
    content: createTypographyContent(typo),
    data: { type: 'typography', ...typo }
  }));

  // Create chart documents
  const chartDocs: Document[] = chartsData.map((chart, idx) => ({
    id: `chart-${idx}`,
    content: createChartContent(chart),
    data: { type: 'chart', ...chart }
  }));

  // Create UX guideline documents
  const uxDocs: Document[] = uxGuidelinesData.map((ux, idx) => ({
    id: `ux-${idx}`,
    content: createUXGuidelineContent(ux),
    data: { type: 'ux-guideline', ...ux }
  }));

  // Create icon documents
  const iconDocs: Document[] = iconsData.map((icon, idx) => ({
    id: `icon-${idx}`,
    content: createIconContent(icon),
    data: { type: 'icon', ...icon }
  }));

  // Create landing documents
  const landingDocs: Document[] = landingData.map((landing, idx) => ({
    id: `landing-${idx}`,
    content: createLandingContent(landing),
    data: { type: 'landing', ...landing }
  }));

  // Create product documents
  const productDocs: Document[] = productsData.map((product, idx) => ({
    id: `product-${idx}`,
    content: createProductContent(product),
    data: { type: 'product', ...product }
  }));

  // Create prompt documents
  const promptDocs: Document[] = promptsData.map((prompt, idx) => ({
    id: `prompt-${idx}`,
    content: createPromptContent(prompt),
    data: { type: 'prompt', ...prompt }
  }));

  // Create stack documents and indexes
  stackIndexes.clear();
  const allStackDocs: Document[] = [];
  for (const [stackName, stackData] of stacksData) {
    const stackDocs: Document[] = stackData.map((item, idx) => ({
      id: `stack-${stackName}-${idx}`,
      content: createStackContent(item),
      data: { type: 'stack', stackName, ...item }
    }));
    if (stackDocs.length > 0) {
      stackIndexes.set(stackName, new BM25(stackDocs));
      allStackDocs.push(...stackDocs);
    }
  }

  // Create platform documents and indexes
  platformIndexes.clear();
  const allPlatformDocs: Document[] = [];
  for (const [platformName, platformData] of platformsData) {
    const platformDocs: Document[] = platformData.map((item, idx) => ({
      id: `platform-${platformName}-${idx}`,
      content: createPlatformContent(item),
      data: { type: 'platform', platformName, ...item }
    }));
    if (platformDocs.length > 0) {
      platformIndexes.set(platformName, new BM25(platformDocs));
      allPlatformDocs.push(...platformDocs);
    }
  }

  // Create individual indexes
  if (styleDocs.length > 0) {
    stylesIndex = new BM25(styleDocs);
  }
  if (colorDocs.length > 0) {
    colorsIndex = new BM25(colorDocs);
  }
  if (typographyDocs.length > 0) {
    typographyIndex = new BM25(typographyDocs);
  }
  if (chartDocs.length > 0) {
    chartsIndex = new BM25(chartDocs);
  }
  if (uxDocs.length > 0) {
    uxGuidelinesIndex = new BM25(uxDocs);
  }
  if (iconDocs.length > 0) {
    iconsIndex = new BM25(iconDocs);
  }
  if (landingDocs.length > 0) {
    landingIndex = new BM25(landingDocs);
  }
  if (productDocs.length > 0) {
    productsIndex = new BM25(productDocs);
  }
  if (promptDocs.length > 0) {
    promptsIndex = new BM25(promptDocs);
  }

  // Create unified index for search_all
  allDocuments = [
    ...styleDocs,
    ...colorDocs,
    ...typographyDocs,
    ...chartDocs,
    ...uxDocs,
    ...iconDocs,
    ...landingDocs,
    ...productDocs,
    ...promptDocs,
    ...allStackDocs,
    ...allPlatformDocs
  ];

  if (allDocuments.length > 0) {
    unifiedIndex = new BM25(allDocuments);
  }

  console.error('All indexes initialized successfully!');
}

// ============================================================================
// TOOL HANDLERS
// ============================================================================

export interface SearchResult {
  data: Record<string, any>;
  score: number;
}

export interface SearchError {
  error: string;
}

export type SearchResponse = SearchResult[] | SearchError;

/**
 * Search UI styles only (57 styles)
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 3)
 * @deprecated Use searchVisualDesign() for merged search across styles, colors, typography, prompts
 */
export function searchStylesOnly(query: unknown, maxResults: unknown = 3): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  if (!stylesIndex) {
    return { error: 'Styles index not initialized' };
  }

  const results = stylesIndex.search(validation.query, validation.maxResults);
  return results.map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * Merged search for visual design: styles, colors, typography, prompts
 * Combines 4 tools into 1 unified search
 * @param query - Search query
 * @param domainOrMaxResults - Optional: 'style' | 'color' | 'typography' | 'prompt' to filter by domain, OR number for maxResults (backward compat)
 * @param maxResults - Maximum results to return (default: 5)
 */
export function searchStyles(
  query: unknown,
  domainOrMaxResults?: 'style' | 'color' | 'typography' | 'prompt' | number,
  maxResults: unknown = 5
): SearchResponse {
  // Handle backward compatibility: if second arg is a number, it's maxResults
  let domain: 'style' | 'color' | 'typography' | 'prompt' | undefined;
  let effectiveMaxResults: unknown = maxResults;

  if (typeof domainOrMaxResults === 'number') {
    // Old call pattern: searchStyles(query, maxResults)
    effectiveMaxResults = domainOrMaxResults;
    domain = undefined;
  } else if (typeof domainOrMaxResults === 'string') {
    // New call pattern: searchStyles(query, domain, maxResults)
    domain = domainOrMaxResults as 'style' | 'color' | 'typography' | 'prompt';
  }

  const validation = validateSearchInput(query, effectiveMaxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  // Validate domain if provided
  if (domain && !['style', 'color', 'typography', 'prompt'].includes(domain)) {
    return { error: `Invalid domain: "${domain}". Must be one of: style, color, typography, prompt` };
  }

  const results: SearchResult[] = [];

  // Determine which domains to search
  const searchDomains = domain
    ? [domain]
    : ['style', 'color', 'typography', 'prompt'] as const;

  const resultsPerDomain = domain
    ? validation.maxResults
    : Math.max(2, Math.ceil(validation.maxResults / searchDomains.length));

  for (const d of searchDomains) {
    let domainResults: SearchResult[] = [];

    switch (d) {
      case 'style':
        if (stylesIndex) {
          domainResults = stylesIndex.search(validation.query, resultsPerDomain)
            .map(r => ({
              data: { ...r.document.data, _domain: 'style' },
              score: r.score
            }));
        }
        break;
      case 'color':
        if (colorsIndex) {
          domainResults = colorsIndex.search(validation.query, resultsPerDomain)
            .map(r => ({
              data: { ...r.document.data, _domain: 'color' },
              score: r.score
            }));
        }
        break;
      case 'typography':
        if (typographyIndex) {
          domainResults = typographyIndex.search(validation.query, resultsPerDomain)
            .map(r => ({
              data: { ...r.document.data, _domain: 'typography' },
              score: r.score
            }));
        }
        break;
      case 'prompt':
        if (promptsIndex) {
          domainResults = promptsIndex.search(validation.query, resultsPerDomain)
            .map(r => ({
              data: { ...r.document.data, _domain: 'prompt' },
              score: r.score
            }));
        }
        break;
    }

    results.push(...domainResults);
  }

  // Sort by score, limit to maxResults
  return results
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, validation.maxResults);
}

/**
 * Search color palettes (95 palettes)
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 3)
 */
export function searchColors(query: unknown, maxResults: unknown = 3): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  if (!colorsIndex) {
    return { error: 'Colors index not initialized' };
  }

  const results = colorsIndex.search(validation.query, validation.maxResults);
  return results.map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * Search typography/font pairings (56 pairings)
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 3)
 */
export function searchTypography(query: unknown, maxResults: unknown = 3): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  if (!typographyIndex) {
    return { error: 'Typography index not initialized' };
  }

  const results = typographyIndex.search(validation.query, validation.maxResults);
  return results.map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * Search chart types (24 chart types)
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 3)
 */
export function searchCharts(query: unknown, maxResults: unknown = 3): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  if (!chartsIndex) {
    return { error: 'Charts index not initialized' };
  }

  const results = chartsIndex.search(validation.query, validation.maxResults);
  return results.map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * Search UX guidelines (98 guidelines)
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 3)
 * @deprecated Use searchPatterns() for merged search across landing, UX guidelines, products
 */
export function searchUXGuidelines(query: unknown, maxResults: unknown = 3): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  if (!uxGuidelinesIndex) {
    return { error: 'UX Guidelines index not initialized' };
  }

  const results = uxGuidelinesIndex.search(validation.query, validation.maxResults);
  return results.map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * Search icons (100 icons)
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 3)
 */
export function searchIcons(query: unknown, maxResults: unknown = 3): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  if (!iconsIndex) {
    return { error: 'Icons index not initialized' };
  }

  const results = iconsIndex.search(validation.query, validation.maxResults);
  return results.map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * Merged search for UI components: icons and charts
 * Combines search across icons (100 items) and charts (24 types) with optional type filtering
 * @param query - Search query
 * @param type - Optional filter: 'icon' or 'chart'. If omitted, searches both
 * @param maxResults - Maximum results to return (default: 5)
 */
export function searchComponents(
  query: unknown,
  type?: 'icon' | 'chart',
  maxResults: unknown = 5
): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  // Validate type parameter if provided
  if (type !== undefined && type !== 'icon' && type !== 'chart') {
    return { error: `Invalid type: ${type}. Must be 'icon' or 'chart'` };
  }

  const results: Array<{ data: any; score: number; _domain: string }> = [];

  const searchTypes = type ? [type] : ['icon', 'chart'];
  const resultsPerType = type
    ? validation.maxResults
    : Math.max(2, Math.ceil(validation.maxResults / searchTypes.length));

  for (const t of searchTypes) {
    let index: BM25 | null = null;
    let domainName: string = '';

    switch (t) {
      case 'icon':
        index = iconsIndex;
        domainName = 'icon';
        break;
      case 'chart':
        index = chartsIndex;
        domainName = 'chart';
        break;
    }

    if (!index) {
      continue; // Skip if index not initialized
    }

    const typeResults = index.search(validation.query, resultsPerType);
    results.push(...typeResults.map(r => ({
      data: r.document.data,
      score: r.score,
      _domain: domainName
    })));
  }

  // Sort by score descending and limit to maxResults
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, validation.maxResults);
}

/**
 * Merged search for design patterns: landing layouts, UX guidelines, product recommendations
 * Combines 3 tools into 1 unified search
 * @param query - Search query
 * @param type - Optional filter: 'layout' | 'ux' | 'product'. If omitted, searches all three
 * @param maxResults - Maximum results to return (default: 5)
 */
export function searchPatterns(
  query: unknown,
  type?: 'layout' | 'ux' | 'product',
  maxResults: unknown = 5
): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  // Validate type parameter if provided
  if (type !== undefined && type !== 'layout' && type !== 'ux' && type !== 'product') {
    return { error: `Invalid type: ${type}. Must be 'layout', 'ux', or 'product'` };
  }

  // Detect platform intent from query for boosting layout results
  const platformResult = detectPlatformIntent(validation.originalQuery);

  const results: Array<{ data: any; score: number; _domain: string }> = [];

  const searchTypes = type ? [type] : ['layout', 'ux', 'product'];
  const resultsPerType = type
    ? validation.maxResults
    : Math.max(2, Math.ceil(validation.maxResults / searchTypes.length));

  for (const t of searchTypes) {
    let index: BM25 | null = null;
    let domainName: string = '';

    switch (t) {
      case 'layout':
        index = landingIndex;
        domainName = 'layout';
        break;
      case 'ux':
        index = uxGuidelinesIndex;
        domainName = 'ux';
        break;
      case 'product':
        index = productsIndex;
        domainName = 'product';
        break;
    }

    if (!index) {
      continue; // Skip if index not initialized
    }

    const typeResults = index.search(validation.query, resultsPerType * 2); // Get more for potential boosting

    // Apply platform boost only to layout results (which have Platform_Support)
    if (t === 'layout' && platformResult.confidence >= 0.5) {
      const boostedResults = applyPlatformBoost(
        typeResults.map(r => ({ data: r.document.data, score: r.score })),
        platformResult.platform
      );
      results.push(...boostedResults.slice(0, resultsPerType).map(r => ({
        data: r.data,
        score: r.score,
        _domain: domainName
      })));
    } else {
      results.push(...typeResults.slice(0, resultsPerType).map(r => ({
        data: r.document.data,
        score: r.score,
        _domain: domainName
      })));
    }
  }

  // Sort by score descending and limit to maxResults
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, validation.maxResults);
}

/**
 * Search landing page patterns
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 3)
 * @deprecated Use searchPatterns() for merged search across landing, UX guidelines, products
 */
export function searchLanding(query: unknown, maxResults: unknown = 3): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  if (!landingIndex) {
    return { error: 'Landing index not initialized' };
  }

  const results = landingIndex.search(validation.query, validation.maxResults);
  return results.map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * Search product type recommendations
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 3)
 * @deprecated Use searchPatterns() for merged search across landing, UX guidelines, products
 */
export function searchProducts(query: unknown, maxResults: unknown = 3): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  if (!productsIndex) {
    return { error: 'Products index not initialized' };
  }

  const results = productsIndex.search(validation.query, validation.maxResults);
  return results.map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * Unified search across all design domains
 * Uses enhanced domain auto-detection with confidence scoring to prioritize relevant results
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 10)
 */
export function searchAll(query: unknown, maxResults: unknown = 10): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  if (!unifiedIndex) {
    return { error: 'Unified index not initialized' };
  }

  // Auto-detect domains from query with confidence scores
  const detectedDomains = detectDomains(validation.query);
  const detectedStacks = detectStacks(validation.query);

  // Determine search strategy based on detection results
  const highConfidenceDomain = detectedDomains.find(d => d.confidence >= 0.7);
  const multipleDomains = detectedDomains.filter(d => d.confidence >= 0.5);

  // Get more results than needed for potential re-ranking
  const searchLimit = detectedDomains.length > 0 ? validation.maxResults * 3 : validation.maxResults;
  const results = unifiedIndex.search(validation.query, searchLimit);

  // Build metadata about detection
  const detectionMetadata: Record<string, any> = {};
  if (detectedDomains.length > 0) {
    detectionMetadata._detectedDomains = detectedDomains;
  }
  if (detectedStacks.length > 0) {
    detectionMetadata._detectedStacks = detectedStacks;
  }

  // Strategy 1: High confidence single domain - strongly prioritize that domain
  if (highConfidenceDomain) {
    const targetType = domainToTypeMap[highConfidenceDomain.domain];

    if (targetType) {
      // Separate results by domain match
      const domainResults: typeof results = [];
      const otherResults: typeof results = [];

      for (const result of results) {
        const resultType = result.document.data?.type;
        if (resultType === targetType) {
          domainResults.push(result);
        } else {
          otherResults.push(result);
        }
      }

      // Strong prioritization: fill most slots with domain results
      const domainSlots = Math.ceil(validation.maxResults * 0.8);
      const otherSlots = validation.maxResults - Math.min(domainSlots, domainResults.length);

      const prioritizedResults = [
        ...domainResults.slice(0, domainSlots),
        ...otherResults.slice(0, otherSlots)
      ].slice(0, validation.maxResults);

      return prioritizedResults.map(r => ({
        data: { ...r.document.data, ...detectionMetadata },
        score: r.score
      }));
    }
  }

  // Strategy 2: Multiple domains detected - return balanced results from each
  if (multipleDomains.length > 1) {
    const targetTypes = multipleDomains.map(d => domainToTypeMap[d.domain]).filter(Boolean);
    const resultsPerDomain = Math.max(2, Math.floor(validation.maxResults / multipleDomains.length));

    // Group results by domain
    const resultsByDomain: Map<string, typeof results> = new Map();
    const otherResults: typeof results = [];

    for (const result of results) {
      const resultType = result.document.data?.type;
      if (resultType && targetTypes.includes(resultType)) {
        const existing = resultsByDomain.get(resultType) || [];
        existing.push(result);
        resultsByDomain.set(resultType, existing);
      } else {
        otherResults.push(result);
      }
    }

    // Take top results from each domain, proportional to confidence
    const balancedResults: typeof results = [];
    for (const domainMatch of multipleDomains) {
      const targetType = domainToTypeMap[domainMatch.domain];
      const domainRes = resultsByDomain.get(targetType) || [];
      const slotsForDomain = Math.ceil(resultsPerDomain * domainMatch.confidence);
      balancedResults.push(...domainRes.slice(0, slotsForDomain));
    }

    // Fill remaining slots with other results
    const remainingSlots = validation.maxResults - balancedResults.length;
    if (remainingSlots > 0) {
      balancedResults.push(...otherResults.slice(0, remainingSlots));
    }

    // Sort by score and trim to maxResults
    balancedResults.sort((a, b) => b.score - a.score);
    const finalResults = balancedResults.slice(0, validation.maxResults);

    return finalResults.map(r => ({
      data: { ...r.document.data, ...detectionMetadata },
      score: r.score
    }));
  }

  // Strategy 3: Single low-medium confidence domain - moderate prioritization
  if (detectedDomains.length === 1 && detectedDomains[0].confidence >= 0.3) {
    const targetType = domainToTypeMap[detectedDomains[0].domain];

    if (targetType) {
      const domainResults: typeof results = [];
      const otherResults: typeof results = [];

      for (const result of results) {
        const resultType = result.document.data?.type;
        if (resultType === targetType) {
          domainResults.push(result);
        } else {
          otherResults.push(result);
        }
      }

      // Moderate prioritization based on confidence
      const domainSlots = Math.ceil(validation.maxResults * (0.5 + detectedDomains[0].confidence * 0.3));
      const otherSlots = validation.maxResults - Math.min(domainSlots, domainResults.length);

      const prioritizedResults = [
        ...domainResults.slice(0, domainSlots),
        ...otherResults.slice(0, otherSlots)
      ].slice(0, validation.maxResults);

      return prioritizedResults.map(r => ({
        data: { ...r.document.data, ...detectionMetadata },
        score: r.score
      }));
    }
  }

  // Strategy 4: No domain detected - return standard results
  return results.slice(0, validation.maxResults).map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * Search AI prompt templates
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 3)
 */
export function searchPrompts(query: unknown, maxResults: unknown = 3): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  if (!promptsIndex) {
    return { error: 'Prompts index not initialized' };
  }

  const results = promptsIndex.search(validation.query, validation.maxResults);
  return results.map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * Search framework-specific guidelines (stacks)
 * @param stackName - Stack name (react, vue, nextjs, etc.)
 * @param query - Search query
 * @param maxResults - Maximum results to return (default: 3)
 */
export function searchStack(stackName: unknown, query: unknown, maxResults: unknown = 3): SearchResponse {
  // Validate stackName
  if (stackName === undefined || stackName === null) {
    return { error: 'Stack name is required' };
  }

  const stackNameStr = String(stackName).toLowerCase().trim();

  if (!AVAILABLE_STACKS.includes(stackNameStr as any)) {
    return {
      error: `Unknown stack: "${stackNameStr}". Available stacks: ${AVAILABLE_STACKS.join(', ')}`
    };
  }

  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  const index = stackIndexes.get(stackNameStr);
  if (!index) {
    return { error: `Stack index not initialized for: ${stackNameStr}` };
  }

  const results = index.search(validation.query, validation.maxResults);
  return results.map(r => ({
    data: r.document.data,
    score: r.score
  }));
}

/**
 * List available stacks
 */
export function listAvailableStacks(): string[] {
  return getAvailableStacks();
}

/**
 * Search platform-specific guidelines (iOS HIG, etc.)
 * @param query - Search query
 * @param platformName - Optional platform name (ios). If omitted, searches all platforms
 * @param maxResults - Maximum results to return (default: 5)
 */
export function searchPlatforms(
  query: unknown,
  platformName?: string,
  maxResults: unknown = 5
): SearchResponse {
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  // If platform specified, validate and search that platform only
  if (platformName !== undefined && platformName !== null) {
    const platformNameStr = String(platformName).toLowerCase().trim();

    if (!AVAILABLE_PLATFORMS.includes(platformNameStr as any)) {
      return {
        error: `Unknown platform: "${platformNameStr}". Available platforms: ${AVAILABLE_PLATFORMS.join(', ')}`
      };
    }

    const index = platformIndexes.get(platformNameStr);
    if (!index) {
      return { error: `Platform index not initialized for: ${platformNameStr}` };
    }

    const results = index.search(validation.query, validation.maxResults);
    return results.map(r => ({
      data: r.document.data,
      score: r.score
    }));
  }

  // Search across all platforms
  const results: SearchResult[] = [];
  const resultsPerPlatform = Math.max(2, Math.ceil(validation.maxResults / platformIndexes.size));

  for (const [name, index] of platformIndexes) {
    const platformResults = index.search(validation.query, resultsPerPlatform);
    results.push(...platformResults.map(r => ({
      data: { ...r.document.data, _platform: name },
      score: r.score
    })));
  }

  // Sort by score descending and limit to maxResults
  return results
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, validation.maxResults);
}

/**
 * List available platforms
 */
export function listAvailablePlatforms(): string[] {
  return getAvailablePlatforms();
}

// ============================================================================
// STATISTICS & INFO
// ============================================================================

export interface DataStats {
  styles: number;
  colors: number;
  typography: number;
  charts: number;
  uxGuidelines: number;
  icons: number;
  landing: number;
  products: number;
  prompts: number;
  stacks: { [key: string]: number };
  platforms: { [key: string]: number };
  total: number;
}

/**
 * Get statistics about loaded data
 */
export function getDataStats(): DataStats {
  const stackStats: { [key: string]: number } = {};
  for (const [name, data] of stacksData) {
    stackStats[name] = data.length;
  }

  const platformStats: { [key: string]: number } = {};
  for (const [name, data] of platformsData) {
    platformStats[name] = data.length;
  }

  return {
    styles: stylesData.length,
    colors: colorsData.length,
    typography: typographyData.length,
    charts: chartsData.length,
    uxGuidelines: uxGuidelinesData.length,
    icons: iconsData.length,
    landing: landingData.length,
    products: productsData.length,
    prompts: promptsData.length,
    stacks: stackStats,
    platforms: platformStats,
    total: allDocuments.length
  };
}

/**
 * Check if indexes are initialized
 */
export function isInitialized(): boolean {
  return unifiedIndex !== null;
}

// ============================================================================
// DESIGN SYSTEM GENERATOR
// ============================================================================

/**
 * Page intent classification result
 */
export interface PageIntentResult {
  intent: 'landing' | 'dashboard' | 'page' | 'unknown';
  confidence: number;
  matchedKeyword: string | null;
  position: number;  // Position of keyword in query (0-indexed)
  warnings: string[];
}

/**
 * Keywords for page intent classification with weights
 */
const PAGE_INTENT_KEYWORDS: Record<string, { keywords: string[]; weight: number }[]> = {
  landing: [
    { keywords: ['landing page'], weight: 1.0 },
    { keywords: ['landing'], weight: 0.95 },
    { keywords: ['homepage', 'home page'], weight: 0.9 },
    { keywords: ['website', 'web site'], weight: 0.85 },
    { keywords: ['hero'], weight: 0.8 },
    { keywords: ['cta', 'call to action'], weight: 0.75 },
    { keywords: ['site'], weight: 0.7 },
    { keywords: ['web'], weight: 0.6 }
  ],
  dashboard: [
    { keywords: ['dashboard'], weight: 1.0 },
    { keywords: ['admin panel', 'admin dashboard'], weight: 0.95 },
    { keywords: ['analytics'], weight: 0.9 },
    { keywords: ['metrics'], weight: 0.85 },
    { keywords: ['kpi', 'kpis'], weight: 0.8 },
    { keywords: ['admin'], weight: 0.75 },
    { keywords: ['panel'], weight: 0.7 }
  ],
  page: [
    { keywords: ['page'], weight: 0.6 }
  ]
};

/**
 * Classify page intent from query using phrase-priority matching
 * Multi-word phrases have higher priority than single words
 *
 * Algorithm:
 * 1. PHASE 1: Check multi-word phrases first (higher priority)
 * 2. PHASE 2: If no phrase match, scan single words left-to-right
 * 3. Position boost: earlier position = higher confidence
 *
 * @param query - The search query to classify
 * @returns PageIntentResult with intent, confidence, matched keyword, position, and warnings
 */
export function classifyPageIntent(query: string): PageIntentResult {
  const lowerQuery = query.toLowerCase().trim();
  const warnings: string[] = [];

  // PHASE 1: Check multi-word phrases first (higher priority)
  const phraseMatches: { phrase: string; intent: string; weight: number; position: number }[] = [];

  for (const [intentType, keywordGroups] of Object.entries(PAGE_INTENT_KEYWORDS)) {
    for (const group of keywordGroups) {
      for (const keyword of group.keywords) {
        if (keyword.includes(' ')) {
          // Multi-word phrase
          const pos = lowerQuery.indexOf(keyword);
          if (pos !== -1) {
            phraseMatches.push({ phrase: keyword, intent: intentType, weight: group.weight, position: pos });
          }
        }
      }
    }
  }

  // If multi-word phrase found, use the first one (by position) with highest weight
  if (phraseMatches.length > 0) {
    // Sort by position first, then by weight (descending)
    phraseMatches.sort((a, b) => a.position - b.position || b.weight - a.weight);
    const best = phraseMatches[0];

    // Calculate position-based confidence
    const wordPosition = lowerQuery.substring(0, best.position).split(/\s+/).filter(w => w.length > 0).length;
    const positionPenalty = Math.min(0.3, wordPosition * 0.05);
    const finalConfidence = Math.max(0.3, best.weight - positionPenalty);

    return {
      intent: best.intent as PageIntentResult['intent'],
      confidence: Math.round(finalConfidence * 100) / 100,
      matchedKeyword: best.phrase,
      position: wordPosition,
      warnings
    };
  }

  // PHASE 2: Single word scan (existing logic)
  const tokens = lowerQuery.split(/\s+/);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    for (const [intentType, keywordGroups] of Object.entries(PAGE_INTENT_KEYWORDS)) {
      for (const group of keywordGroups) {
        for (const keyword of group.keywords) {
          if (!keyword.includes(' ') && token === keyword && group.weight >= 0.6) {
            const positionPenalty = Math.min(0.3, i * 0.05);
            const finalConfidence = Math.max(0.3, group.weight - positionPenalty);

            return {
              intent: intentType as PageIntentResult['intent'],
              confidence: Math.round(finalConfidence * 100) / 100,
              matchedKeyword: keyword,
              position: i,
              warnings
            };
          }
        }
      }
    }
  }

  // No strong match found
  return {
    intent: 'unknown',
    confidence: 0,
    matchedKeyword: null,
    position: -1,
    warnings: ['No page intent keywords detected in query']
  };
}

// ============================================================================
// PLATFORM INTENT DETECTION (Web vs Mobile vs Cross-Platform)
// ============================================================================

/**
 * Result of platform intent detection
 */
export interface PlatformIntentResult {
  platform: 'web' | 'mobile-ios' | 'mobile-android' | 'mobile-generic' | 'cross-platform';
  confidence: number; // 0-1
  matched_keywords: string[];
  framework?: string; // e.g., "flutter", "react-native", "swiftui"
}

/**
 * Platform-specific keywords with weights for intent detection
 * Based on 2025 research data
 */
const PLATFORM_KEYWORDS: Record<string, { keyword: string; weight: number }[]> = {
  // Web Intent Keywords (2025)
  web: [
    { keyword: 'viewport', weight: 0.7 },
    { keyword: 'responsive', weight: 0.7 },
    { keyword: 'navbar', weight: 0.7 },
    { keyword: 'header', weight: 0.6 },
    { keyword: 'footer', weight: 0.6 },
    { keyword: 'sidebar', weight: 0.7 },
    { keyword: 'hero section', weight: 0.8 },
    { keyword: 'mega menu', weight: 0.8 },
    { keyword: 'breadcrumbs', weight: 0.7 },
    { keyword: 'modal', weight: 0.5 },
    { keyword: 'popup', weight: 0.6 },
    { keyword: 'carousel', weight: 0.6 },
    { keyword: 'hover states', weight: 0.8 },
    { keyword: 'above the fold', weight: 0.8 },
    { keyword: 'page', weight: 0.4 },
    { keyword: 'sticky header', weight: 0.8 },
    { keyword: 'multi-column', weight: 0.7 },
    { keyword: 'css grid', weight: 0.7 },
    { keyword: 'media queries', weight: 0.8 },
    { keyword: 'hamburger menu', weight: 0.6 },
    { keyword: 'seo', weight: 0.8 },
    { keyword: 'lighthouse', weight: 0.9 },
    { keyword: 'web vitals', weight: 0.9 },
    { keyword: 'pwa', weight: 0.8 },
    { keyword: 'progressive web app', weight: 0.9 },
    { keyword: 'landing page', weight: 0.7 },
    { keyword: 'website', weight: 0.6 },
    { keyword: 'web app', weight: 0.7 },
    { keyword: 'browser', weight: 0.6 }
  ],
  // Mobile iOS Keywords (2025)
  'mobile-ios': [
    { keyword: 'tab bar', weight: 0.8 },
    { keyword: 'navigation bar', weight: 0.6 },
    { keyword: 'bottom sheet', weight: 0.7 },
    { keyword: 'segmented control', weight: 0.9 },
    { keyword: 'sf symbols', weight: 1.0 },
    { keyword: 'swipe gesture', weight: 0.6 },
    { keyword: 'edge swipe', weight: 0.8 },
    { keyword: 'haptic feedback', weight: 0.7 },
    { keyword: 'safe area', weight: 0.9 },
    { keyword: 'navigationstack', weight: 1.0 },
    { keyword: 'navigationlink', weight: 1.0 },
    { keyword: 'hig', weight: 0.9 },
    { keyword: 'human interface guidelines', weight: 1.0 },
    { keyword: 'pull-to-refresh', weight: 0.6 },
    { keyword: 'long-press', weight: 0.5 },
    { keyword: 'touch target', weight: 0.5 },
    { keyword: 'hit area', weight: 0.6 },
    { keyword: 'dynamic type', weight: 0.9 },
    { keyword: 'ios app', weight: 1.0 },
    { keyword: 'iphone', weight: 0.9 },
    { keyword: 'ipad', weight: 0.9 },
    { keyword: 'uikit', weight: 1.0 },
    { keyword: 'swiftui', weight: 1.0 },
    { keyword: 'ios', weight: 1.0 },
    { keyword: 'cupertino', weight: 1.0 }
  ],
  // Mobile Android Keywords (2025)
  'mobile-android': [
    { keyword: 'bottom navigation', weight: 0.8 },
    { keyword: 'navigation drawer', weight: 0.9 },
    { keyword: 'fab', weight: 0.8 },
    { keyword: 'floating action button', weight: 0.9 },
    { keyword: 'top app bar', weight: 0.9 },
    { keyword: 'snackbar', weight: 0.9 },
    { keyword: 'chips', weight: 0.6 },
    { keyword: 'material 3', weight: 1.0 },
    { keyword: 'material you', weight: 1.0 },
    { keyword: 'adaptive layouts', weight: 0.8 },
    { keyword: 'gesture navigation', weight: 0.7 },
    { keyword: 'up arrow', weight: 0.7 },
    { keyword: 'foldable', weight: 0.9 },
    { keyword: 'multi-window', weight: 0.8 },
    { keyword: 'dynamic color', weight: 0.9 },
    { keyword: 'surface', weight: 0.5 },
    { keyword: 'scaffold', weight: 0.8 },
    { keyword: 'android app', weight: 0.9 },
    { keyword: 'jetpack compose', weight: 1.0 },
    { keyword: 'material design', weight: 0.8 },
    { keyword: 'android', weight: 0.7 },
    { keyword: 'kotlin', weight: 0.8 }
  ],
  // Cross-Platform Keywords (2025)
  'cross-platform': [
    { keyword: 'react native', weight: 1.0 },
    { keyword: 'flutter', weight: 1.0 },
    { keyword: 'expo', weight: 0.9 },
    { keyword: 'kotlin multiplatform', weight: 1.0 },
    { keyword: 'cross-platform', weight: 0.9 },
    { keyword: 'shared codebase', weight: 0.9 },
    { keyword: 'hot reload', weight: 0.8 },
    { keyword: 'platform-specific', weight: 0.7 },
    { keyword: 'widget', weight: 0.5 },
    { keyword: 'component tree', weight: 0.6 },
    { keyword: 'declarative', weight: 0.5 },
    { keyword: 'state management', weight: 0.5 },
    { keyword: 'navigator', weight: 0.6 },
    { keyword: 'stack navigator', weight: 0.9 },
    { keyword: 'tab navigator', weight: 0.9 },
    { keyword: 'drawer navigator', weight: 0.9 }
  ],
  // Generic Mobile Keywords (any platform)
  'mobile-generic': [
    { keyword: 'mobile', weight: 0.6 },
    { keyword: 'app', weight: 0.4 },
    { keyword: 'native', weight: 0.6 },
    { keyword: 'touch', weight: 0.5 },
    { keyword: 'gesture', weight: 0.5 },
    { keyword: 'swipe', weight: 0.5 },
    { keyword: 'bottom tabs', weight: 0.7 },
    { keyword: 'screen', weight: 0.4 },
    { keyword: 'view', weight: 0.3 },
    { keyword: 'modal presentation', weight: 0.6 },
    { keyword: 'push navigation', weight: 0.7 },
    { keyword: 'pop navigation', weight: 0.7 },
    { keyword: 'mobile ui', weight: 0.8 },
    { keyword: 'mobile design', weight: 0.8 }
  ]
};

/**
 * Framework name mapping for detected platforms
 */
const FRAMEWORK_KEYWORDS: Record<string, { keyword: string; framework: string }[]> = {
  'mobile-ios': [
    { keyword: 'swiftui', framework: 'swiftui' },
    { keyword: 'uikit', framework: 'uikit' }
  ],
  'mobile-android': [
    { keyword: 'jetpack compose', framework: 'jetpack-compose' },
    { keyword: 'kotlin', framework: 'jetpack-compose' },
    { keyword: 'material 3', framework: 'jetpack-compose' }
  ],
  'cross-platform': [
    { keyword: 'flutter', framework: 'flutter' },
    { keyword: 'react native', framework: 'react-native' },
    { keyword: 'react-native', framework: 'react-native' },
    { keyword: 'expo', framework: 'react-native' },
    { keyword: 'kotlin multiplatform', framework: 'kotlin-multiplatform' }
  ]
};

/**
 * Detect platform intent from query using weighted keyword matching
 *
 * Algorithm:
 * 1. Scan query for platform-specific keywords with weights
 * 2. Calculate score for each platform
 * 3. Return highest scoring platform with confidence
 * 4. Default to 'web' with confidence 0.3 if no platform detected
 *
 * @param query - The search query to analyze
 * @returns PlatformIntentResult with platform, confidence, matched keywords, and optional framework
 */
export function detectPlatformIntent(query: string): PlatformIntentResult {
  const lowerQuery = query.toLowerCase();

  // Track scores and matches for each platform
  const platformScores: Map<string, { score: number; keywords: string[] }> = new Map();

  // Initialize all platforms
  for (const platform of Object.keys(PLATFORM_KEYWORDS)) {
    platformScores.set(platform, { score: 0, keywords: [] });
  }

  // Score each platform based on keyword matches
  for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
    let maxWeight = 0;
    const matchedKeywords: string[] = [];

    for (const { keyword, weight } of keywords) {
      if (matchesKeyword(lowerQuery, keyword)) {
        matchedKeywords.push(keyword);
        maxWeight = Math.max(maxWeight, weight);
      }
    }

    if (matchedKeywords.length > 0) {
      // Apply multi-match boost (max 0.15 boost)
      const multiMatchBoost = Math.min(0.15, (matchedKeywords.length - 1) * 0.05);
      const finalScore = Math.min(1.0, maxWeight + multiMatchBoost);
      platformScores.set(platform, { score: finalScore, keywords: matchedKeywords });
    }
  }

  // Find the highest scoring platform
  let bestPlatform = 'web';
  let bestScore = 0;
  let bestKeywords: string[] = [];

  for (const [platform, data] of platformScores) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestPlatform = platform;
      bestKeywords = data.keywords;
    }
  }

  // Detect framework if applicable
  let framework: string | undefined;
  const frameworkKeywords = FRAMEWORK_KEYWORDS[bestPlatform];
  if (frameworkKeywords) {
    for (const { keyword, framework: fw } of frameworkKeywords) {
      if (matchesKeyword(lowerQuery, keyword)) {
        framework = fw;
        break;
      }
    }
  }

  // If no platform detected (score is 0), default to web with low confidence
  if (bestScore === 0) {
    return {
      platform: 'web',
      confidence: 0.3,
      matched_keywords: [],
      framework: undefined
    };
  }

  return {
    platform: bestPlatform as PlatformIntentResult['platform'],
    confidence: Math.round(bestScore * 100) / 100,
    matched_keywords: bestKeywords,
    framework
  };
}

// ============================================================================
// PLATFORM CONTEXT BOOSTING
// ============================================================================

/**
 * Configuration for platform boost behavior
 */
export interface PlatformBoostConfig {
  /** Multiplier for matching platform results (default: 1.5) */
  boostFactor: number;
  /** Penalty multiplier for non-matching platform results (default: 0.5) */
  penaltyFactor: number;
  /** Enable/disable boost (default: true) */
  enabled: boolean;
}

/** Default platform boost configuration */
const DEFAULT_PLATFORM_BOOST_CONFIG: PlatformBoostConfig = {
  boostFactor: 1.5,
  penaltyFactor: 0.5,
  enabled: true
};

/**
 * Apply platform-based score boosting to search results
 *
 * Algorithm:
 * - If detected platform is "web": boost "web" and "both" results, penalize "mobile"
 * - If detected platform includes "mobile": boost "mobile" and "both" results, penalize "web"
 * - "cross-platform" detected: boost "both" results only
 * - Results are re-sorted by adjusted scores
 *
 * @param results - Array of search results with data and score
 * @param detectedPlatform - Platform from detectPlatformIntent (web, mobile-ios, mobile-android, etc.)
 * @param config - Optional configuration for boost/penalty factors
 * @returns Re-scored and re-sorted results
 */
export function applyPlatformBoost<T extends { data: Record<string, any>; score: number }>(
  results: T[],
  detectedPlatform: string,
  config: Partial<PlatformBoostConfig> = {}
): T[] {
  const { boostFactor, penaltyFactor, enabled } = { ...DEFAULT_PLATFORM_BOOST_CONFIG, ...config };

  // If boosting is disabled, return results as-is
  if (!enabled) {
    return results;
  }

  // If no platform detected or empty results, return as-is
  if (!detectedPlatform || results.length === 0) {
    return results;
  }

  // Normalize platform to category
  const isMobilePlatform = detectedPlatform.includes('mobile') ||
    detectedPlatform === 'mobile-ios' ||
    detectedPlatform === 'mobile-android' ||
    detectedPlatform === 'mobile-generic';
  const isWebPlatform = detectedPlatform === 'web';
  const isCrossPlatform = detectedPlatform === 'cross-platform';

  return results.map(result => {
    // Get Platform_Support from result data (default to 'web' for legacy data)
    const platformSupport = (result.data['Platform_Support'] || 'web').toLowerCase().trim();
    let boost = 1.0;

    if (isWebPlatform) {
      // Web platform: boost web and both, penalize mobile-only
      if (platformSupport === 'web' || platformSupport === 'both') {
        boost = boostFactor;
      } else if (platformSupport === 'mobile') {
        boost = penaltyFactor;
      }
    } else if (isMobilePlatform) {
      // Mobile platform: boost mobile and both, penalize web-only
      if (platformSupport === 'mobile' || platformSupport === 'both') {
        boost = boostFactor;
      } else if (platformSupport === 'web') {
        boost = penaltyFactor;
      }
    } else if (isCrossPlatform) {
      // Cross-platform: strongly boost 'both', slight boost to mobile, no penalty to web
      if (platformSupport === 'both') {
        boost = boostFactor;
      } else if (platformSupport === 'mobile') {
        boost = 1.2; // Slight boost for mobile
      }
      // Web remains at 1.0 (no penalty for cross-platform queries)
    }

    return {
      ...result,
      score: result.score * boost
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Check if query has conflicting intents (both landing and dashboard keywords)
 * @param query - The search query
 * @returns true if conflicting intents detected
 */
function hasConflictingIntents(query: string): boolean {
  const normalizedQuery = query.toLowerCase();

  let hasLanding = false;
  let hasDashboard = false;

  for (const group of PAGE_INTENT_KEYWORDS.landing) {
    for (const keyword of group.keywords) {
      if (normalizedQuery.includes(keyword)) {
        hasLanding = true;
        break;
      }
    }
    if (hasLanding) break;
  }

  for (const group of PAGE_INTENT_KEYWORDS.dashboard) {
    for (const keyword of group.keywords) {
      if (normalizedQuery.includes(keyword)) {
        hasDashboard = true;
        break;
      }
    }
    if (hasDashboard) break;
  }

  return hasLanding && hasDashboard;
}

/**
 * Parse Dark_Mode_Colors JSON string from colors.csv
 * Returns parsed object or null if not available
 * @param colorData - Color data record from search results
 * @returns Parsed dark mode colors object or null
 */
function parseDarkModeColors(colorData: Record<string, any>): Record<string, string> | null {
  const darkModeStr = colorData['Dark_Mode_Colors'];
  if (!darkModeStr || typeof darkModeStr !== 'string') {
    return null;
  }

  try {
    // First, try standard JSON parsing
    const parsed = JSON.parse(darkModeStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, string>;
    }
    return null;
  } catch {
    // CSV stores JS object literals like: { background: '#0A0A0A', text: '#F8FAFC', ... }
    // Convert to valid JSON: {"background":"#0A0A0A","text":"#F8FAFC",...}
    try {
      let jsonStr = darkModeStr.trim();

      // Remove outer braces if present
      if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
        jsonStr = jsonStr.slice(1, -1).trim();
      }

      const result: Record<string, string> = {};

      // Use regex to match key-value pairs: key: 'value' or key: "value" or key: #value
      // Pattern: unquoted key followed by colon, then quoted or unquoted value
      const pairRegex = /([\w-]+)\s*:\s*(?:'([^']*)'|"([^"]*)"|([^,}]+))/g;
      let match;

      while ((match = pairRegex.exec(jsonStr)) !== null) {
        const key = match[1].trim();
        // Value is in match[2] (single-quoted), match[3] (double-quoted), or match[4] (unquoted)
        const value = (match[2] || match[3] || match[4] || '').trim();
        if (key && value) {
          result[key] = value;
        }
      }

      return Object.keys(result).length > 0 ? result : null;
    } catch {
      return null;
    }
  }
}

/**
 * Calculate contrast text color based on background luminance
 * @param bgColor - Background color in hex format
 * @returns Contrast text color (dark or light)
 */
function calculateContrastText(bgColor: string): string {
  if (!bgColor || !bgColor.startsWith('#')) {
    return '#0F172A'; // Default dark text
  }
  const hex = bgColor.replace('#', '');
  // Handle both 3-digit and 6-digit hex
  const fullHex = hex.length === 3
    ? hex.split('').map(c => c + c).join('')
    : hex;
  const r = parseInt(fullHex.substr(0, 2), 16);
  const g = parseInt(fullHex.substr(2, 2), 16);
  const b = parseInt(fullHex.substr(4, 2), 16);
  // Calculate relative luminance using sRGB formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#0F172A' : '#FFFFFF';
}

/**
 * Generate CSS variables string from color palette
 * @param palette - Color palette object
 * @returns CSS variables string
 */
function generateCSSVariables(palette: Record<string, string>): string {
  const lines = [':root {'];
  for (const [key, value] of Object.entries(palette)) {
    if (value) {
      lines.push(`  --color-${key}: ${value};`);
    }
  }
  lines.push('}');
  return lines.join('\n');
}

/**
 * Implementation checklist item for AI models to track what needs to be implemented
 */
export interface ChecklistItem {
  element: string;
  required: boolean;
  status: 'must_implement' | 'recommended';
  css_location: string;
  description: string;
}

/**
 * Required element with complete ready-to-use code
 */
export interface RequiredElement {
  description: string;
  html: string;
  css: string;
  js?: string;
}

/**
 * Design System Output Interface
 */
export interface DesignSystemResult {
  _meta: {
    query_interpretation: string;
    detected_intent: 'landing' | 'dashboard' | 'page' | 'unknown';
    intent_confidence: number;
    matched_keyword: string | null;
    keyword_position: number;
    // Platform detection (web vs mobile vs cross-platform)
    detected_platform: 'web' | 'mobile-ios' | 'mobile-android' | 'mobile-generic' | 'cross-platform';
    platform_confidence: number;
    platform_keywords: string[];
    detected_framework?: string;
    // NEW: Platform specification tracking (Phase 2)
    specified_platform?: string | null;  // The platform parameter user provided (or null)
    resolved_platform?: string;           // The final platform used (specified or auto-detected)
    platform_output?: {
      safe_area_insets: string | null;
      navigation_type: string;
      primary_navigation: string;
      touch_target_min: string | null;
    };
    warnings: string[];
  };

  // Step-by-step markdown guide for AI models to follow
  markdown_guide: string;

  // Implementation guidance for AI models (placed after _meta for visibility)
  implementation_checklist: ChecklistItem[];

  required_elements: {
    back_to_top?: RequiredElement;
    navbar?: RequiredElement;
    footer?: RequiredElement;
    hero?: RequiredElement;
    cta_button?: RequiredElement;
  };

  product: Record<string, any> | null;
  style: {
    name: string;
    css_code: string;
    effects: string;
    motion_config?: string;
    animation_variants?: string;
  } | null;
  colors: {
    palette: {
      primary: string;
      secondary: string;
      cta: string;
      cta_text: string;
      background: string;
      text: string;
    };
    dark_mode?: Record<string, string>;
    tailwind_config: string;
    css_variables: string;
    glow_effects: string;
  } | null;
  typography: {
    heading: string;
    body: string;
    css_import: string;
    tailwind_config: string;
  } | null;
  layout: {
    pattern: string;
    section_order: string;
    layout_css: string;
    grid_config?: string;
    bento_map?: string;
    responsive_strategy?: string;
    source: 'landing' | 'dashboard';
  } | null;
  navigation?: {
    scroll_behavior?: string;
    sticky_config?: string;
    back_to_top?: string;
    mobile_menu?: string;
  };
  components?: {
    navbar?: string;
    footer?: string;
    section_dividers?: string;
  };
  ux_tips?: string[];
  hover_effects?: string;
  platform_guidelines?: {
    platform: 'ios' | 'android';
    patterns: {
      category: string;
      pattern: string;
      description: string;
      do: string;
      flutter_equiv: string;
      rn_equiv: string;
    }[];
  } | null;
}

/**
 * Generate a step-by-step markdown guide for AI models to follow when building a page.
 * Contains sequential numbered steps with ready-to-copy HTML, CSS, and JS code.
 *
 * @param result - The design system result object
 * @param query - Original search query
 * @param options - Options including mode and style
 * @returns Markdown formatted guide string
 */
function generateMarkdownGuide(result: any, query: string, options: { mode?: string; style?: string }): string {
  const intent = result._meta?.detected_intent || 'page';
  const mode = options?.mode || 'light';
  const style = options?.style || 'modern';

  // Simplified 7-item checklist - research shows AI models follow shorter, numbered lists better
  let guide = `# 🎨 Design System Implementation Guide

**Query:** ${query}
**Intent:** ${intent} | **Mode:** ${mode} | **Style:** ${style}

---

## ⚠️ CRITICAL: 7 Required Steps

**Complete ALL items below. Do NOT skip any.**

1. [ ] CSS Variables (Step 1)
2. [ ] Typography (Step 2)
3. [ ] Navbar (Step 3)
4. [ ] Hero Section (Step 4)
5. [ ] Back-to-Top (Step 6)
6. [ ] Footer (Step 7)
7. [ ] Hover Effects - Use \`include_hover_effects: true\` parameter or copy from Step 9

---

## Step 1: Setup CSS Variables ⚠️ REQUIRED
Add to your stylesheet:

**[COPY THIS CSS]**
\`\`\`css
${result.colors?.css_variables || ':root { /* colors not found */ }'}
\`\`\`

---

## Step 2: Import Typography ⚠️ REQUIRED
Add to your HTML <head>:

**[COPY THIS HTML]**
\`\`\`html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>${result.typography?.css_import || '/* fonts not found */'}</style>
\`\`\`

---

## Step 3: Create Navigation/Navbar ⚠️ REQUIRED
`;

  // Add navbar if exists
  if (result.required_elements?.navbar) {
    guide += `
**[COPY THIS HTML]**
\`\`\`html
${result.required_elements.navbar.html}
\`\`\`

**[COPY THIS CSS]**
\`\`\`css
${result.required_elements.navbar.css}
\`\`\`

**[COPY THIS JS]**
\`\`\`javascript
${result.required_elements.navbar.js}
\`\`\`

---

`;
  } else {
    guide += `
*Navbar code not available - search for "navbar component" separately.*

---

`;
  }

  // Add Hero section
  guide += `## Step 4: Create Hero Section ⚠️ REQUIRED
`;
  if (result.required_elements?.hero) {
    guide += `
**[COPY THIS HTML]**
\`\`\`html
${result.required_elements.hero.html}
\`\`\`

**[COPY THIS CSS]**
\`\`\`css
${result.required_elements.hero.css}
\`\`\`

---

`;
  } else {
    guide += `
*Hero section code not available - search for "hero section" separately.*

---

`;
  }

  // Add style (glassmorphism, etc)
  if (result.style?.css_code) {
    guide += `## Step 5: Apply ${result.style.name || 'Design'} Style

**[COPY THIS CSS]**
\`\`\`css
${result.style.css_code}
\`\`\`

---

`;
  }

  // BACK TO TOP - mark prominently
  guide += `## Step 6: Add Back-to-Top Button ⚠️ REQUIRED
This button improves UX on long pages. Users expect this functionality.

`;
  if (result.required_elements?.back_to_top) {
    guide += `
**[COPY THIS HTML]** (Add before closing </body> tag)
\`\`\`html
${result.required_elements.back_to_top.html}
\`\`\`

**[COPY THIS CSS]**
\`\`\`css
${result.required_elements.back_to_top.css}
\`\`\`

**[COPY THIS JS]**
\`\`\`javascript
${result.required_elements.back_to_top.js}
\`\`\`

---

`;
  } else {
    guide += `
*Back-to-top button code not available in current result.*

---

`;
  }

  // Footer
  guide += `## Step 7: Create Footer ⚠️ REQUIRED
`;
  if (result.required_elements?.footer) {
    guide += `
**[COPY THIS HTML]**
\`\`\`html
${result.required_elements.footer.html}
\`\`\`

**[COPY THIS CSS]**
\`\`\`css
${result.required_elements.footer.css}
\`\`\`

---

`;
  } else {
    guide += `
*Footer code not available - search for "footer component" separately.*

---

`;
  }

  // Layout sections from layout.section_order
  if (result.layout?.section_order) {
    guide += `## Step 8: Page Section Order
Follow this order for your page sections:

${result.layout.section_order.split('|').map((s: string, i: number) => `${i+1}. ${s.trim()}`).join('\n')}

**[COPY THIS CSS]**
\`\`\`css
${result.layout.layout_css || '/* layout CSS */'}
\`\`\`

---

`;
  }

  // Summary checklist
  guide += `## ✅ Implementation Checklist

Complete all steps below:

`;
  if (result.implementation_checklist && result.implementation_checklist.length > 0) {
    result.implementation_checklist.forEach((item: any) => {
      const marker = item.status === 'must_implement' ? '⚠️' : '💡';
      guide += `- [ ] ${marker} **${item.element}** — ${item.description}\n`;
    });
  } else {
    guide += `- [ ] ⚠️ **CSS Variables** — Add color variables to stylesheet\n`;
    guide += `- [ ] ⚠️ **Typography** — Import and apply fonts\n`;
    guide += `- [ ] ⚠️ **Navbar** — Create navigation component\n`;
    guide += `- [ ] ⚠️ **Hero** — Build hero section\n`;
    guide += `- [ ] ⚠️ **Footer** — Add footer component\n`;
    guide += `- [ ] ⚠️ **Back to Top** — Add scroll-to-top button (REQUIRED)\n`;
    guide += `- [ ] ⚠️ **Hover Effects** — Add micro-interactions (Step 9)\n`;
  }

  guide += `
---

## 🎯 Quick Reference

| Element | CSS Location |
|---------|--------------|
| Colors | \`colors.css_variables\` |
| Typography | \`typography.css_import\` |
| Navbar | \`required_elements.navbar\` |
| Hero | \`required_elements.hero\` |
| Back to Top | \`required_elements.back_to_top\` |
| Footer | \`required_elements.footer\` |
| Style Effects | \`style.css_code\` |
| Hover Effects | \`hover_effects\` |
`;

  // Step 9: Add Hover Effects
  guide += `
---

## Step 9: Add Hover Effects ⚠️ REQUIRED
Copy the entire \`hover_effects\` CSS block into your stylesheet for interactive micro-interactions:

- **Social icons** change to brand colors on hover (Twitter blue, GitHub dark, LinkedIn blue, etc.)
- **Pricing cards** lift on hover, "Most Popular" card is highlighted and scaled
- **Feature cards** have lift effect with icon scaling
- **All buttons** have micro-interactions (translateY + shadow)
- **Navigation links** have animated underline on hover
- **Testimonial cards** lift on hover
- **FAQ/Accordion items** have subtle background change on hover

**[COPY THIS CSS]**
\`\`\`css
${result.hover_effects || '/* hover_effects not available */'}
\`\`\`
`;

  return guide;
}

/**
 * Platform-specific output adjustments helper
 * Provides platform-appropriate configurations for navigation, touch targets, etc.
 * Will be enhanced in Phase 3+ for full platform-specific design tokens
 *
 * @param platform - The resolved platform (web, mobile-ios, mobile-android, etc.)
 * @param colors - Color configuration (for future enhancements)
 * @param typography - Typography configuration (for future enhancements)
 * @returns Platform-specific output configuration
 */
function getPlatformSpecificOutput(
  platform: string,
  colors: DesignSystemResult['colors'],
  typography: DesignSystemResult['typography']
): {
  safe_area_insets: string | null;
  navigation_type: string;
  primary_navigation: string;
  touch_target_min: string | null;
} {
  const isWeb = platform === 'web';
  const isIOS = platform === 'mobile-ios';
  const isAndroid = platform === 'mobile-android';

  return {
    safe_area_insets: !isWeb ? 'env(safe-area-inset-top), env(safe-area-inset-bottom)' : null,
    navigation_type: !isWeb ? 'stack' : 'page-based',
    primary_navigation: isIOS ? 'tab-bar' :
                        isAndroid ? 'bottom-navigation' :
                        'navbar',
    touch_target_min: !isWeb ? '44px' : null,
  };
}

/**
 * Valid platform values for explicit platform parameter
 */
export type PlatformParameter = 'web' | 'mobile-ios' | 'mobile-android' | 'mobile' | 'react-native' | 'flutter' | 'swiftui' | 'expo';

/**
 * Map user-specified platform parameter to internal platform type
 */
function mapPlatformParameter(platform: PlatformParameter): PlatformIntentResult['platform'] {
  const platformMap: Record<PlatformParameter, PlatformIntentResult['platform']> = {
    'web': 'web',
    'mobile-ios': 'mobile-ios',
    'mobile-android': 'mobile-android',
    'mobile': 'mobile-generic',
    'react-native': 'cross-platform',
    'flutter': 'cross-platform',
    'swiftui': 'mobile-ios',
    'expo': 'cross-platform'
  };
  return platformMap[platform] || 'web';
}

/**
 * Map user-specified platform parameter to framework if applicable
 */
function mapPlatformToFramework(platform: PlatformParameter): string | undefined {
  const frameworkMap: Record<string, string> = {
    'react-native': 'react-native',
    'flutter': 'flutter',
    'swiftui': 'swiftui',
    'expo': 'react-native'
  };
  return frameworkMap[platform];
}

/**
 * Generate a complete design system by combining styles, colors, typography, and layout patterns.
 * This is a synthesis tool that searches multiple domains and composes results into a unified design system.
 *
 * @param query - Product type or design description (e.g., "fintech dark", "saas minimal")
 * @param style - Optional specific style preference (e.g., "glassmorphism", "minimalism")
 * @param mode - Optional color mode preference ("light" or "dark")
 * @param maxResults - Maximum items per domain (default: 1)
 * @param platform - Optional target platform to override auto-detection
 * @returns Unified design system object or error
 */
export function getDesignSystem(
  query: unknown,
  style?: unknown,
  mode?: unknown,
  maxResults: unknown = 1,
  platform?: unknown,
  outputFormat?: unknown,
  includeHoverEffects?: unknown
): DesignSystemResult | SearchError {
  // Validate query
  const validation = validateSearchInput(query, maxResults);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  // Validate mode if provided
  const modeStr = mode ? String(mode).toLowerCase() : undefined;
  if (modeStr && modeStr !== 'light' && modeStr !== 'dark') {
    return { error: 'mode must be either "light" or "dark"' };
  }

  // Validate style if provided
  const styleStr = style ? String(style).trim() : undefined;

  // Validate platform if provided
  const validPlatforms: PlatformParameter[] = ['web', 'mobile-ios', 'mobile-android', 'mobile', 'react-native', 'flutter', 'swiftui', 'expo'];
  const platformStr = platform ? String(platform).toLowerCase() as PlatformParameter : undefined;
  if (platformStr && !validPlatforms.includes(platformStr)) {
    return { error: `platform must be one of: ${validPlatforms.join(', ')}` };
  }

  // Validate output_format if provided
  const validFormats = ['ai-optimized', 'minimal', 'full', 'structured'];
  const formatStr = outputFormat ? String(outputFormat).toLowerCase() : undefined;
  if (formatStr && !validFormats.includes(formatStr)) {
    return { error: `output_format must be one of: ${validFormats.join(', ')}` };
  }

  // Build search queries based on input
  const baseQuery = validation.query;
  const originalQuery = validation.originalQuery;
  const modeQuery = modeStr ? `${baseQuery} ${modeStr} mode` : baseQuery;
  const styleQuery = styleStr ? `${baseQuery} ${styleStr}` : baseQuery;

  // NEW: Classify page intent (left-to-right scanning)
  const intentResult = classifyPageIntent(validation.originalQuery);

  // Auto-detect platform intent from query - ALWAYS detect from keywords
  const autoDetectedPlatform = detectPlatformIntent(validation.originalQuery);

  // NEW: Separate design platform (iOS/Android from keywords) from output framework (flutter/RN from param)
  // Design platform = what design language to use (iOS HIG, Material Design)
  // Output framework = what code format to output (Flutter, React Native, SwiftUI)
  const specifiedPlatform = platformStr || null;
  
  // For cross-platform frameworks (flutter, react-native, expo), use query keyword detection for design platform
  // This allows "SwiftUI style" + platform="flutter" to detect iOS design with Flutter output
  const isCrossPlatformFramework = platformStr && ['flutter', 'react-native', 'expo'].includes(platformStr);
  
  // Resolved platform: For cross-platform frameworks, use keyword detection; otherwise use specified platform
  const resolvedPlatform: PlatformIntentResult['platform'] = isCrossPlatformFramework
    ? autoDetectedPlatform.platform  // Use keyword detection (e.g., SwiftUI → mobile-ios)
    : (platformStr ? mapPlatformParameter(platformStr) : autoDetectedPlatform.platform);
  
  // Framework: Use specified framework, or infer from platform parameter
  const resolvedFramework = platformStr
    ? mapPlatformToFramework(platformStr) || autoDetectedPlatform.framework
    : autoDetectedPlatform.framework;
  
  // Confidence: For cross-platform frameworks, use keyword detection confidence
  const platformConfidence = isCrossPlatformFramework
    ? autoDetectedPlatform.confidence
    : (platformStr ? 1.0 : autoDetectedPlatform.confidence);
  
  // Keywords: ALWAYS include query keywords, plus specified platform if any
  const platformKeywords = [
    ...autoDetectedPlatform.matched_keywords,
    ...(platformStr && !autoDetectedPlatform.matched_keywords.includes(platformStr) ? [platformStr] : [])
  ];

  // NEW: Build _meta object - use original query for display, not expanded query
  const meta: DesignSystemResult['_meta'] & {
    specified_platform: string | null;
    resolved_platform: string;
    platform_output: ReturnType<typeof getPlatformSpecificOutput>;
  } = {
    query_interpretation: `${originalQuery}${styleStr ? ` with ${styleStr}` : ''}${modeStr ? ` (${modeStr} mode)` : ''}${platformStr ? ` [platform: ${platformStr}]` : ''}`,
    detected_intent: intentResult.intent,
    intent_confidence: intentResult.confidence,
    matched_keyword: intentResult.matchedKeyword,
    keyword_position: intentResult.position,
    // Platform detection results
    detected_platform: resolvedPlatform,
    platform_confidence: platformConfidence,
    platform_keywords: platformKeywords,
    detected_framework: resolvedFramework,
    // NEW: Platform specification tracking
    specified_platform: specifiedPlatform,
    resolved_platform: resolvedPlatform,
    platform_output: getPlatformSpecificOutput(resolvedPlatform, null, null),
    warnings: [...intentResult.warnings]
  };

  // Add warning if both landing and dashboard keywords found
  if (hasConflictingIntents(validation.query)) {
    meta.warnings.push('Query mentions both landing and dashboard - using first detected intent');
  }

  // Fetch platform-specific guidelines if mobile platform detected
  let platformGuidelines: DesignSystemResult['platform_guidelines'] = null;
  if (resolvedPlatform === 'mobile-ios' && platformIndexes.has('ios')) {
    const platformResults = searchPlatforms(baseQuery, 'ios', 5);
    if (Array.isArray(platformResults) && platformResults.length > 0) {
      platformGuidelines = {
        platform: 'ios',
        patterns: platformResults.map((r: any) => ({
          category: r.data.Category || '',
          pattern: r.data.Pattern || '',
          description: r.data.Description || '',
          do: r.data.Do || '',
          flutter_equiv: r.data.Flutter_Equiv || '',
          rn_equiv: r.data.RN_Equiv || ''
        }))
      };
    }
  }
  // Similar for Android
  if (resolvedPlatform === 'mobile-android' && platformIndexes.has('android')) {
    const platformResults = searchPlatforms(baseQuery, 'android', 5);
    if (Array.isArray(platformResults) && platformResults.length > 0) {
      platformGuidelines = {
        platform: 'android',
        patterns: platformResults.map((r: any) => ({
          category: r.data.Category || '',
          pattern: r.data.Pattern || '',
          description: r.data.Description || '',
          do: r.data.Do || '',
          flutter_equiv: r.data.Flutter_Equiv || '',
          rn_equiv: r.data.RN_Equiv || ''
        }))
      };
    }
  }

  // 1. Search products domain
  let productResult: Record<string, any> | null = null;
  if (productsIndex) {
    const productResults = productsIndex.search(baseQuery, validation.maxResults);
    if (productResults.length > 0) {
      productResult = productResults[0].document.data;
    }
  }

  // Extract style hint from product if no explicit style provided
  let inferredStyle = styleStr;
  if (!inferredStyle && productResult) {
    // Try to extract style from product's primary style recommendation
    const primaryStyle = productResult['Primary Style Recommendation'];
    if (primaryStyle) {
      inferredStyle = primaryStyle;
    }
  }

  // 2. Search styles domain
  let styleResult: DesignSystemResult['style'] = null;
  if (stylesIndex) {
    const searchStyleQuery = inferredStyle || styleQuery;
    const styleResults = stylesIndex.search(searchStyleQuery, validation.maxResults);
    if (styleResults.length > 0) {
      const styleData = styleResults[0].document.data;
      styleResult = {
        name: styleData['Style Category'] || styleData['Type'] || 'Unknown',
        css_code: styleData['CSS_Code'] || '',
        effects: styleData['Effects & Animation'] || '',
        motion_config: styleData['Motion_Config'] || '',
        animation_variants: styleData['Animation_Variants'] || ''
      };
    }
  }

  // 3. Search colors domain (ENHANCED with dark mode support)
  let colorsResult: DesignSystemResult['colors'] = null;
  if (colorsIndex) {
    const colorQuery = modeQuery;
    const colorResults = colorsIndex.search(colorQuery, validation.maxResults);
    if (colorResults.length > 0) {
      const colorData = colorResults[0].document.data;

      // Parse Semantic_Tokens for cta_text (accent-foreground)
      let ctaTextFromTokens: string | undefined;
      if (colorData['Semantic_Tokens']) {
        try {
          const tokens = JSON.parse(colorData['Semantic_Tokens']);
          ctaTextFromTokens = tokens['accent-foreground'] || tokens['cta_text'];
        } catch (e) {
          // Will use fallback calculation
        }
      }

      const ctaColor = colorData['CTA (Hex)'] || '';

      // Build initial palette
      let palette = {
        primary: colorData['Primary (Hex)'] || '',
        secondary: colorData['Secondary (Hex)'] || '',
        cta: ctaColor,
        cta_text: ctaTextFromTokens || calculateContrastText(ctaColor),
        background: colorData['Background (Hex)'] || '',
        text: colorData['Text (Hex)'] || ''
      };

      // Parse dark mode colors if mode is dark
      let darkModeColors: Record<string, string> | undefined;
      if (modeStr === 'dark' && colorData['Dark_Mode_Colors']) {
        const parsedDark = parseDarkModeColors(colorData);
        if (parsedDark) {
          darkModeColors = parsedDark;
          // Replace palette with dark mode colors where available
          const darkCta = parsedDark.cta || parsedDark.CTA || parsedDark.accent || parsedDark.Accent || palette.cta;
          palette = {
            primary: parsedDark.primary || parsedDark.Primary || palette.primary,
            secondary: parsedDark.secondary || parsedDark.Secondary || palette.secondary,
            background: parsedDark.bg || parsedDark.background || parsedDark.Background || palette.background,
            text: parsedDark.text || parsedDark.Text || palette.text,
            cta: darkCta,
            cta_text: parsedDark.cta_text || parsedDark['accent-foreground'] || calculateContrastText(darkCta)
          };
        }
      }

      colorsResult = {
        palette,
        dark_mode: darkModeColors,
        tailwind_config: colorData['Tailwind_Config'] || '',
        css_variables: generateCSSVariables(palette),
        glow_effects: colorData['Glow_Effects'] || ''
      };
    }
  }

  // 4. Search typography domain
  let typographyResult: DesignSystemResult['typography'] = null;
  if (typographyIndex) {
    // Use style/mood as hint for typography search
    const typoQuery = inferredStyle ? `${baseQuery} ${inferredStyle}` : baseQuery;
    const typoResults = typographyIndex.search(typoQuery, validation.maxResults);
    if (typoResults.length > 0) {
      const typoData = typoResults[0].document.data;
      typographyResult = {
        heading: typoData['Heading Font'] || '',
        body: typoData['Body Font'] || '',
        css_import: typoData['CSS Import'] || '',
        tailwind_config: typoData['Tailwind Config'] || ''
      };
    }
  }

  // 5. Search layout based on INTENT
  let layoutResult: DesignSystemResult['layout'] = null;
  const layoutSource: 'landing' | 'dashboard' =
    intentResult.intent === 'dashboard' ? 'dashboard' : 'landing';

  if (layoutSource === 'dashboard') {
    // Search products for dashboard-style layout
    if (productsIndex) {
      const dashboardQuery = `${baseQuery} dashboard`;
      const dashResults = productsIndex.search(dashboardQuery, validation.maxResults);
      if (dashResults.length > 0) {
        const dashData = dashResults[0].document.data;
        layoutResult = {
          pattern: dashData['Dashboard Style'] || dashData['Pattern Name'] || 'Dashboard',
          section_order: dashData['Key Components'] || dashData['Section Order'] || '',
          layout_css: dashData['Layout_CSS'] || '',
          grid_config: dashData['Grid_System_Config'] || '',
          bento_map: dashData['Bento_Layout_Map'] || '',
          responsive_strategy: dashData['Responsive_Strategy'] || '',
          source: 'dashboard'
        };
      }
    }
  }

  // Fallback to landing or if intent is landing
  if (!layoutResult && landingIndex) {
    // Intent-aware query modification: remove dashboard-related terms when intent is "landing"
    // This prevents BM25 from returning dashboard-style layouts due to keyword matching
    let landingSearchQuery = baseQuery;
    if (intentResult.intent === 'landing') {
      landingSearchQuery = baseQuery
        .replace(/\b(dashboard|analytics|kpi|admin|panel|metrics|widget|charts)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      // If query becomes too short after removing terms, add landing-specific terms
      // But avoid adding "landing" if it already exists in the query
      const words = landingSearchQuery.split(' ').filter(w => w.length > 0);
      if (words.length < 3 && !landingSearchQuery.toLowerCase().includes('landing')) {
        landingSearchQuery += ' landing hero features';
      } else if (words.length < 2) {
        // Extremely short query - add meaningful terms
        landingSearchQuery = 'landing page hero features cta';
      }
    }
    const landingResults = landingIndex.search(landingSearchQuery, validation.maxResults * 2); // Get more for boosting

    // Apply platform boost to re-rank results based on Platform_Support
    const boostedLandingResults = applyPlatformBoost(
      landingResults.map(r => ({ data: r.document.data, score: r.score })),
      resolvedPlatform
    );

    if (boostedLandingResults.length > 0) {
      const landingData = boostedLandingResults[0].data;
      layoutResult = {
        pattern: landingData['Pattern Name'] || '',
        section_order: landingData['Section Order'] || '',
        layout_css: landingData['Layout_CSS'] || '',
        grid_config: landingData['Grid_System_Config'] || '',
        bento_map: landingData['Bento_Layout_Map'] || '',
        responsive_strategy: landingData['Responsive_Strategy'] || '',
        source: 'landing'
      };
    }
  }

  // 6. Search for navigation patterns from styles
  const navigation: DesignSystemResult['navigation'] = {};
  if (stylesIndex) {
    const navQuery = 'navigation scroll sticky header back to top mobile menu hamburger';
    const navResults = stylesIndex.search(navQuery, 10);

    for (const result of navResults) {
      const styleData = result.document.data;
      const name = (styleData['Style Category'] || styleData['Type'] || '').toLowerCase();
      const keywords = (styleData['Keywords'] || '').toLowerCase();
      const cssCode = styleData['CSS_Code'] || '';

      // Match scroll-reactive behavior
      if ((name.includes('scroll') || keywords.includes('scroll-reactive') || keywords.includes('scroll behavior')) && !navigation.scroll_behavior) {
        navigation.scroll_behavior = cssCode;
      }
      // Match sticky navigation
      else if ((name.includes('sticky') || keywords.includes('sticky nav') || keywords.includes('fixed nav')) && !navigation.sticky_config) {
        navigation.sticky_config = cssCode;
      }
      // Match back to top
      else if ((name.includes('back to top') || keywords.includes('back-to-top') || keywords.includes('scroll to top')) && !navigation.back_to_top) {
        navigation.back_to_top = cssCode;
      }
      // Match mobile menu/hamburger
      else if ((name.includes('mobile') || name.includes('hamburger') || keywords.includes('mobile menu') || keywords.includes('hamburger')) && !navigation.mobile_menu) {
        navigation.mobile_menu = cssCode;
      }
    }
  }

  // 7. Search for component CSS patterns from styles
  const components: DesignSystemResult['components'] = {};
  if (stylesIndex) {
    const componentQuery = `${baseQuery} navbar footer section divider component`;
    const componentResults = stylesIndex.search(componentQuery, 10);

    for (const result of componentResults) {
      const styleData = result.document.data;
      const type = (styleData['Type'] || '').toLowerCase();
      const name = (styleData['Style Category'] || '').toLowerCase();
      const cssCode = styleData['CSS_Code'] || '';

      // Match navbar
      if ((type === 'component' && name.includes('nav')) || name.includes('navbar')) {
        if (!components.navbar) components.navbar = cssCode;
      }
      // Match footer
      else if (name.includes('footer')) {
        if (!components.footer) components.footer = cssCode;
      }
      // Match section dividers
      else if (name.includes('divider') || name.includes('separator') || name.includes('section')) {
        if (!components.section_dividers) components.section_dividers = cssCode;
      }
    }
  }

  // 8. Search for UX tips/guidelines
  const uxTips: string[] = [];
  if (uxGuidelinesIndex) {
    const uxQuery = 'navigation scroll animation interaction accessibility mobile responsive';
    const uxResults = uxGuidelinesIndex.search(uxQuery, 8);

    for (const result of uxResults.slice(0, 5)) {
      const uxData = result.document.data;
      const category = uxData['Category'] || '';
      const guideline = uxData['Issue'] || uxData['Guideline'] || '';
      const doAdvice = uxData['Do'] || '';
      const dontAdvice = uxData["Don't"] || '';

      if (category && guideline) {
        let tip = `[${category}] ${guideline}`;
        if (doAdvice) tip += ` - DO: ${doAdvice}`;
        if (dontAdvice) tip += ` - DON'T: ${dontAdvice}`;
        uxTips.push(tip);
      }
    }
  }

  // 9. BUILD IMPLEMENTATION CHECKLIST (dynamic based on intent and layout)
  const checklist: ChecklistItem[] = [];

  // Always include for landing pages
  if (intentResult.intent === 'landing' || intentResult.intent === 'page') {
    checklist.push({
      element: 'Hero Section',
      required: true,
      status: 'must_implement',
      css_location: 'style.css_code',
      description: 'Hero with headline, CTA button, and optional image'
    });

    checklist.push({
      element: 'CTA Button',
      required: true,
      status: 'must_implement',
      css_location: 'colors.palette.cta + colors.palette.cta_text',
      description: 'Primary call-to-action button with proper contrast colors'
    });

    if (navigation?.back_to_top) {
      checklist.push({
        element: 'Back to Top Button',
        required: true,
        status: 'must_implement',
        css_location: 'navigation.back_to_top',
        description: 'Fixed button appears after scrolling 300px - REQUIRED for long pages'
      });
    }

    if (navigation?.sticky_config) {
      checklist.push({
        element: 'Sticky Navigation',
        required: false,
        status: 'recommended',
        css_location: 'navigation.sticky_config',
        description: 'Header that stays fixed on scroll'
      });
    }

    if (components?.navbar) {
      checklist.push({
        element: 'Navbar',
        required: true,
        status: 'must_implement',
        css_location: 'components.navbar',
        description: 'Navigation bar with logo, links, and optional CTA'
      });
    }

    if (components?.footer) {
      checklist.push({
        element: 'Footer',
        required: true,
        status: 'must_implement',
        css_location: 'components.footer',
        description: 'Footer with columns, links, social icons'
      });
    }

    if (layoutResult?.section_order) {
      // Parse section order and add checklist items
      const sections = layoutResult.section_order.split(',').map(s => s.trim()).filter(Boolean);
      sections.forEach((section, index) => {
        if (section.toLowerCase() !== 'hero') { // Hero already added
          checklist.push({
            element: section,
            required: index < 3, // First 3 sections are required
            status: index < 3 ? 'must_implement' : 'recommended',
            css_location: 'layout.layout_css',
            description: `Section ${index + 1}: ${section}`
          });
        }
      });
    }
  }

  // Dashboard-specific checklist items
  if (intentResult.intent === 'dashboard') {
    checklist.push({
      element: 'Sidebar Navigation',
      required: true,
      status: 'must_implement',
      css_location: 'layout.layout_css',
      description: 'Left sidebar with navigation links and icons'
    });

    checklist.push({
      element: 'Dashboard Grid',
      required: true,
      status: 'must_implement',
      css_location: 'layout.grid_config',
      description: 'Responsive grid layout for dashboard cards/widgets'
    });

    if (layoutResult?.bento_map) {
      checklist.push({
        element: 'Bento Layout',
        required: false,
        status: 'recommended',
        css_location: 'layout.bento_map',
        description: 'Modern bento-style grid for visual hierarchy'
      });
    }
  }

  // Always add typography and colors as checklist items
  if (typographyResult) {
    checklist.push({
      element: 'Typography Setup',
      required: true,
      status: 'must_implement',
      css_location: 'typography.css_import',
      description: `Import ${typographyResult.heading} (heading) and ${typographyResult.body} (body) fonts`
    });
  }

  if (colorsResult) {
    checklist.push({
      element: 'Color Variables',
      required: true,
      status: 'must_implement',
      css_location: 'colors.css_variables',
      description: 'CSS custom properties for consistent color usage'
    });
  }

  // Always add hover effects to checklist
  checklist.push({
    element: 'Hover Effects',
    required: true,
    status: 'must_implement',
    css_location: 'hover_effects',
    description: 'Interactive hover states for social icons, pricing cards, feature cards, buttons, nav links, testimonials, and FAQ items'
  });

  // 10. BUILD REQUIRED ELEMENTS with ready-to-copy code
  const requiredElements: DesignSystemResult['required_elements'] = {};

  // Back to top - complete implementation
  if (navigation?.back_to_top) {
    requiredElements.back_to_top = {
      description: 'Scroll-to-top button that appears after scrolling 300px',
      html: `<button class="back-to-top" aria-label="Back to top">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 19V5M5 12l7-7 7 7"/>
  </svg>
</button>`,
      css: navigation.back_to_top,
      js: `// Back to top functionality
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 300);
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}`
    };
  }

  // Navbar - complete implementation
  if (components?.navbar) {
    const navbarBg = colorsResult?.palette?.background || '#ffffff';
    const navbarText = colorsResult?.palette?.text || '#0F172A';
    const ctaColor = colorsResult?.palette?.cta || '#3B82F6';
    const ctaText = colorsResult?.palette?.cta_text || '#ffffff';

    requiredElements.navbar = {
      description: 'Responsive navigation bar with logo, links, mobile menu, and CTA button',
      html: `<nav class="navbar">
  <div class="navbar-container">
    <a href="/" class="navbar-logo">Logo</a>
    <button class="navbar-toggle" aria-label="Toggle menu" aria-expanded="false">
      <span class="hamburger"></span>
    </button>
    <ul class="navbar-menu">
      <li><a href="#features">Features</a></li>
      <li><a href="#pricing">Pricing</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#contact" class="navbar-cta">Get Started</a></li>
    </ul>
  </div>
</nav>`,
      css: components.navbar + `\n\n/* Navbar color overrides */\n.navbar { background: ${navbarBg}; color: ${navbarText}; }\n.navbar-cta { background: ${ctaColor}; color: ${ctaText}; }`,
      js: `// Mobile menu toggle
const navToggle = document.querySelector('.navbar-toggle');
const navMenu = document.querySelector('.navbar-menu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', !isExpanded);
    navMenu.classList.toggle('active');
  });
}`
    };
  }

  // Footer - complete implementation
  if (components?.footer) {
    const footerBg = colorsResult?.palette?.primary || '#1E293B';
    const footerText = calculateContrastText(footerBg);

    requiredElements.footer = {
      description: 'Footer with multiple columns, links, and social icons',
      html: `<footer class="footer">
  <div class="footer-container">
    <div class="footer-column">
      <h4>Company</h4>
      <ul>
        <li><a href="#about">About Us</a></li>
        <li><a href="#careers">Careers</a></li>
        <li><a href="#press">Press</a></li>
      </ul>
    </div>
    <div class="footer-column">
      <h4>Product</h4>
      <ul>
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#docs">Documentation</a></li>
      </ul>
    </div>
    <div class="footer-column">
      <h4>Support</h4>
      <ul>
        <li><a href="#help">Help Center</a></li>
        <li><a href="#contact">Contact</a></li>
        <li><a href="#status">Status</a></li>
      </ul>
    </div>
    <div class="footer-column footer-social">
      <h4>Follow Us</h4>
      <div class="social-links">
        <a href="#" aria-label="Twitter">𝕏</a>
        <a href="#" aria-label="GitHub">GH</a>
        <a href="#" aria-label="LinkedIn">in</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© ${new Date().getFullYear()} Company Name. All rights reserved.</p>
  </div>
</footer>`,
      css: components.footer + `\n\n/* Footer color overrides */\n.footer { background: ${footerBg}; color: ${footerText}; }`
    };
  }

  // Hero section - complete implementation
  if (intentResult.intent === 'landing' || intentResult.intent === 'page') {
    const heroBg = colorsResult?.palette?.background || '#ffffff';
    const heroText = colorsResult?.palette?.text || '#0F172A';
    const ctaColor = colorsResult?.palette?.cta || '#3B82F6';
    const ctaText = colorsResult?.palette?.cta_text || '#ffffff';
    const headingFont = typographyResult?.heading || 'system-ui';
    const bodyFont = typographyResult?.body || 'system-ui';

    requiredElements.hero = {
      description: 'Hero section with headline, subheadline, CTA buttons, and optional image',
      html: `<section class="hero">
  <div class="hero-container">
    <div class="hero-content">
      <h1 class="hero-title">Your Compelling Headline Here</h1>
      <p class="hero-subtitle">A brief, engaging description that explains your value proposition in one or two sentences.</p>
      <div class="hero-cta">
        <a href="#signup" class="btn btn-primary">Get Started Free</a>
        <a href="#demo" class="btn btn-secondary">Watch Demo</a>
      </div>
    </div>
    <div class="hero-image">
      <img src="/hero-image.png" alt="Product preview" loading="eager" />
    </div>
  </div>
</section>`,
      css: `.hero {
  background: ${heroBg};
  color: ${heroText};
  padding: 4rem 1rem;
  min-height: 80vh;
  display: flex;
  align-items: center;
}
.hero-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}
.hero-title {
  font-family: '${headingFont}', system-ui, sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}
.hero-subtitle {
  font-family: '${bodyFont}', system-ui, sans-serif;
  font-size: 1.25rem;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 2rem;
}
.hero-cta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.btn {
  padding: 0.875rem 1.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn:hover {
  transform: translateY(-2px);
}
.btn-primary {
  background: ${ctaColor};
  color: ${ctaText};
  box-shadow: 0 4px 14px 0 ${ctaColor}40;
}
.btn-secondary {
  background: transparent;
  color: ${heroText};
  border: 2px solid currentColor;
}
.hero-image img {
  width: 100%;
  height: auto;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
@media (max-width: 768px) {
  .hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-cta {
    justify-content: center;
  }
  .hero-image {
    order: -1;
  }
}`
    };
  }

  // CTA Button - standalone component
  if (colorsResult?.palette) {
    const ctaColor = colorsResult.palette.cta || '#3B82F6';
    const ctaText = colorsResult.palette.cta_text || '#ffffff';

    requiredElements.cta_button = {
      description: 'Primary CTA button with hover effects and proper contrast',
      html: `<a href="#action" class="cta-button">Call to Action</a>`,
      css: `.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  background: ${ctaColor};
  color: ${ctaText};
  font-weight: 600;
  font-size: 1rem;
  border: none;
  border-radius: 0.5rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px 0 ${ctaColor}40;
}
.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 ${ctaColor}50;
}
.cta-button:active {
  transform: translateY(0);
}`
    };
  }

  // 11. BUILD COMPREHENSIVE HOVER EFFECTS CSS
  const hoverEffectsCSS = `/* ============================================
   HOVER EFFECTS - Interactive Micro-interactions
   ============================================ */

/* --- Social Icons Brand Hover (Footer) --- */
.social-link, .footer-social a {
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
}
.social-link:hover, .footer-social a:hover {
  transform: scale(1.1);
}
.social-link[aria-label="Twitter"]:hover,
.social-link.twitter:hover { background: #1DA1F2; color: white; }
.social-link[aria-label="GitHub"]:hover,
.social-link.github:hover { background: #333; color: white; }
.social-link[aria-label="LinkedIn"]:hover,
.social-link.linkedin:hover { background: #0077B5; color: white; }
.social-link[aria-label="Facebook"]:hover,
.social-link.facebook:hover { background: #1877F2; color: white; }
.social-link[aria-label="Instagram"]:hover,
.social-link.instagram:hover { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: white; }
.social-link[aria-label="YouTube"]:hover,
.social-link.youtube:hover { background: #FF0000; color: white; }

/* --- Pricing Cards --- */
.pricing-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}
.pricing-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}
.pricing-card.popular,
.pricing-card.featured,
.pricing-card.recommended {
  transform: scale(1.05);
  border-color: var(--primary, #6366f1);
  box-shadow: 0 25px 50px rgba(99, 102, 241, 0.25);
  position: relative;
}
.pricing-card.popular::before {
  content: 'Most Popular';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary, #6366f1);
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* --- Feature Cards --- */
.feature-card, .feature-item, .feature {
  transition: all 0.3s ease;
}
.feature-card:hover, .feature-item:hover, .feature:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
  background: var(--card-hover-bg, rgba(255,255,255,1));
}
.feature-card .icon, .feature-item .icon {
  transition: all 0.3s ease;
}
.feature-card:hover .icon, .feature-item:hover .icon {
  transform: scale(1.1);
  color: var(--primary, #6366f1);
}

/* --- General Cards --- */
.card {
  transition: all 0.3s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

/* --- Buttons --- */
.btn, button, [role="button"] {
  transition: all 0.2s ease;
}
.btn:hover, button:hover, [role="button"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.btn:active, button:active {
  transform: translateY(0);
}

/* --- Links --- */
a {
  transition: color 0.2s ease;
}

/* --- Card Images --- */
.card img, .feature-card img {
  transition: transform 0.3s ease;
}
.card:hover img, .feature-card:hover img {
  transform: scale(1.05);
}

/* --- Navigation Links --- */
nav a, .nav-link {
  position: relative;
  transition: color 0.2s ease;
}
nav a::after, .nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary, #6366f1);
  transition: width 0.3s ease;
}
nav a:hover::after, .nav-link:hover::after {
  width: 100%;
}

/* --- Testimonial Cards --- */
.testimonial-card, .testimonial {
  transition: all 0.3s ease;
}
.testimonial-card:hover, .testimonial:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

/* --- FAQ/Accordion Items --- */
.faq-item, .accordion-item {
  transition: all 0.2s ease;
}
.faq-item:hover, .accordion-item:hover {
  background: rgba(0,0,0,0.02);
}

/* --- Table Rows --- */
.pricing-table tr:hover, table tr:hover {
  background: rgba(0,0,0,0.02);
}`;

  // Build partial result for markdown guide generation
  const partialResult = {
    _meta: meta,
    implementation_checklist: checklist,
    required_elements: requiredElements,
    product: productResult,
    style: styleResult,
    colors: colorsResult,
    typography: typographyResult,
    layout: layoutResult,
    navigation: Object.keys(navigation).length > 0 ? navigation : undefined,
    components: Object.keys(components).length > 0 ? components : undefined,
    ux_tips: uxTips.length > 0 ? uxTips : undefined,
    hover_effects: hoverEffectsCSS
  };

  // Generate markdown guide with step-by-step instructions
  const markdownGuide = generateMarkdownGuide(partialResult, validation.originalQuery, {
    mode: modeStr,
    style: styleStr
  });

  // Build full result with markdown_guide placed right after _meta
  const fullResult: DesignSystemResult = {
    _meta: meta,
    markdown_guide: markdownGuide,
    implementation_checklist: checklist,
    required_elements: requiredElements,
    product: productResult,
    style: styleResult,
    colors: colorsResult,
    typography: typographyResult,
    layout: layoutResult,
    navigation: Object.keys(navigation).length > 0 ? navigation : undefined,
    components: Object.keys(components).length > 0 ? components : undefined,
    ux_tips: uxTips.length > 0 ? uxTips : undefined,
    hover_effects: hoverEffectsCSS,
    platform_guidelines: platformGuidelines
  };

  // Filter output based on output_format parameter (default: 'ai-optimized' for smallest context)
  const format = formatStr || 'ai-optimized';

  // Determine hover effects inclusion: false by default for ai-optimized, true otherwise
  const includeHover = includeHoverEffects !== undefined
    ? Boolean(includeHoverEffects)
    : (format !== 'ai-optimized');

  if (format === 'ai-optimized') {
    // Smallest, AI-focused output (~3.5K tokens)
    // markdown_guide contains everything AI needs in structured format
    const output = {
      _meta: fullResult._meta,
      markdown_guide: fullResult.markdown_guide,
      // Include compact color info for quick reference
      colors: fullResult.colors ? {
        css_variables: fullResult.colors.css_variables,
        palette: fullResult.colors.palette
      } : null,
      // NO implementation_checklist - redundant with markdown_guide
      // NO required_elements - already in markdown_guide
      // NO hover_effects by default - already in markdown_guide
      implementation_checklist: null,
      required_elements: null,
      product: null,
      style: null,
      typography: null,
      layout: null,
      platform_guidelines: fullResult.platform_guidelines
    } as unknown as DesignSystemResult;
    // Only add hover_effects if explicitly requested
    if (includeHover && fullResult.hover_effects) {
      output.hover_effects = fullResult.hover_effects;
    }
    return output;
  } else if (format === 'minimal') {
    // Return only essential fields (~4K tokens instead of 15K)
    // markdown_guide contains everything AI needs in structured format
    return {
      _meta: fullResult._meta,
      markdown_guide: fullResult.markdown_guide,
      // Include compact color info for quick reference
      colors: fullResult.colors ? {
        palette: fullResult.colors.palette,
        css_variables: fullResult.colors.css_variables,
        dark_mode: fullResult.colors.dark_mode,
        tailwind_config: fullResult.colors.tailwind_config,
        glow_effects: fullResult.colors.glow_effects
      } : null,
      implementation_checklist: fullResult.implementation_checklist,
      required_elements: fullResult.required_elements,
      product: null,
      style: null,
      typography: null,
      layout: null,
      platform_guidelines: fullResult.platform_guidelines
    } as DesignSystemResult;
  } else if (format === 'structured') {
    // Return only JSON data, no markdown (for programmatic consumption)
    return {
      _meta: fullResult._meta,
      markdown_guide: '', // Empty string instead of full guide
      implementation_checklist: fullResult.implementation_checklist,
      required_elements: fullResult.required_elements,
      product: fullResult.product,
      style: fullResult.style,
      colors: fullResult.colors,
      typography: fullResult.typography,
      layout: fullResult.layout,
      navigation: fullResult.navigation,
      components: fullResult.components,
      ux_tips: fullResult.ux_tips,
      hover_effects: fullResult.hover_effects,
      platform_guidelines: fullResult.platform_guidelines
    };
  }

  // 'full' returns everything as-is
  return fullResult;
}
