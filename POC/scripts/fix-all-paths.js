#!/usr/bin/env node
/**
 * Fix ALL paths in HTML files based on their actual depth
 */

const fs = require('fs');
const path = require('path');

function getDepthFromPocRoot(filePath) {
  // Get relative path from POC root
  const pocRoot = path.join(__dirname, '..');
  const relativePath = path.relative(pocRoot, filePath);
  const parts = relativePath.split(path.sep).filter(p => p);
  // Depth is number of directories (excluding filename)
  return parts.length - 1;
}

function getCorrectPath(target, depth) {
  return '../'.repeat(depth) + target;
}

function fixHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const depth = getDepthFromPocRoot(filePath);
  let updated = false;

  // Fix CSS path
  const cssPatterns = [
    /href=["']\.\.\/assets\/css\/main\.css["']/g,
    /href=["']\.\.\/\.\.\/assets\/css\/main\.css["']/g,
    /href=["']\.\.\/\.\.\/\.\.\/assets\/css\/main\.css["']/g,
    /href=["']\.\.\/\.\.\/\.\.\/\.\.\/assets\/css\/main\.css["']/g,
  ];
  const correctCssPath = getCorrectPath('assets/css/main.css', depth);
  cssPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, `href="${correctCssPath}"`);
      updated = true;
    }
  });

  // Fix src/ paths
  const srcPatterns = [
    /src=["']\.\.\/src\//g,
    /src=["']\.\.\/\.\.\/src\//g,
    /src=["']\.\.\/\.\.\/\.\.\/src\//g,
    /src=["']\.\.\/\.\.\/\.\.\/\.\.\/src\//g,
  ];
  const correctSrcBase = getCorrectPath('src/', depth);
  srcPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, `src="${correctSrcBase}`);
      updated = true;
    }
  });

  // Fix data/ paths
  const dataPatterns = [
    /src=["']\.\.\/data\//g,
    /src=["']\.\.\/\.\.\/data\//g,
    /src=["']\.\.\/\.\.\/\.\.\/data\//g,
    /src=["']\.\.\/\.\.\/\.\.\/\.\.\/data\//g,
  ];
  const correctDataBase = getCorrectPath('data/', depth);
  dataPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, `src="${correctDataBase}`);
      updated = true;
    }
  });

  // Fix features/ paths
  const featuresPatterns = [
    /src=["']\.\.\/features\//g,
    /src=["']\.\.\/\.\.\/features\//g,
    /src=["']\.\.\/\.\.\/\.\.\/features\//g,
    /src=["']\.\.\/\.\.\/\.\.\/\.\.\/features\//g,
  ];
  const correctFeaturesBase = getCorrectPath('features/', depth);
  featuresPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, `src="${correctFeaturesBase}`);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed paths in: ${filePath} (depth: ${depth})`);
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
const templatesDir = path.join(__dirname, '..', 'templates');

console.log('🔄 Fixing ALL paths in HTML files based on depth...\n');

let fixedCount = 0;

// Fix pages
if (fs.existsSync(pagesDir)) {
  const htmlFiles = findHtmlFiles(pagesDir);
  htmlFiles.forEach(file => {
    if (fixHtmlFile(file)) {
      fixedCount++;
    }
  });
}

// Fix templates
if (fs.existsSync(templatesDir)) {
  const templateFiles = findHtmlFiles(templatesDir);
  templateFiles.forEach(file => {
    if (fixHtmlFile(file)) {
      fixedCount++;
    }
  });
}

console.log(`\n✅ Fixed ${fixedCount} HTML file(s)`);

