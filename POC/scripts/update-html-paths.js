#!/usr/bin/env node
/**
 * Update HTML file paths to new directory structure
 * Updates all script and CSS references in HTML files
 */

const fs = require('fs');
const path = require('path');

// Path mappings: old path -> new path (relative to POC root)
const pathMappings = {
  // CSS
  '../css/main.css': '../../assets/css/main.css',
  '../../css/main.css': '../../../assets/css/main.css',
  '../../../css/main.css': '../../../../assets/css/main.css',
  
  // Config
  '../js/config.js': '../../src/config/config.js',
  '../../js/config.js': '../../../src/config/config.js',
  '../../../js/config.js': '../../../../src/config/config.js',
  
  // API
  '../js/api/api-client.js': '../../src/core/api/api-client.js',
  '../js/api/api-service.js': '../../src/core/api/api-service.js',
  '../../js/api/api-client.js': '../../../src/core/api/api-client.js',
  '../../js/api/api-service.js': '../../../src/core/api/api-service.js',
  
  // Core
  '../js/data.js': '../../src/core/data/data.js',
  '../js/auth.js': '../../src/core/auth/auth.js',
  '../js/auth-check.js': '../../src/core/auth/auth-check.js',
  '../js/user-manager.js': '../../src/core/auth/user-manager.js',
  '../js/router.js': '../../src/core/router/router.js',
  '../js/layout.js': '../../src/core/layout/layout.js',
  '../js/navigation.js': '../../src/core/layout/navigation.js',
  '../js/renderer.js': '../../src/core/renderer/renderer.js',
  '../js/matching.js': '../../src/core/matching/matching.js',
  '../js/collaboration-matching.js': '../../src/core/matching/collaboration-matching.js',
  '../js/onboarding.js': '../../src/core/onboarding/onboarding.js',
  '../js/app-init.js': '../../src/core/init/app-init.js',
  '../js/main.js': '../../src/core/init/main.js',
  
  // Utils
  '../js/demo-credentials.js': '../../src/utils/demo-credentials.js',
  '../js/debug-login.js': '../../src/utils/debug-login.js',
  '../js/setup-accounts.js': '../../src/utils/setup-accounts.js',
  
  // Business Logic
  '../js/collaboration-models.js': '../../src/business-logic/models/collaboration-models.js',
  '../js/collaboration-model-definitions.js': '../../src/business-logic/models/collaboration-model-definitions.js',
  '../js/project-form-builder.js': '../../src/business-logic/project-form-builder.js',
  '../js/sub-project-manager.js': '../../src/business-logic/sub-project-manager.js',
  
  // Components
  '../js/components/footer.js': '../../src/components/layout/footer.js',
  '../js/components/page-header.js': '../../src/components/page-header.js',
  '../js/components/stat-card.js': '../../src/components/stat-card.js',
  '../js/components/filter-bar.js': '../../src/components/filter-bar.js',
  '../js/tab-manager.js': '../../src/components/tab-manager.js',
  
  // Services
  '../services/services-loader.js': '../../src/services/services-loader.js',
  '../services/location/location-service.js': '../../src/services/location/location-service.js',
  '../../services/services-loader.js': '../../../src/services/services-loader.js',
  
  // Data
  '../data/data-loader.js': '../../data/data-loader.js',
  '../../data/data-loader.js': '../../../data/data-loader.js',
  
  // Features (relative to POC root from pages/)
  '../features/': '../../features/',
  '../../features/': '../../../features/',
  '../../../features/': '../../../../features/',
};

// Also handle depth 2 and 3 variations
function generateDepthVariations() {
  const variations = {};
  Object.keys(pathMappings).forEach(oldPath => {
    const newPath = pathMappings[oldPath];
    // Add depth 2 variation
    if (oldPath.startsWith('../')) {
      variations['../../' + oldPath.substring(3)] = '../../../' + newPath.substring(6);
    }
    // Add depth 3 variation
    if (oldPath.startsWith('../')) {
      variations['../../../' + oldPath.substring(3)] = '../../../../' + newPath.substring(6);
    }
  });
  return { ...pathMappings, ...variations };
}

const allMappings = generateDepthVariations();

function updateHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Update all path mappings
  Object.keys(allMappings).forEach(oldPath => {
    const newPath = allMappings[oldPath];
    // Use regex to match in script src and link href attributes
    const patterns = [
      new RegExp(`(src|href)=["']${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g'),
      new RegExp(`(src|href)=["']${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/')}["']`, 'g')
    ];
    
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, `$1="${newPath}"`);
        updated = true;
      }
    });
  });
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
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
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.git') {
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

console.log('🔄 Updating HTML file paths...\n');

let updatedCount = 0;

// Update pages
if (fs.existsSync(pagesDir)) {
  const htmlFiles = findHtmlFiles(pagesDir);
  htmlFiles.forEach(file => {
    if (updateHtmlFile(file)) {
      updatedCount++;
    }
  });
}

// Update templates
if (fs.existsSync(templatesDir)) {
  const templateFiles = findHtmlFiles(templatesDir);
  templateFiles.forEach(file => {
    if (updateHtmlFile(file)) {
      updatedCount++;
    }
  });
}

console.log(`\n✅ Updated ${updatedCount} HTML file(s)`);

