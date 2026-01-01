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
    // Calculate relative path from current page to POC root
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC' && p !== '');
    
    // Count how many directory levels deep we are (excluding POC root and filename)
    // For example: /POC/admin/users-management/ = 2 levels deep, need ../../ to reach POC root
    // For example: /POC/dashboard/ = 1 level deep, need ../ to reach POC root
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
    return depth > 0 ? '../'.repeat(depth) : '';
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

