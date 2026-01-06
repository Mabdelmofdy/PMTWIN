#!/usr/bin/env node
/**
 * Fix relative paths in HTML files based on their actual depth
 */

const fs = require('fs');
const path = require('path');

function getDepthFromRoot(filePath) {
  // Count how many directories deep from POC root
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const depth = relativePath.split(path.sep).length - 1; // -1 for filename
  return depth;
}

function getCorrectPath(target, depth) {
  // Generate correct relative path based on depth
  const upLevels = '../'.repeat(depth);
  return upLevels + target;
}

function fixHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const depth = getDepthFromRoot(filePath);
  let updated = false;

  // Fix data-loader.js paths
  const dataLoaderPatterns = [
    /src=["']\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/data\/data-loader\.js["']/g,
    /src=["']\.\.\/\.\.\/\.\.\/\.\.\/data\/data-loader\.js["']/g,
    /src=["']\.\.\/\.\.\/\.\.\/data\/data-loader\.js["']/g,
    /src=["']\.\.\/\.\.\/data\/data-loader\.js["']/g,
  ];

  const correctDataPath = getCorrectPath('data/data-loader.js', depth);
  dataLoaderPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, `src="${correctDataPath}"`);
      updated = true;
    }
  });

  // Fix features paths (should be ../../features/ for depth 1, ../../../features/ for depth 2, etc.)
  const featuresPatterns = [
    /src=["']\.\.\/\.\.\/\.\.\/features\//g,
    /src=["']\.\.\/\.\.\/features\//g,
  ];

  const correctFeaturesPath = getCorrectPath('features/', depth);
  featuresPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, `src="${correctFeaturesPath}`);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath} (depth: ${depth})`);
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

console.log('🔄 Fixing relative paths in HTML files...\n');

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

