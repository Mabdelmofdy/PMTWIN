#!/usr/bin/env node
/**
 * Fix navigation links in HTML files to use new page structure
 */

const fs = require('fs');
const path = require('path');

// Mapping of old paths to new paths
const linkMappings = {
  // Auth pages
  'href="../login/"': 'href="../auth/login/"',
  'href="../../login/"': 'href="../../auth/login/"',
  'href="../../../login/"': 'href="../../../auth/login/"',
  'href="../signup/"': 'href="../auth/signup/"',
  'href="../../signup/"': 'href="../../auth/signup/"',
  'href="../../../signup/"': 'href="../../../auth/signup/"',
  
  // Other common links (these should already be correct, but let's ensure)
  'href="../home/"': 'href="../home/"', // Already correct
  'href="../../home/"': 'href="../../home/"',
  'href="../dashboard/"': 'href="../dashboard/"',
  'href="../../dashboard/"': 'href="../../dashboard/"',
  'href="../discovery/"': 'href="../discovery/"',
  'href="../../discovery/"': 'href="../../discovery/"',
  'href="../wizard/"': 'href="../wizard/"',
  'href="../../wizard/"': 'href="../../wizard/"',
  'href="../knowledge/"': 'href="../knowledge/"',
  'href="../../knowledge/"': 'href="../../knowledge/"',
  'href="../service-providers/"': 'href="../service-providers/"',
  'href="../../service-providers/"': 'href="../../service-providers/"',
};

function fixHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Apply all link mappings
  Object.keys(linkMappings).forEach(oldLink => {
    const newLink = linkMappings[oldLink];
    if (content.includes(oldLink)) {
      // Use regex to match the exact href pattern
      const regex = new RegExp(oldLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, newLink);
      updated = true;
    }
  });

  // Also fix any remaining login/signup links that might use different patterns
  const loginPatterns = [
    /href=["']\.\.\/login\//g,
    /href=["']\.\.\/\.\.\/login\//g,
    /href=["']\.\.\/\.\.\/\.\.\/login\//g,
  ];
  
  const signupPatterns = [
    /href=["']\.\.\/signup\//g,
    /href=["']\.\.\/\.\.\/signup\//g,
    /href=["']\.\.\/\.\.\/\.\.\/signup\//g,
  ];

  // Get depth of current file
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const depth = relativePath.split(path.sep).length - 1;
  
  // Fix login links
  loginPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      const correctPath = '../'.repeat(depth) + 'auth/login/';
      content = content.replace(pattern, `href="${correctPath}`);
      updated = true;
    }
  });

  // Fix signup links
  signupPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      const correctPath = '../'.repeat(depth) + 'auth/signup/';
      content = content.replace(pattern, `href="${correctPath}`);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed links in: ${filePath}`);
    return true;
  }
  return false;
}

function findHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.git' && item !== 'archive') {
      files.push(...findHtmlFiles(fullPath));
    } else if (stat.isFile() && item.endsWith('.html')) {
      files.push(fullPath);
    }
  });
  
  return files;
}

// Main execution
const pagesDir = path.join(__dirname, '..', 'pages');

console.log('🔄 Fixing navigation links in HTML files...\n');

let fixedCount = 0;

if (fs.existsSync(pagesDir)) {
  const htmlFiles = findHtmlFiles(pagesDir);
  htmlFiles.forEach(file => {
    if (fixHtmlFile(file)) {
      fixedCount++;
    }
  });
}

console.log(`\n✅ Fixed ${fixedCount} HTML file(s)`);

