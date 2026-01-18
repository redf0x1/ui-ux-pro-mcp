/**
 * Test file for handlers
 * Run with: npx tsx src/tools/test-handlers.ts
 */

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
  searchAll,
  getDataStats,
  isInitialized,
  SearchResult,
  SearchResponse
} from './handlers.js';

// Helper to check if result is an error
function isSearchError(result: SearchResponse): result is { error: string } {
  return typeof result === 'object' && 'error' in result && !Array.isArray(result);
}

// Helper to safely get results array
function getResults(response: SearchResponse): SearchResult[] {
  if (isSearchError(response)) {
    console.log(`   Error: ${response.error}`);
    return [];
  }
  return response;
}

console.log('=== UI/UX Pro Max Handlers Test ===\n');

// Initialize indexes
console.log('Initializing indexes...');
initializeIndexes();

console.log('\n--- Data Statistics ---');
const stats = getDataStats();
console.log(JSON.stringify(stats, null, 2));

console.log('\n--- Test Searches ---\n');

// Test style search
console.log('1. Search Styles: "minimalist modern"');
const styleResults = getResults(searchStyles('minimalist modern', 3));
console.log(`   Found ${styleResults.length} results:`);
styleResults.forEach((r: SearchResult, i: number) => {
  console.log(`   ${i + 1}. ${r.data['Style Category']} (score: ${r.score.toFixed(3)})`);
});

// Test color search
console.log('\n2. Search Colors: "saas business"');
const colorResults = getResults(searchColors('saas business', 3));
console.log(`   Found ${colorResults.length} results:`);
colorResults.forEach((r: SearchResult, i: number) => {
  console.log(`   ${i + 1}. ${r.data['Product Type']} - ${r.data['Primary (Hex)']} (score: ${r.score.toFixed(3)})`);
});

// Test typography search
console.log('\n3. Search Typography: "elegant luxury"');
const typoResults = getResults(searchTypography('elegant luxury', 3));
console.log(`   Found ${typoResults.length} results:`);
typoResults.forEach((r: SearchResult, i: number) => {
  console.log(`   ${i + 1}. ${r.data['Font Pairing Name']} (score: ${r.score.toFixed(3)})`);
});

// Test chart search
console.log('\n4. Search Charts: "comparison bar"');
const chartResults = getResults(searchCharts('comparison bar', 3));
console.log(`   Found ${chartResults.length} results:`);
chartResults.forEach((r: SearchResult, i: number) => {
  console.log(`   ${i + 1}. ${r.data['Best Chart Type']} (score: ${r.score.toFixed(3)})`);
});

// Test UX guidelines search
console.log('\n5. Search UX Guidelines: "navigation mobile"');
const uxResults = getResults(searchUXGuidelines('navigation mobile', 3));
console.log(`   Found ${uxResults.length} results:`);
uxResults.forEach((r: SearchResult, i: number) => {
  console.log(`   ${i + 1}. ${r.data.Category} - ${r.data.Issue} (score: ${r.score.toFixed(3)})`);
});

// Test icon search
console.log('\n6. Search Icons: "menu navigation"');
const iconResults = getResults(searchIcons('menu navigation', 3));
console.log(`   Found ${iconResults.length} results:`);
iconResults.forEach((r: SearchResult, i: number) => {
  console.log(`   ${i + 1}. ${r.data['Icon Name']} (score: ${r.score.toFixed(3)})`);
});

// Test landing search
console.log('\n7. Search Landing: "hero cta"');
const landingResults = getResults(searchLanding('hero cta', 3));
console.log(`   Found ${landingResults.length} results:`);
landingResults.forEach((r: SearchResult, i: number) => {
  console.log(`   ${i + 1}. ${r.data['Pattern Name']} (score: ${r.score.toFixed(3)})`);
});

// Test products search
console.log('\n8. Search Products: "ecommerce"');
const productResults = getResults(searchProducts('ecommerce', 3));
console.log(`   Found ${productResults.length} results:`);
productResults.forEach((r: SearchResult, i: number) => {
  console.log(`   ${i + 1}. ${r.data['Product Type']} (score: ${r.score.toFixed(3)})`);
});

// Test unified search
console.log('\n9. Search All: "dark mode dashboard"');
const allResults = getResults(searchAll('dark mode dashboard', 5));
console.log(`   Found ${allResults.length} results:`);
allResults.forEach((r: SearchResult, i: number) => {
  console.log(`   ${i + 1}. [${r.data.type}] (score: ${r.score.toFixed(3)})`);
});

// Test validation - empty query
console.log('\n10. Test Validation - Empty Query:');
const emptyResult = searchStyles('', 3);
if (isSearchError(emptyResult)) {
  console.log(`   Expected error: ${emptyResult.error}`);
}

// Test validation - invalid max_results
console.log('\n11. Test Validation - Invalid max_results:');
const invalidMaxResult = searchColors('blue', 100);
if (isSearchError(invalidMaxResult)) {
  console.log(`   Expected error: ${invalidMaxResult.error}`);
}

console.log('\n=== All Tests Complete ===');
console.log(`Initialized: ${isInitialized()}`);
