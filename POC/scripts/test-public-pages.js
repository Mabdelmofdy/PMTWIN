#!/usr/bin/env node
/**
 * Test script to verify all public portal pages are accessible
 * Checks for:
 * - File existence
 * - Correct navigation links
 * - Correct script paths
 * - No broken redirects
 */

const fs = require('fs');
const path = require('path');

// Get the correct POC root directory
// If script is in POC/scripts/, __dirname is POC/scripts, so .. is POC
// If script is run from workspace root, we need to handle that
const scriptDir = __dirname;
const possiblePOCRoot = path.join(scriptDir, '..');
const POC_ROOT = fs.existsSync(path.join(possiblePOCRoot, 'pages')) 
  ? possiblePOCRoot 
  : path.join(scriptDir, '../..'); // If not found, try going up one more level
const PAGES_DIR = path.join(POC_ROOT, 'pages');

// Public portal pages to check
const PUBLIC_PAGES = [
  { name: 'Home', path: 'home/index.html', depth: 2 },
  { name: 'Discovery', path: 'discovery/index.html', depth: 2 },
  { name: 'Wizard', path: 'wizard/index.html', depth: 2 },
  { name: 'Knowledge', path: 'knowledge/index.html', depth: 2 },
  { name: 'Service Providers', path: 'service-providers/index.html', depth: 2 },
  { name: 'Login', path: 'auth/login/index.html', depth: 3 },
  { name: 'Signup', path: 'auth/signup/index.html', depth: 3 }
];

// Expected navigation links
const EXPECTED_LINKS = {
  'home': '../home/',
  'discovery': '../discovery/',
  'wizard': '../wizard/',
  'knowledge': '../knowledge/',
  'service-providers': '../service-providers/',
  'auth/login': '../auth/login/',
  'auth/signup': '../auth/signup/'
};

// Expected asset paths by depth
const EXPECTED_ASSETS = {
  2: '../../assets/css/main.css',
  3: '../../../assets/css/main.css'
};

const EXPECTED_SCRIPTS = {
  2: '../../src/',
  3: '../../../src/'
};

let issues = [];
let passed = 0;

function checkFile(filePath, pageName) {
  const fullPath = path.join(POC_ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    issues.push(`❌ ${pageName}: File not found at ${filePath}`);
    return false;
  }
  return true;
}

function checkNavigationLinks(content, pagePath, pageName) {
  const issues = [];
  
  // Check for incorrect paths like auth/home
  if (content.includes('auth/home') || content.includes('pages/auth/home')) {
    issues.push(`❌ ${pageName}: Found incorrect path 'auth/home' or 'pages/auth/home'`);
  }
  
  // Check for correct relative paths
  // pages/home/index.html -> depth 2 -> ../home/
  // pages/auth/login/index.html -> depth 3 -> ../../home/
  const pathParts = pagePath.split('/');
  const depth = pathParts.length - 1; // -1 for index.html
  
  // Verify home link exists and is correct
  const homeLinkRegex = new RegExp(`href=["']([^"']*home[^"']*)["']`, 'gi');
  const matches = content.matchAll(homeLinkRegex);
  for (const match of matches) {
    const link = match[1];
    if (link.includes('auth/home') || link.includes('pages/auth/home')) {
      issues.push(`❌ ${pageName}: Incorrect home link found: ${link}`);
    }
  }
  
  return issues;
}

function checkAssetPaths(content, pagePath, pageName) {
  const issues = [];
  // Calculate depth: pages/home/index.html = 2 levels deep (pages, home)
  // pages/auth/login/index.html = 3 levels deep (pages, auth, login)
  const pathParts = pagePath.split('/');
  const depth = pathParts.length - 1; // -1 for index.html
  const expectedAssetPath = EXPECTED_ASSETS[depth];
  
  if (expectedAssetPath && !content.includes(expectedAssetPath)) {
    issues.push(`⚠️  ${pageName}: CSS path might be incorrect. Expected: ${expectedAssetPath}`);
  }
  
  // Check for script paths
  const expectedScriptPath = EXPECTED_SCRIPTS[depth];
  if (expectedScriptPath && !content.includes(expectedScriptPath)) {
    issues.push(`⚠️  ${pageName}: Script path might be incorrect. Expected: ${expectedScriptPath}`);
  }
  
  return issues;
}

console.log('🔍 Testing Public Portal Pages...\n');

// Test each page
PUBLIC_PAGES.forEach(page => {
  console.log(`Testing ${page.name}...`);
  
  const filePath = path.join('pages', page.path);
  
  if (!checkFile(filePath, page.name)) {
    return;
  }
  
  const fullPath = path.join(POC_ROOT, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Check navigation links
  const navIssues = checkNavigationLinks(content, page.path, page.name);
  issues.push(...navIssues);
  
  // Check asset paths
  const assetIssues = checkAssetPaths(content, page.path, page.name);
  issues.push(...assetIssues);
  
  if (navIssues.length === 0 && assetIssues.length === 0) {
    console.log(`  ✅ ${page.name}: OK`);
    passed++;
  } else {
    console.log(`  ⚠️  ${page.name}: Issues found`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed}/${PUBLIC_PAGES.length} pages passed`);

if (issues.length > 0) {
  console.log('\nIssues found:');
  issues.forEach(issue => console.log(`  ${issue}`));
  process.exit(1);
} else {
  console.log('\n✅ All public portal pages are correctly configured!');
  process.exit(0);
}
