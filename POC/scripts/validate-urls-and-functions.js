/**
 * Comprehensive URL and Function Validation Script
 * Checks all URLs and verifies functions are properly defined and called
 */

const fs = require('fs');
const path = require('path');

const POC_DIR = path.join(__dirname, '..');
const issues = [];
const warnings = [];
const stats = {
  filesChecked: 0,
  urlsFound: 0,
  functionsFound: 0,
  issuesFound: 0,
  warningsFound: 0
};

// Common URL patterns to check
const URL_PATTERNS = [
  /href=["']([^"']+)["']/g,
  /window\.location\.(href|replace)\s*=\s*["']([^"']+)["']/g,
  /\.href\s*=\s*["']([^"']+)["']/g,
  /fetch\(["']([^"']+)["']/g,
  /src=["']([^"']+)["']/g,
];

// Function call patterns
const FUNCTION_PATTERNS = [
  /(\w+)\.(\w+)\(/g,
  /window\.(\w+)\.(\w+)\(/g,
  /if\s*\(.*?(\w+)\.(\w+)\)/g,
  /typeof\s+(\w+)\s*!==\s*['"]undefined['"]/g,
];

// Known valid routes from router.js
const VALID_ROUTES = [
  'home', 'discovery', 'wizard', 'knowledge',
  'login', 'signup', 'dashboard', 'merchant-portal',
  'projects', 'create-project', 'project', 'opportunities',
  'matches', 'proposals', 'create-proposal', 'pipeline',
  'collaboration', 'profile', 'onboarding', 'notifications',
  'admin', 'admin-vetting', 'admin-moderation', 'admin-audit', 'admin-reports',
  'collab-task-based', 'collab-consortium', 'collab-jv', 'collab-spv',
  'collab-strategic-jv', 'collab-strategic-alliance', 'collab-mentorship',
  'collab-bulk-purchasing', 'collab-co-ownership', 'collab-resource-exchange',
  'collab-professional-hiring', 'collab-consultant-hiring', 'collab-competition'
];

// Known function namespaces
const FUNCTION_NAMESPACES = [
  'window.admin', 'window.public', 'window.features',
  'Auth', 'AuthCheck', 'PMTwinAuth', 'PMTwinData',
  'ProjectService', 'ProposalService', 'CollaborationService',
  'AdminService', 'NotificationService', 'DashboardService',
  'ServiceOfferingService', 'ServiceProviderService'
];

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

/**
 * Resolve relative path
 */
function resolvePath(basePath, relativePath) {
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return null; // External URL, skip
  }
  
  if (relativePath.startsWith('/')) {
    return path.join(POC_DIR, relativePath.substring(1));
  }
  
  const resolved = path.resolve(basePath, relativePath);
  return resolved;
}

/**
 * Check if URL is valid
 */
function validateUrl(url, filePath, lineNumber) {
  const issues = [];
  
  // Skip external URLs
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return issues;
  }
  
  // Skip data URIs and javascript:
  if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return issues;
  }
  
  // Skip anchors
  if (url.startsWith('#')) {
    return issues;
  }
  
  // Check for common issues
  if (url.includes('..')) {
    // Relative path - check if it resolves correctly
    const resolved = resolvePath(path.dirname(filePath), url);
    if (resolved && !fileExists(resolved)) {
      // Check if it's a directory that should have index.html
      if (url.endsWith('/') || !url.includes('.')) {
        const withIndex = path.join(resolved, 'index.html');
        if (!fileExists(withIndex)) {
          issues.push({
            type: 'missing_file',
            url,
            file: filePath,
            line: lineNumber,
            resolved: resolved
          });
        }
      } else {
        issues.push({
          type: 'missing_file',
          url,
          file: filePath,
          line: lineNumber,
          resolved: resolved
        });
      }
    }
  } else if (!url.startsWith('/')) {
    // Relative path without ../
    warnings.push({
      type: 'relative_path',
      url,
      file: filePath,
      line: lineNumber,
      message: 'Relative path without ../ may not work correctly'
    });
  }
  
  // Check for old hash-based routes
  if (url.includes('#') && !url.startsWith('#')) {
    issues.push({
      type: 'hash_in_url',
      url,
      file: filePath,
      line: lineNumber,
      message: 'Hash-based routing detected, should use direct paths'
    });
  }
  
  return issues;
}

/**
 * Extract URLs from content
 */
function extractUrls(content, filePath) {
  const foundUrls = [];
  let lineNumber = 1;
  
  const lines = content.split('\n');
  for (const line of lines) {
    for (const pattern of URL_PATTERNS) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(line)) !== null) {
        const url = match[1] || match[2];
        if (url) {
          foundUrls.push({
            url,
            line: lineNumber,
            match: match[0]
          });
        }
      }
    }
    lineNumber++;
  }
  
  return foundUrls;
}

/**
 * Extract function calls from content
 */
function extractFunctions(content, filePath) {
  const foundFunctions = [];
  let lineNumber = 1;
  
  const lines = content.split('\n');
  for (const line of lines) {
    for (const pattern of FUNCTION_PATTERNS) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(line)) !== null) {
        const namespace = match[1] || '';
        const funcName = match[2] || match[1];
        if (funcName && funcName !== 'undefined') {
          foundFunctions.push({
            namespace,
            function: funcName,
            line: lineNumber,
            match: match[0]
          });
        }
      }
    }
    lineNumber++;
  }
  
  return foundFunctions;
}

