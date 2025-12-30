/**
 * PMTwin Application Initialization
 * Automatically initializes layout for all authenticated pages
 */

(function() {
  'use strict';

  // ============================================
  // Initialize Application
  // ============================================
  async function initApp() {
    console.log('[AppInit] Initializing application...');

    // Wait for all core scripts to load
    const maxWait = 5000; // 5 seconds max wait
    const startTime = Date.now();
    
    while ((typeof PMTwinData === 'undefined' || 
            typeof PMTwinAuth === 'undefined' || 
            typeof AuthCheck === 'undefined' ||
            typeof Navigation === 'undefined') && 
           (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (typeof PMTwinData === 'undefined' || 
        typeof PMTwinAuth === 'undefined' || 
        typeof AuthCheck === 'undefined') {
      console.error('[AppInit] Core services failed to load');
      return;
    }

    // Check if user is authenticated
    const isAuth = await AuthCheck.checkAuth({ requireAuth: false });
    
    if (isAuth) {
      console.log('[AppInit] User authenticated, initializing layout...');
      
      // Initialize layout (includes navbar and sidebar)
      if (typeof AppLayout !== 'undefined') {
        await AppLayout.init({ 
          showSidebar: true, 
          sidebarAlwaysOpen: true 
        });
      } else if (typeof Navigation !== 'undefined') {
        await Navigation.init({ 
          showSidebar: true, 
          sidebarAlwaysOpen: true 
        });
      }
    } else {
      console.log('[AppInit] User not authenticated, skipping layout initialization');
    }
  }

  // ============================================
  // Auto-Initialize
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait for all scripts to load
      setTimeout(initApp, 300);
    });
  } else {
    // DOM already loaded
    setTimeout(initApp, 300);
  }

  // Export for manual initialization if needed
  window.AppInit = {
    init: initApp
  };

})();

