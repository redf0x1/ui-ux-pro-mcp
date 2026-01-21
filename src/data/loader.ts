import Papa from 'papaparse';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Based on actual CSV: STT, Style Category, Type, Keywords, Primary Colors, Secondary Colors,
// Effects & Animation, Best For, Do Not Use For, Light Mode, Dark Mode, Performance,
// Accessibility, Mobile-Friendly, Conversion-Focused, Framework Compatibility, Era/Origin, Complexity
export interface StyleData {
  STT: string;
  'Style Category': string;
  Type: string;
  Keywords: string;
  'Primary Colors': string;
  'Secondary Colors': string;
  'Effects & Animation': string;
  'Best For': string;
  'Do Not Use For': string;
  'Light Mode ✓': string;
  'Dark Mode ✓': string;
  Performance: string;
  Accessibility: string;
  'Mobile-Friendly': string;
  'Conversion-Focused': string;
  'Framework Compatibility': string;
  'Era/Origin': string;
  Complexity: string;
  CSS_Code?: string;
  Motion_Config?: string;
  Animation_Variants?: string;
}

// Based on actual CSV: No, Product Type, Keywords, Primary (Hex), Secondary (Hex), CTA (Hex),
// Background (Hex), Text (Hex), Border (Hex), Notes
export interface ColorData {
  No: string;
  'Product Type': string;
  Keywords: string;
  'Primary (Hex)': string;
  'Secondary (Hex)': string;
  'CTA (Hex)': string;
  'Background (Hex)': string;
  'Text (Hex)': string;
  'Border (Hex)': string;
  Notes: string;
  Tailwind_Config?: string;
  Glow_Effects?: string;
  Dark_Mode_Colors?: string;
  Semantic_Mapping?: string;
  Data_Viz_Palette?: string;
  Semantic_Tokens?: string;
}

// Based on actual CSV: STT, Font Pairing Name, Category, Heading Font, Body Font,
// Mood/Style Keywords, Best For, Google Fonts URL, CSS Import, Tailwind Config, Notes
export interface TypographyData {
  STT: string;
  'Font Pairing Name': string;
  Category: string;
  'Heading Font': string;
  'Body Font': string;
  'Mood/Style Keywords': string;
  'Best For': string;
  'Google Fonts URL': string;
  'CSS Import': string;
  'Tailwind Config': string;
  Notes: string;
}

// Based on actual CSV: No, Data Type, Keywords, Best Chart Type, Secondary Options,
// Color Guidance, Performance Impact, Accessibility Notes, Library Recommendation, Interactive Level,
// ChartJS_Config, Recharts_Config
export interface ChartData {
  No: string;
  'Data Type': string;
  Keywords: string;
  'Best Chart Type': string;
  'Secondary Options': string;
  'Color Guidance': string;
  'Performance Impact': string;
  'Accessibility Notes': string;
  'Library Recommendation': string;
  'Interactive Level': string;
  ChartJS_Config?: string;
  Recharts_Config?: string;
  Data_Schema?: string;
  Mock_Data_Example?: string;
}

// Based on actual CSV: No, Category, Issue, Platform, Description, Do, Don't,
// Code Example Good, Code Example Bad, Severity
export interface UXGuidelineData {
  No: string;
  Category: string;
  Issue: string;
  Platform: string;
  Description: string;
  Do: string;
  "Don't": string;
  'Code Example Good': string;
  'Code Example Bad': string;
  Severity: string;
}

// Based on actual CSV: STT, Category, Icon Name, Keywords, Library, Import Code, Usage, Best For, Style, Animation_Class
export interface IconData {
  STT: string;
  Category: string;
  'Icon Name': string;
  Keywords: string;
  Library: string;
  'Import Code': string;
  Usage: string;
  'Best For': string;
  Style: string;
  Animation_Class?: string;
}

// Based on actual CSV: No, Pattern Name, Keywords, Section Order, Primary CTA Placement,
// Color Strategy, Recommended Effects, Conversion Optimization
export interface LandingData {
  No: string;
  'Pattern Name': string;
  Keywords: string;
  'Section Order': string;
  'Primary CTA Placement': string;
  'Color Strategy': string;
  'Recommended Effects': string;
  'Conversion Optimization': string;
  Layout_CSS?: string;
  Grid_System_Config?: string;
  Bento_Layout_Map?: string;
  Responsive_Strategy?: string;
}

// Based on actual CSV: No, Product Type, Keywords, Primary Style Recommendation, Secondary Styles,
// Landing Page Pattern, Dashboard Style (if applicable), Color Palette Focus, Key Considerations
export interface ProductData {
  No: string;
  'Product Type': string;
  Keywords: string;
  'Primary Style Recommendation': string;
  'Secondary Styles': string;
  'Landing Page Pattern': string;
  'Dashboard Style (if applicable)': string;
  'Color Palette Focus': string;
  'Key Considerations': string;
}