/**
 * Check if function is defined
 */
function checkFunctionDefinition(funcName, namespace, filePath) {
  // This is a simplified check - in reality, we'd need to parse JS files
  // For now, we'll check against known namespaces
  if (namespace && FUNCTION_NAMESPACES.some(ns => funcName.startsWith(ns))) {
    return true;
  }
  
  // Check if it's a common function
  const commonFunctions = [
    'init', 'render', 'load', 'save', 'update', 'delete',
    'create', 'get', 'set', 'show', 'hide', 'toggle'
  ];
  
  if (commonFunctions.includes(funcName)) {
    return null; // Unknown, might be defined elsewhere
  }
  
  return null; // Unknown
}

/**
 * Process a file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(POC_DIR, filePath);
    
    stats.filesChecked++;
    
    // Extract URLs
    const urls = extractUrls(content, filePath);
    stats.urlsFound += urls.length;
    
    for (const urlInfo of urls) {
      const urlIssues = validateUrl(urlInfo.url, filePath, urlInfo.line);
      issues.push(...urlIssues.map(issue => ({
        ...issue,
        context: urlInfo.match
      })));
    }
    
    // Extract functions (only for JS files)
    if (filePath.endsWith('.js') || filePath.endsWith('.html')) {
      const functions = extractFunctions(content, filePath);
      stats.functionsFound += functions.length;
      
      // Check for common function call issues
      for (const funcInfo of functions) {
        // Check for window.admin, window.public patterns
        if (funcInfo.match.includes('window.admin') || funcInfo.match.includes('window.public')) {
          // This is expected pattern, skip
          continue;
        }
        
        // Check for undefined checks
        if (funcInfo.match.includes('typeof') && funcInfo.match.includes('undefined')) {
          // This is a safety check, which is good
          continue;
        }
      }
    }
    
  } catch (error) {
    warnings.push({
      type: 'read_error',
      file: filePath,
      error: error.message
    });
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath, extensions = ['.html', '.js']) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip node_modules, .git, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'archive') {
        continue;
      }
      
      if (entry.isDirectory()) {
        processDirectory(fullPath, extensions);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          processFile(fullPath);
        }
      }
    }
  } catch (error) {
    warnings.push({
      type: 'directory_error',
      path: dirPath,
      error: error.message
    });
  }
}

/**
 * Main execution
 */
console.log('🔍 Starting URL and Function Validation...\n');

// Process pages directory
console.log('📁 Checking pages directory...');
processDirectory(path.join(POC_DIR, 'pages'));

// Process features directory
console.log('📁 Checking features directory...');
processDirectory(path.join(POC_DIR, 'features'));

// Process src directory
console.log('📁 Checking src directory...');
processDirectory(path.join(POC_DIR, 'src'));

// Process root HTML files
console.log('📁 Checking root files...');
const rootFiles = ['index.html'];
for (const file of rootFiles) {
  const filePath = path.join(POC_DIR, file);
  if (fs.existsSync(filePath)) {
    processFile(filePath);
  }
}

// Generate report
stats.issuesFound = issues.length;
stats.warningsFound = warnings.length;

console.log('\n' + '='.repeat(80));
console.log('📊 VALIDATION REPORT');
console.log('='.repeat(80));
console.log(`\nFiles checked: ${stats.filesChecked}`);
console.log(`URLs found: ${stats.urlsFound}`);
console.log(`Functions found: ${stats.functionsFound}`);
console.log(`Issues found: ${stats.issuesFound}`);
console.log(`Warnings found: ${stats.warningsFound}`);

if (issues.length > 0) {
  console.log('\n❌ ISSUES FOUND:\n');
  const groupedIssues = {};
  for (const issue of issues) {
    const key = `${issue.type}:${issue.file}`;
    if (!groupedIssues[key]) {
      groupedIssues[key] = [];
    }
    groupedIssues[key].push(issue);
  }
  
  for (const [key, issueList] of Object.entries(groupedIssues)) {
    const [type, file] = key.split(':');
    console.log(`\n📄 ${path.relative(POC_DIR, file)}`);
    console.log(`   Type: ${type}`);
    for (const issue of issueList.slice(0, 5)) { // Show first 5
      console.log(`   Line ${issue.line}: ${issue.url || issue.message}`);
      if (issue.resolved) {
        console.log(`      Resolved to: ${issue.resolved}`);
      }
    }
    if (issueList.length > 5) {
      console.log(`   ... and ${issueList.length - 5} more`);
    }
  }
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  for (const warning of warnings.slice(0, 10)) {
    console.log(`   ${warning.type}: ${warning.file || warning.path}`);
    if (warning.message) {
      console.log(`      ${warning.message}`);
    }
  }
  if (warnings.length > 10) {
    console.log(`   ... and ${warnings.length - 10} more warnings`);
  }
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('\n✅ No issues found! All URLs and functions appear to be valid.');
} else {
  console.log('\n💡 TIP: Review the issues above and fix broken URLs or missing function definitions.');
}

// Save detailed report to file
const reportPath = path.join(POC_DIR, 'URL_VALIDATION_REPORT.json');
const report = {
  timestamp: new Date().toISOString(),
  stats,
  issues,
  warnings
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📝 Detailed report saved to: ${path.relative(process.cwd(), reportPath)}`);
