#!/usr/bin/env node
/**
 * CSV Validation Script
 * Validates all CSV files in data/ and data/stacks/
 * Run: npm run validate:csv
 */

import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const STACKS_DIR = path.join(DATA_DIR, 'stacks');

function validateCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse(content, { 
    header: true, 
    skipEmptyLines: true 
  });
  
  return {
    file: path.relative(process.cwd(), filePath),
    rows: result.data.length,
    errors: result.errors,
    hasErrors: result.errors.length > 0
  };
}

function getAllCSVFiles() {
  const files = [];
  
  // Check if data folder exists
  if (!fs.existsSync(DATA_DIR)) {
    console.error('❌ Error: data/ folder not found');
    process.exit(1);
  }
  
  // Main data folder
  fs.readdirSync(DATA_DIR).forEach(file => {
    if (file.endsWith('.csv')) {
      files.push(path.join(DATA_DIR, file));
    }
  });
  
  // Stacks folder
  if (fs.existsSync(STACKS_DIR)) {
    fs.readdirSync(STACKS_DIR).forEach(file => {
      if (file.endsWith('.csv')) {
        files.push(path.join(STACKS_DIR, file));
      }
    });
  }
  
  return files;
}

function main() {
  console.log('🔍 Validating CSV files...\n');
  
  const files = getAllCSVFiles();
  
  if (files.length === 0) {
    console.error('❌ Error: No CSV files found in data/ folder');
    process.exit(1);
  }
  
  const results = files.map(validateCSV);
  
  let totalRows = 0;
  let totalErrors = 0;
  let hasAnyErrors = false;
  
  results.forEach(r => {
    const status = r.hasErrors ? '❌' : '✅';
    console.log(`${status} ${r.file}: ${r.rows} rows, ${r.errors.length} errors`);
    
    if (r.hasErrors) {
      hasAnyErrors = true;
      r.errors.forEach(e => {
        console.log(`   ⚠️  Row ${e.row}: ${e.message}`);
      });
    }
    
    totalRows += r.rows;
    totalErrors += r.errors.length;
  });
  
  console.log('\n' + '─'.repeat(50));
  console.log(`📊 Total: ${files.length} files, ${totalRows} rows, ${totalErrors} errors`);
  
  if (hasAnyErrors) {
    console.log('\n❌ Validation FAILED - Please fix CSV errors before publishing\n');
    process.exit(1);
  } else {
    console.log('\n✅ All CSV files are valid!\n');
    process.exit(0);
  }
}

main();
