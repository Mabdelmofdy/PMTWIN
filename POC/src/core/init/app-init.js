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

    // Wait for services to be loaded (especially DashboardService for menu items)
    console.log('[AppInit] Waiting for services to load...');
    
    // Check if services are already loaded
    let servicesReady = typeof DashboardService !== 'undefined' && typeof PMTwinRBAC !== 'undefined';
    
    if (!servicesReady) {
      // Set up event listener for servicesLoaded (in case event fires before we check)
      let eventReceived = false;
      const eventHandler = () => {
        console.log('[AppInit] Received servicesLoaded event');
        eventReceived = true;
      };
      window.addEventListener('servicesLoaded', eventHandler, { once: true });
      
      // Poll for services with timeout
      const servicesMaxWait = 10000; // 10 seconds max wait
      const servicesStartTime = Date.now();
      const pollInterval = 100; // Check every 100ms
      
      while (!servicesReady && (Date.now() - servicesStartTime) < servicesMaxWait) {
        servicesReady = typeof DashboardService !== 'undefined' && typeof PMTwinRBAC !== 'undefined';
        if (!servicesReady) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }
      
      // Remove event listener if still attached
      window.removeEventListener('servicesLoaded', eventHandler);
    }
    
    if (servicesReady) {
      console.log('[AppInit] ✅ Services are ready');
      console.log('[AppInit] DashboardService available:', typeof DashboardService !== 'undefined');
      console.log('[AppInit] PMTwinRBAC available:', typeof PMTwinRBAC !== 'undefined');
    } else {
      console.warn('[AppInit] ⚠️ Services not fully available after waiting');
      console.warn('[AppInit] DashboardService available:', typeof DashboardService !== 'undefined');
      console.warn('[AppInit] PMTwinRBAC available:', typeof PMTwinRBAC !== 'undefined');
      console.warn('[AppInit] Continuing anyway - menu items may not load correctly');
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