function loadCSV<T>(filename: string): T[] {
  const dataDir = join(__dirname, '../../data');
  const filePath = join(dataDir, filename);

  if (!existsSync(filePath)) {
    console.warn(`Data file not found: ${filePath}`);
    return [];
  }

  const content = readFileSync(filePath, 'utf-8');

  // Use PapaParse for more lenient CSV parsing
  // It handles multiline content, unescaped quotes, and malformed CSVs better
  const result = Papa.parse<T>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value?.trim() || ''
  });

  if (result.errors.length > 0) {
    // Only log actual parsing errors, not just warnings
    const criticalErrors = result.errors.filter(e => e.type === 'FieldMismatch' || e.type === 'Quotes');
    if (criticalErrors.length > 0) {
      console.warn(`Parse warnings in ${filename}:`, criticalErrors.slice(0, 3));
    }
  }

  return result.data as T[];
}

export function loadStyles(): StyleData[] {
  return loadCSV<StyleData>('styles.csv');
}

export function loadColors(): ColorData[] {
  return loadCSV<ColorData>('colors.csv');
}

export function loadTypography(): TypographyData[] {
  return loadCSV<TypographyData>('typography.csv');
}

export function loadCharts(): ChartData[] {
  return loadCSV<ChartData>('charts.csv');
}

export function loadUXGuidelines(): UXGuidelineData[] {
  return loadCSV<UXGuidelineData>('ux-guidelines.csv');
}

export function loadIcons(): IconData[] {
  return loadCSV<IconData>('icons.csv');
}

export function loadLanding(): LandingData[] {
  return loadCSV<LandingData>('landing.csv');
}

export function loadProducts(): ProductData[] {
  return loadCSV<ProductData>('products.csv');
}

// Based on prompts.csv: STT, Style Category, AI Prompt Keywords (Copy-Paste Ready), CSS/Technical Keywords,
// Implementation Checklist, Design System Variables
export interface PromptData {
  STT: string;
  'Style Category': string;
  'AI Prompt Keywords (Copy-Paste Ready)': string;
  'CSS/Technical Keywords': string;
  'Implementation Checklist': string;
  'Design System Variables': string;
}

// Based on stack CSV files: No, Category, Guideline, Description, Do, Don't,
// Code Good, Code Bad, Severity, Docs URL
export interface StackData {
  No: string;
  Category: string;
  Guideline: string;
  Description: string;
  Do: string;
  "Don't": string;
  'Code Good': string;
  'Code Bad': string;
  Severity: string;
  'Docs URL': string;
}

// Based on platform CSV files (ios.csv): No, Category, Pattern, Description, Do, Don't,
// iOS_Value, Flutter_Equiv, RN_Equiv, Severity, Docs_URL
export interface PlatformData {
  No: string;
  Category: string;
  Pattern: string;
  Description: string;
  Do: string;
  "Don't": string;
  iOS_Value: string;
  Flutter_Equiv: string;
  RN_Equiv: string;
  Severity: string;
  Docs_URL: string;
}

export function loadPrompts(): PromptData[] {
  return loadCSV<PromptData>('prompts.csv');
}

// Available stack names
export const AVAILABLE_STACKS = [
  'flutter',
  'html-tailwind',
  'jetpack-compose',
  'nextjs',
  'nuxt-ui',
  'nuxtjs',
  'react-native',
  'react',
  'shadcn',
  'svelte',
  'swiftui',
  'vue'
] as const;

export type StackName = typeof AVAILABLE_STACKS[number];

export function loadStack(stackName: string): StackData[] {
  const normalizedName = stackName.toLowerCase().trim();
  if (!AVAILABLE_STACKS.includes(normalizedName as StackName)) {
    console.warn(`Unknown stack: ${stackName}. Available stacks: ${AVAILABLE_STACKS.join(', ')}`);
    return [];
  }
  return loadCSV<StackData>(`stacks/${normalizedName}.csv`);
}

export function loadAllStacks(): Map<string, StackData[]> {
  const stacks = new Map<string, StackData[]>();
  for (const stackName of AVAILABLE_STACKS) {
    const data = loadStack(stackName);
    if (data.length > 0) {
      stacks.set(stackName, data);
    }
  }
  return stacks;
}

export function getAvailableStacks(): string[] {
  return [...AVAILABLE_STACKS];
}

// Available platform names
export const AVAILABLE_PLATFORMS = [
  'ios',
  'android'
] as const;

export type PlatformName = typeof AVAILABLE_PLATFORMS[number];

export function loadPlatform(platformName: string): PlatformData[] {
  const normalizedName = platformName.toLowerCase().trim();
  if (!AVAILABLE_PLATFORMS.includes(normalizedName as PlatformName)) {
    console.warn(`Unknown platform: ${platformName}. Available platforms: ${AVAILABLE_PLATFORMS.join(', ')}`);
    return [];
  }
  return loadCSV<PlatformData>(`platforms/${normalizedName}.csv`);
}

export function loadAllPlatforms(): Map<string, PlatformData[]> {
  const platforms = new Map<string, PlatformData[]>();
  for (const platformName of AVAILABLE_PLATFORMS) {
    const data = loadPlatform(platformName);
    if (data.length > 0) {
      platforms.set(platformName, data);
    }
  }
  return platforms;
}

export function getAvailablePlatforms(): string[] {
  return [...AVAILABLE_PLATFORMS];
}
