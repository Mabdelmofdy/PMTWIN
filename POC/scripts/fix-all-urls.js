/**
 * Fix All URLs Script
 * Standardizes URL patterns and fixes common issues
 */

const fs = require('fs');
const path = require('path');

const POC_DIR = path.join(__dirname, '..');
let filesFixed = 0;
let urlsFixed = 0;

/**
 * Fix URLs in content
 */
function fixUrls(content, filePath) {
  let fixed = content;
  let changes = 0;
  
  // Fix common URL patterns
  const fixes = [
    // Fix hash-based routes to direct paths
    {
      pattern: /href=["']#([^"']+)["']/g,
      replacement: (match, route) => {
        const routeMap = {
          'home': '../home/',
          'dashboard': '../dashboard/',
          'projects': '../projects/',
          'admin': '../admin/',
          'login': '../auth/login/',
          'signup': '../auth/signup/',
        };
        const fixedRoute = routeMap[route] || `../${route}/`;
        urlsFixed++;
        return `href="${fixedRoute}"`;
      }
    },
    
    // Fix window.location.href with hash routes
    {
      pattern: /window\.location\.(href|replace)\s*=\s*["']#([^"']+)["']/g,
      replacement: (match, method, route) => {
        const routeMap = {
          'home': '../home/',
          'dashboard': '../dashboard/',
          'projects': '../projects/',
          'admin': '../admin/',
        };
        const fixedRoute = routeMap[route] || `../${route}/`;
        urlsFixed++;
        return `window.location.${method} = "${fixedRoute}"`;
      }
    },
    
    // Fix double slashes
    {
      pattern: /(href|src)=["']([^"']*)\/\/+([^"']+)["']/g,
      replacement: (match, attr, prefix, suffix) => {
        urlsFixed++;
        return `${attr}="${prefix}/${suffix}"`;
      }
    },
    
    // Fix missing trailing slash for directory routes
    {
      pattern: /(href|src)=["']([^"']*\/)(pages|features|admin|dashboard|projects|proposals|collaboration)([^"']*[^\/])["']/g,
      replacement: (match, attr, prefix, dir, suffix) => {
        if (!suffix.includes('.')) { // Not a file, should have trailing slash
          urlsFixed++;
          return `${attr}="${prefix}${dir}${suffix}/"`;
        }
        return match;
      }
    }
  ];
  
  for (const fix of fixes) {
    const newContent = fixed.replace(fix.pattern, fix.replacement);
    if (newContent !== fixed) {
      fixed = newContent;
      changes++;
    }
  }
  
  return { content: fixed, changes };
}

/**
 * Process a file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixUrls(content, filePath);
    
    if (result.changes > 0) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      filesFixed++;
      console.log(`✅ Fixed ${result.changes} issues in ${path.relative(POC_DIR, filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
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
      
      // Skip node_modules, .git, archive
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
    console.error(`❌ Error processing directory ${dirPath}:`, error.message);
  }
}

// Main execution
console.log('🔧 Starting URL Fix Process...\n');

// Process pages directory
console.log('📁 Processing pages directory...');
processDirectory(path.join(POC_DIR, 'pages'));

// Process features directory
console.log('📁 Processing features directory...');
processDirectory(path.join(POC_DIR, 'features'));

// Process src directory
console.log('📁 Processing src directory...');
processDirectory(path.join(POC_DIR, 'src'));

console.log('\n' + '='.repeat(80));
console.log('📊 FIX SUMMARY');
console.log('='.repeat(80));
console.log(`Files fixed: ${filesFixed}`);
console.log(`URLs fixed: ${urlsFixed}`);
console.log('\n✅ URL fix process completed!');
