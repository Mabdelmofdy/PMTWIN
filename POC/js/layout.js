/**
 * PMTwin Application Layout Component
 * Provides consistent layout with sidebar and navbar for all authenticated pages
 */

(function() {
  'use strict';

  let layoutInitialized = false;

  // ============================================
  // Load Phosphor Icons CSS
  // ============================================
  function loadPhosphorIcons() {
    // Check if already loaded
    if (document.querySelector('link[href*="phosphor-icons"]')) {
      return;
    }
    
    // Load Phosphor Icons CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/@phosphor-icons/web@2.0.3/src/regular/style.css';
    document.head.appendChild(link);
  }

  // ============================================
  // Initialize Application Layout
  // ============================================
  async function initLayout(options = {}) {
    if (layoutInitialized) {
      console.log('[Layout] Layout already initialized');
      return;
    }

    const {
      showSidebar = true,
      sidebarAlwaysOpen = true
    } = options;

    console.log('[Layout] Initializing application layout...');
    
    // Load Phosphor Icons CSS if not already loaded
    loadPhosphorIcons();

    // Check authentication
    if (typeof AuthCheck !== 'undefined') {
      const isAuth = await AuthCheck.checkAuth({ requireAuth: false });
      if (!isAuth) {
        console.log('[Layout] User not authenticated, skipping layout initialization');
        return;
      }
    }

    // Ensure sidebar and navbar are created
    if (typeof Navigation !== 'undefined') {
      await Navigation.init({ 
        showSidebar: showSidebar,
        sidebarAlwaysOpen: sidebarAlwaysOpen
      });
    }

    // Adjust main content margin for sidebar
    adjustMainContentMargin();

    layoutInitialized = true;
    console.log('[Layout] Layout initialized successfully');
  }

  // ============================================
  // Adjust Main Content Margin
  // ============================================
  function adjustMainContentMargin() {
    // Find all main elements
    const mainElements = document.querySelectorAll('main');
    const sidebar = document.getElementById('sidebar');

    if (!sidebar) return;

    // On desktop, add margin for sidebar
    const isDesktop = window.innerWidth > 768;
    
    mainElements.forEach(main => {
      if (isDesktop) {
        main.style.marginLeft = '280px';
        main.style.transition = 'margin-left var(--transition-base)';
      } else {
        main.style.marginLeft = '0';
      }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const isDesktop = window.innerWidth > 768;
        mainElements.forEach(main => {
          if (isDesktop) {
            main.style.marginLeft = '280px';
          } else {
            main.style.marginLeft = '0';
          }
        });
      }, 100);
    });
  }

  // ============================================
  // Public API
  // ============================================
  window.AppLayout = {
    init: initLayout,
    adjustMainContentMargin: adjustMainContentMargin
  };

})();

