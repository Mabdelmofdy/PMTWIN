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

    // Check if sidebar is minimized
    const isMinimized = sidebar.classList.contains('minimized') || document.body.classList.contains('sidebar-minimized');
    
    // Get sidebar width from CSS or use default
    let sidebarWidth = isMinimized ? '80px' : '300px';
    try {
      const computedWidth = window.getComputedStyle(sidebar).width;
      if (computedWidth && computedWidth !== 'auto') {
        sidebarWidth = computedWidth;
      }
    } catch (e) {
      console.warn('[Layout] Could not get sidebar width, using default');
    }
    const sidebarWidthNum = parseInt(sidebarWidth) || (isMinimized ? 80 : 300);
    
    // On desktop, add margin for sidebar
    const isDesktop = window.innerWidth > 768;
    
    mainElements.forEach(main => {
      // Add page-wrapper class if not present
      if (!main.classList.contains('page-wrapper')) {
        main.classList.add('page-wrapper');
      }
      
      if (isDesktop) {
        main.style.marginLeft = `${sidebarWidthNum}px`;
        main.style.transition = 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      } else {
        main.style.marginLeft = '0';
      }
    });

    // Handle window resize
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const isDesktop = window.innerWidth > 768;
        const isMinimizedNow = sidebar ? (sidebar.classList.contains('minimized') || document.body.classList.contains('sidebar-minimized')) : false;
        const currentSidebarWidth = sidebar ? parseInt(window.getComputedStyle(sidebar).width) : (isMinimizedNow ? 80 : 300);
        
        mainElements.forEach(main => {
          if (isDesktop) {
            main.style.marginLeft = `${currentSidebarWidth}px`;
          } else {
            main.style.marginLeft = '0';
          }
        });
      }, 100);
    };
    
    // Remove existing listener if any, then add new one
    window.removeEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
  }

  // ============================================
  // Public API
  // ============================================
  window.AppLayout = {
    init: initLayout,
    adjustMainContentMargin: adjustMainContentMargin
  };

})();

