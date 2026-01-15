/**
 * PMTwin Data Loader
 * Loads JSON data files and assigns them to window variables
 */

(function() {
  'use strict';

  // ============================================
  // Helper: Get Base Path for Data Files
  // ============================================
  function getDataBasePath() {
    // Use document.currentScript if available (most reliable)
    const currentScript = document.currentScript || (function() {
      const scripts = document.getElementsByTagName('script');
      for (let i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.includes('data-loader.js')) {
          return scripts[i];
        }
      }
      return null;
    })();
    
    if (currentScript && currentScript.src) {
      try {
        // Get the script's directory URL
        const scriptUrl = new URL(currentScript.src);
        // The script is at: [BASE]/data/data-loader.js
        // So POC root is 1 level up from the script
        const scriptDir = scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/'));
        const pocRoot = scriptDir.split('/').slice(0, -1).join('/') || '/';
        
        // Get current page directory
        const pageUrl = new URL(window.location.href);
        const pageDir = pageUrl.pathname.substring(0, pageUrl.pathname.lastIndexOf('/')) || '/';
        
        // Calculate relative path from page to POC root
        if (pageDir === pocRoot || pageDir === '/') {
          return '';
        }
        
        // Count directory levels difference
        const pageSegments = pageDir.split('/').filter(p => p);
        const rootSegments = pocRoot.split('/').filter(p => p);
        const depth = pageSegments.length - rootSegments.length;
        
        return depth > 0 ? '../'.repeat(depth) : '';
      } catch (e) {
        console.warn('[DataLoader] Error calculating path from script:', e);
      }
    }
    
    // Fallback: calculate from page location
    const currentPath = window.location.pathname;
    // Remove index.html or trailing slash
    const cleanPath = currentPath.replace(/\/index\.html?$/i, '').replace(/\/$/, '') || '/';
    const segments = cleanPath.split('/').filter(p => p);
    const depth = segments.length;
    const basePath = depth > 0 ? '../'.repeat(depth) : '';
    
    // Debug logging
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      console.log('[DataLoader] Path calculation (fallback):', {
        pathname: currentPath,
        cleanPath: cleanPath,
        segments: segments,
        depth: depth,
        basePath: basePath
      });
    }
    
    return basePath;
  }

  const dataFiles = [
    { name: 'adminData', path: 'data/adminData.json' },
    { name: 'dashboardData', path: 'data/dashboardData.json' },
    { name: 'siteData', path: 'data/siteData.json' },
    { name: 'modelsData', path: 'data/modelsData.json' }
  ];

  let loadedCount = 0;
  const totalFiles = dataFiles.length;

  /**
   * Load a single JSON file
   */
  async function loadDataFile(file) {
    try {
      const basePath = getDataBasePath();
      const response = await fetch(basePath + file.path);
      if (!response.ok) {
        throw new Error(`Failed to load ${file.path}: ${response.status}`);
      }
      const data = await response.json();
      window[file.name] = data;
      loadedCount++;
      console.log(`✅ Loaded ${file.name} from ${file.path}`);
      return data;
    } catch (error) {
      console.error(`❌ Error loading ${file.path}:`, error);
      // Set empty object as fallback
      window[file.name] = {};
      loadedCount++;
      return null;
    }
  }

  /**
   * Load all data files
   */
  async function loadAllData() {
    console.log('📦 Loading data files...');
    const promises = dataFiles.map(file => loadDataFile(file));
    await Promise.all(promises);
    console.log(`✅ Loaded ${loadedCount}/${totalFiles} data files`);
    
    // Dispatch custom event when all data is loaded
    if (loadedCount === totalFiles) {
      window.dispatchEvent(new CustomEvent('pmtwinDataLoaded', {
        detail: { loadedFiles: dataFiles.map(f => f.name) }
      }));
    }
  }

  // Auto-load when script is included
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllData);
  } else {
    loadAllData();
  }

  // Export function for manual loading if needed
  window.loadPMTwinData = loadAllData;

})();

