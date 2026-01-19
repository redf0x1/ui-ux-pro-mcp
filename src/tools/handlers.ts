/**
 * MCP Tool Handlers for UI/UX Pro Max Design Search
 * Provides BM25-powered search across all design data domains
 */

import { BM25, Document } from '../search/bm25.js';
import {
  loadStyles, loadColors, loadTypography, loadCharts,
  loadUXGuidelines, loadIcons, loadLanding, loadProducts,
  loadPrompts, loadStack, loadAllStacks, getAvailableStacks,
  StyleData, ColorData, TypographyData, ChartData,
  UXGuidelineData, IconData, LandingData, ProductData,
  PromptData, StackData, AVAILABLE_STACKS
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
  icons: ["icon", "icons", "lucide", "heroicons", "symbol", "glyph", "pictogram", "svg icon"]
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
  icons: 'icon'
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
    return { valid: false, query: '', maxResults: 3, error: 'Query is required' };
  }

  const queryStr = String(query).trim();

  if (queryStr.length === 0) {
    return { valid: false, query: '', maxResults: 3, error: 'Query cannot be empty' };
  }

  if (queryStr.length > 500) {
    return { valid: false, query: '', maxResults: 3, error: 'Query exceeds maximum length of 500 characters' };
  }

  // Validate maxResults
  let maxResultsNum = 3;
  if (maxResults !== undefined && maxResults !== null) {
    maxResultsNum = Number(maxResults);

    if (!Number.isInteger(maxResultsNum) || isNaN(maxResultsNum)) {
      return { valid: false, query: queryStr, maxResults: 3, error: 'max_results must be a positive integer' };
    }

    if (maxResultsNum < 1) {
      return { valid: false, query: queryStr, maxResults: 3, error: 'max_results must be at least 1' };
    }

    if (maxResultsNum > 50) {
      return { valid: false, query: queryStr, maxResults: 3, error: 'max_results cannot exceed 50' };
    }
  }

  return { valid: true, query: expandQuery(queryStr), maxResults: maxResultsNum };
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

  console.error(`Loaded: ${stylesData.length} styles, ${colorsData.length} colors, ${typographyData.length} typography, ${chartsData.length} charts, ${uxGuidelinesData.length} UX guidelines, ${iconsData.length} icons, ${landingData.length} landing patterns, ${productsData.length} products, ${promptsData.length} prompts, ${stacksData.size} stacks`);

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
    ...allStackDocs
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
 * Design System Output Interface
 */
export interface DesignSystemResult {
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
      background: string;
      text: string;
    };
    tailwind_config: string;
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
  } | null;
}

/**
 * Generate a complete design system by combining styles, colors, typography, and layout patterns.
 * This is a synthesis tool that searches multiple domains and composes results into a unified design system.
 *
 * @param query - Product type or design description (e.g., "fintech dark", "saas minimal")
 * @param style - Optional specific style preference (e.g., "glassmorphism", "minimalism")
 * @param mode - Optional color mode preference ("light" or "dark")
 * @param maxResults - Maximum items per domain (default: 1)
 * @returns Unified design system object or error
 */
export function getDesignSystem(
  query: unknown,
  style?: unknown,
  mode?: unknown,
  maxResults: unknown = 1
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

  // Build search queries based on input
  const baseQuery = validation.query;
  const modeQuery = modeStr ? `${baseQuery} ${modeStr} mode` : baseQuery;
  const styleQuery = styleStr ? `${baseQuery} ${styleStr}` : baseQuery;

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

  // 3. Search colors domain
  let colorsResult: DesignSystemResult['colors'] = null;
  if (colorsIndex) {
    const colorQuery = modeQuery;
    const colorResults = colorsIndex.search(colorQuery, validation.maxResults);
    if (colorResults.length > 0) {
      const colorData = colorResults[0].document.data;
      colorsResult = {
        palette: {
          primary: colorData['Primary (Hex)'] || '',
          secondary: colorData['Secondary (Hex)'] || '',
          cta: colorData['CTA (Hex)'] || '',
          background: colorData['Background (Hex)'] || '',
          text: colorData['Text (Hex)'] || ''
        },
        tailwind_config: colorData['Tailwind_Config'] || '',
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

  // 5. Search landing domain
  let layoutResult: DesignSystemResult['layout'] = null;
  if (landingIndex) {
    const landingResults = landingIndex.search(baseQuery, validation.maxResults);
    if (landingResults.length > 0) {
      const landingData = landingResults[0].document.data;
      layoutResult = {
        pattern: landingData['Pattern Name'] || '',
        section_order: landingData['Section Order'] || '',
        layout_css: landingData['Layout_CSS'] || '',
        grid_config: landingData['Grid_System_Config'] || '',
        bento_map: landingData['Bento_Layout_Map'] || '',
        responsive_strategy: landingData['Responsive_Strategy'] || ''
      };
    }
  }

  return {
    product: productResult,
    style: styleResult,
    colors: colorsResult,
    typography: typographyResult,
    layout: layoutResult
  };
}
