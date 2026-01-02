/**
 * PMTwin Central Navigation Component
 * Provides appbar and sidebar navigation for authenticated users
 */

(function() {
  'use strict';

  let menuItems = [];
  let currentUser = null;
  let sidebarOpen = false;

  // ============================================
  // Get Base Path Helper
  // ============================================
  function getBasePath() {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    return segments.length > 0 ? '../' : '';
  }

  // ============================================
  // Load Menu Items
  // ============================================
  async function loadMenuItems(forceRefresh = false) {
    // Force refresh if requested (e.g., after role change)
    if (forceRefresh) {
      menuItems = [];
    }
    
    if (menuItems.length > 0) return menuItems;

    try {
      if (typeof DashboardService !== 'undefined') {
        const result = await DashboardService.getMenuItems();
        if (result.success) {
          menuItems = result.items || [];
          console.log(`[Navigation] Loaded ${menuItems.length} menu items for current user`);
          return menuItems;
        }
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    }

    // Fallback menu items
    return getFallbackMenuItems();
  }
  
  // ============================================
  // Refresh Menu Items
  // ============================================
  async function refreshMenuItems() {
    menuItems = [];
    await loadMenuItems(true);
    // Re-render sidebar if it exists
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      await renderSidebar();
    }
  }

  function getFallbackMenuItems() {
    if (!currentUser) return [];
    
    const basePath = getBasePath();
    const role = currentUser.role;

    const allItems = [
      { id: 'dashboard', label: 'Dashboard', route: `${basePath}dashboard/`, icon: '<i class="ph ph-gauge"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'projects', label: 'My Projects', route: `${basePath}projects/`, icon: '<i class="ph ph-buildings"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'create-project', label: 'Create Project', route: `${basePath}create-project/`, icon: '<i class="ph ph-plus-circle"></i>', roles: ['admin', 'entity'] },
      { id: 'proposals', label: 'Proposals', route: `${basePath}proposals/`, icon: '<i class="ph ph-file-text"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'matches', label: 'Matches', route: `${basePath}matches/`, icon: '<i class="ph ph-link"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'opportunities', label: 'Opportunities', route: `${basePath}opportunities/`, icon: '<i class="ph ph-sparkle"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'pipeline', label: 'Pipeline', route: `${basePath}pipeline/`, icon: '<i class="ph ph-trend-up"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'collaboration', label: 'Collaboration', route: `${basePath}collaboration/`, icon: '<i class="ph ph-handshake"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'profile', label: 'Profile', route: `${basePath}profile/`, icon: '<i class="ph ph-user"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'notifications', label: 'Notifications', route: `${basePath}notifications/`, icon: '<i class="ph ph-bell"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'admin', label: 'Admin Dashboard', route: `${basePath}admin/`, icon: '<i class="ph ph-gear"></i>', roles: ['admin'] },
      { id: 'admin-vetting', label: 'User Vetting', route: `${basePath}admin-vetting/`, icon: '<i class="ph ph-check-circle"></i>', roles: ['admin'] },
      { id: 'admin-users-management', label: 'User Management', route: `${basePath}users-management/`, icon: '<i class="ph ph-users"></i>', roles: ['admin'] },
      { id: 'admin-models-management', label: 'Models Management', route: `${basePath}models-management/`, icon: '<i class="ph ph-handshake"></i>', roles: ['admin'] },
      { id: 'admin-moderation', label: 'Moderation', route: `${basePath}admin-moderation/`, icon: '<i class="ph ph-shield-check"></i>', roles: ['admin'] },
      { id: 'admin-analytics', label: 'Analytics', route: `${basePath}analytics/`, icon: '<i class="ph ph-chart-line"></i>', roles: ['admin'] },
      { id: 'admin-audit', label: 'Audit Trail', route: `${basePath}admin-audit/`, icon: '<i class="ph ph-clipboard"></i>', roles: ['admin'] },
      { id: 'admin-reports', label: 'Reports', route: `${basePath}admin-reports/`, icon: '<i class="ph ph-chart-bar"></i>', roles: ['admin'] },
      { id: 'admin-settings', label: 'Settings', route: `${basePath}settings/`, icon: '<i class="ph ph-gear"></i>', roles: ['admin'] }
    ];

    return allItems.filter(item => item.roles.includes(role));
  }

  // ============================================
  // Render Appbar
  // ============================================
  async function renderAppbar(containerId = 'mainNavbar') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get current user
    if (typeof PMTwinData !== 'undefined') {
      currentUser = PMTwinData.Sessions.getCurrentUser();
    }

    if (!currentUser) {
      // Render public navigation
      renderPublicNavbar(container);
      return;
    }

    // Load menu items
    await loadMenuItems();

    const basePath = getBasePath();
    const currentPath = window.location.pathname;

    let html = `
      <div class="container">
        <div class="navbar-content">
          <a href="${basePath}dashboard/" class="navbar-brand">PMTwin</a>
          <button class="navbar-toggle" id="navbarToggle" aria-label="Toggle navigation">☰</button>
          <ul class="navbar-nav" id="navbarNav">
    `;

    // Add main navigation items (limited in appbar)
    const mainItems = menuItems.filter(item => 
      ['dashboard', 'projects', 'proposals', 'matches', 'opportunities'].includes(item.id)
    ).slice(0, 5);

    mainItems.forEach(item => {
      const isActive = currentPath.includes(item.route.replace(basePath, ''));
      html += `
        <li>
          <a href="${item.route}" class="navbar-link ${isActive ? 'active' : ''}">
            ${item.icon || ''} ${item.label}
          </a>
        </li>
      `;
    });

    // User menu
    html += `
            <li style="margin-left: auto;">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <a href="${basePath}notifications/" class="navbar-link" style="position: relative;">
                  <i class="ph ph-bell"></i>
                  ${getNotificationBadge()}
                </a>
                <div style="position: relative;">
                  <button id="userMenuBtn" class="navbar-link" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                    <span>${currentUser.name || currentUser.email}</span>
                    <i class="ph ph-caret-down"></i>
                  </button>
                  <div id="userMenuDropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius); box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 200px; z-index: 1000;">
                    <a href="${basePath}profile/" class="navbar-link" style="display: block; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);"><i class="ph ph-user"></i> Profile</a>
                    <a href="${basePath}notifications/" class="navbar-link" style="display: block; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);"><i class="ph ph-bell"></i> Notifications</a>
                    ${currentUser.role === 'admin' ? `<a href="${basePath}admin/" class="navbar-link" style="display: block; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);"><i class="ph ph-gear"></i> Admin</a>` : ''}
                    <button onclick="Navigation.logout()" class="navbar-link logout-link" style="display: block; width: 100%; text-align: left; padding: 0.75rem 1rem; background: none; border: none; cursor: pointer;"><i class="ph ph-sign-out"></i> Logout</button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Setup mobile toggle
    setupMobileToggle();
    setupUserMenu();
  }

  function renderPublicNavbar(container) {
    const basePath = getBasePath();
    container.innerHTML = `
      <div class="container">
        <div class="navbar-content">
          <a href="${basePath}home/" class="navbar-brand">PMTwin</a>
          <button class="navbar-toggle" id="navbarToggle" aria-label="Toggle navigation">☰</button>
          <ul class="navbar-nav" id="navbarNav">
            <li><a href="${basePath}home/" class="navbar-link">Home</a></li>
            <li><a href="${basePath}discovery/" class="navbar-link">Discover Projects</a></li>
            <li><a href="${basePath}wizard/" class="navbar-link">PMTwin Wizard</a></li>
            <li><a href="${basePath}knowledge/" class="navbar-link">Knowledge Hub</a></li>
            <li><a href="${basePath}signup/" class="navbar-link">Sign Up</a></li>
            <li><a href="${basePath}login/" class="navbar-link">Login</a></li>
          </ul>
        </div>
      </div>
    `;
    setupMobileToggle();
  }

  function getNotificationBadge() {
    if (typeof PMTwinData !== 'undefined' && currentUser?.id) {
      try {
        const unreadNotifications = PMTwinData.Notifications.getUnread(currentUser.id);
        const unreadCount = unreadNotifications ? unreadNotifications.length : 0;
        if (unreadCount > 0) {
          return `<span style="position: absolute; top: -8px; right: -8px; background: var(--color-danger, #dc3545); color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">${unreadCount > 9 ? '9+' : unreadCount}</span>`;
        }
      } catch (error) {
        console.warn('Error getting notification count:', error);
      }
    }
    return '';
  }

  function setupMobileToggle() {
    const toggle = document.getElementById('navbarToggle');
    const nav = document.getElementById('navbarNav');
    if (toggle && nav) {
      toggle.onclick = () => {
        nav.classList.toggle('show');
      };
    }
  }

  function setupUserMenu() {
    const btn = document.getElementById('userMenuBtn');
    const menu = document.getElementById('userMenuDropdown');
    if (btn && menu) {
      btn.onclick = (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      };
      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
          menu.style.display = 'none';
        }
      });
    }
  }

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
  // Render Sidebar
  // ============================================
  async function renderSidebar(containerId = 'sidebar') {
    // Ensure Phosphor Icons CSS is loaded
    loadPhosphorIcons();
    
    let container = document.getElementById(containerId);
    
    // If sidebar doesn't exist, create it
    if (!container) {
      console.warn('[Navigation] Sidebar container not found, creating it...');
      createSidebarStructure();
      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 50));
      container = document.getElementById(containerId);
      if (!container) {
        console.error('[Navigation] Failed to create sidebar container');
        return;
      }
    }

    // Get current user
    if (typeof PMTwinData !== 'undefined') {
      currentUser = PMTwinData.Sessions.getCurrentUser();
    }

    if (!currentUser) {
      console.warn('[Navigation] No current user, clearing sidebar');
      container.innerHTML = '<div class="sidebar-header"><h2>Menu</h2></div><div class="sidebar-nav"><p style="padding: var(--spacing-4); color: var(--text-secondary);">Please log in to see menu items</p></div>';
      return;
    }

    // Load menu items
    await loadMenuItems();
    
    console.log('[Navigation] Rendering sidebar with', menuItems.length, 'menu items');
    console.log('[Navigation] Current user:', currentUser?.email, 'Role:', currentUser?.role);
    console.log('[Navigation] Menu items:', menuItems);

    const basePath = getBasePath();
    const currentPath = window.location.pathname;

    let html = `
      <div class="sidebar-header">
        <h2>Menu</h2>
        <button id="sidebarClose" class="sidebar-close" aria-label="Close sidebar"><i class="ph ph-x"></i></button>
      </div>
      <nav class="sidebar-nav">
        <ul class="sidebar-menu">
    `;

    // If no menu items, show a message with debugging info
    if (menuItems.length === 0) {
      console.error('[Navigation] CRITICAL: No menu items to display!');
      console.error('[Navigation] User:', currentUser);
      console.error('[Navigation] User role:', currentUser?.role);
      
      html += `
        <li class="sidebar-menu-item">
          <div style="padding: var(--spacing-4); color: var(--text-secondary); text-align: center;">
            <p style="color: var(--color-error); font-weight: bold;">⚠️ No menu items</p>
            <p style="font-size: var(--font-size-sm); margin-top: var(--spacing-2);">
              Check browser console (F12) for details
            </p>
            <button onclick="Navigation.refreshMenuItems()" class="btn btn-primary" style="margin-top: var(--spacing-3); width: 100%;">
              <i class="ph ph-arrow-clockwise"></i> Refresh Menu
            </button>
          </div>
        </li>
      `;
    }

    // First pass: determine active item
    let activeItemId = null;
    menuItems.forEach(item => {
      if (item.isSeparator || !item.route) return;
      
      // Check if this item or any of its children is active
      let isActive = false;
      if (item.route.startsWith('#')) {
        const hashRoute = item.route.substring(1);
        const currentHash = window.location.hash.substring(1);
        isActive = currentHash === hashRoute || currentHash.startsWith(hashRoute + '/') || currentHash.startsWith(hashRoute + '?');
      } else {
        const normalizedRoute = item.route.replace(basePath, '').replace(/\/$/, '').replace(/\.html$/, '');
        const normalizedPath = currentPath.replace(/\/$/, '').replace(/\.html$/, '');
        isActive = normalizedPath === normalizedRoute || normalizedPath.startsWith(normalizedRoute + '/');
      }
      
      // Check children if this is a grouped item
      if ((item.hasChildren || item.isGroup) && item.children && Array.isArray(item.children)) {
        item.children.forEach(child => {
          if (!child.route) return;
          let childIsActive = false;
          if (child.route.startsWith('#')) {
            const hashRoute = child.route.substring(1);
            const currentHash = window.location.hash.substring(1);
            childIsActive = currentHash === hashRoute || currentHash.startsWith(hashRoute + '/') || currentHash.startsWith(hashRoute + '?');
          } else {
            const normalizedRoute = child.route.replace(basePath, '').replace(/\/$/, '').replace(/\.html$/, '');
            const normalizedPath = currentPath.replace(/\/$/, '').replace(/\.html$/, '');
            childIsActive = normalizedPath === normalizedRoute || normalizedPath.startsWith(normalizedRoute + '/');
          }
          if (childIsActive) {
            activeItemId = child.id;
            isActive = false; // Parent is not active if child is active
          }
        });
      }
      
      if (isActive && !activeItemId) {
        activeItemId = item.id;
      }
    });

    // Second pass: render items
    menuItems.forEach(item => {
      // Skip separators
      if (item.isSeparator) {
        html += `<li class="sidebar-menu-separator"><hr style="margin: 0.5rem 0; border: none; border-top: 1px solid var(--border-color, #e0e0e0);"></li>`;
        return;
      }
      
      // Handle grouped items with children (dropdown menus)
      if ((item.hasChildren || item.isGroup) && item.children && Array.isArray(item.children) && item.children.length > 0) {
        const isExpanded = item.isExpanded || (activeItemId && item.children.some(child => child.id === activeItemId));
        const groupId = `group-${item.id}`;
        
        html += `
          <li class="sidebar-menu-group ${isExpanded ? 'active' : ''}">
            <button type="button" class="sidebar-group-toggle" onclick="Navigation.toggleMenuGroup(this, '${groupId}')" id="${groupId}-toggle">
              <span class="sidebar-icon">${item.icon || '<i class="ph ph-folder"></i>'}</span>
              <span class="sidebar-label">${item.label}</span>
              <span class="sidebar-chevron"><i class="ph ph-caret-down"></i></span>
            </button>
            <ul class="sidebar-submenu" id="${groupId}" style="display: ${isExpanded ? 'block' : 'none'};">
        `;
        
        // Render children
        item.children.forEach(child => {
          const childIsActive = activeItemId === child.id;
          const childIcon = child.icon || item.icon || '<i class="ph ph-file-text"></i>';
          
          html += `
            <li class="sidebar-menu-item ${childIsActive ? 'active' : ''}">
              <a href="${child.route}" class="sidebar-link" style="padding-left: 2rem;">
                <span class="sidebar-icon">${childIcon}</span>
                <span class="sidebar-label">${child.label}</span>
              </a>
            </li>
          `;
        });
        
        html += `
            </ul>
          </li>
        `;
        return;
      }
      
      // Regular menu items
      const isActive = activeItemId === item.id;
      const itemClass = item.isCategoryHeader ? 'sidebar-menu-category' : '';
      const indentStyle = item.indent ? 'padding-left: 2rem;' : '';
      const itemIcon = item.icon || '<i class="ph ph-file-text"></i>';
      
      html += `
        <li class="sidebar-menu-item ${isActive ? 'active' : ''} ${itemClass}">
          <a href="${item.route}" class="sidebar-link" style="${indentStyle}">
            <span class="sidebar-icon">${itemIcon}</span>
            <span class="sidebar-label">${item.label}</span>
          </a>
        </li>
      `;
    });

    html += `
        </ul>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${currentUser.name || 'User'}</div>
            <div class="sidebar-user-role">${currentUser.role || 'guest'}</div>
          </div>
        </div>
        <button onclick="Navigation.logout()" class="sidebar-logout">
          <i class="ph ph-sign-out"></i> Logout
        </button>
      </div>
    `;

    container.innerHTML = html;

    // Setup close button
    const closeBtn = document.getElementById('sidebarClose');
    if (closeBtn) {
      closeBtn.onclick = () => toggleSidebar(false);
    }
  }

  // ============================================
  // Sidebar Toggle
  // ============================================
  function toggleSidebar(open = null) {
    sidebarOpen = open !== null ? open : !sidebarOpen;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) {
      if (sidebarOpen) {
        sidebar.classList.add('open');
        sidebar.style.transform = 'translateX(0)';
      } else {
        // Only hide on mobile, keep visible on desktop
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
          sidebar.style.transform = 'translateX(-100%)';
        }
      }
    }
    
    if (overlay) {
      if (sidebarOpen && window.innerWidth <= 768) {
        overlay.classList.add('show');
      } else {
        overlay.classList.remove('show');
      }
    }
  }

  // ============================================
  // Create Sidebar Structure
  // ============================================
  function createSidebarStructure() {
    // Check if sidebar already exists
    if (document.getElementById('sidebar')) return;

    const sidebarHTML = `
      <div id="sidebarOverlay" class="sidebar-overlay" onclick="Navigation.toggleSidebar(false)"></div>
      <aside id="sidebar" class="sidebar">
        <!-- Sidebar content will be rendered here -->
      </aside>
    `;

    document.body.insertAdjacentHTML('beforeend', sidebarHTML);
  }

  // ============================================
  // Toggle Menu Group
  // ============================================
  function toggleMenuGroup(button, groupId) {
    event.preventDefault();
    event.stopPropagation();
    
    const submenu = document.getElementById(groupId);
    const groupItem = button.closest('.sidebar-menu-group');
    
    if (!submenu || !groupItem) return;
    
    const isExpanded = submenu.style.display !== 'none';
    
    if (isExpanded) {
      submenu.style.display = 'none';
      groupItem.classList.remove('active');
    } else {
      submenu.style.display = 'block';
      groupItem.classList.add('active');
    }
  }

  // ============================================
  // Logout
  // ============================================
  function logout() {
    if (typeof PMTwinAuth !== 'undefined') {
      PMTwinAuth.logout();
    }
    const basePath = getBasePath();
    window.location.href = `${basePath}login/`;
  }

  // ============================================
  // Initialize Navigation
  // ============================================
  async function init(options = {}) {
    const {
      showSidebar = true,
      appbarId = 'mainNavbar',
      sidebarId = 'sidebar',
      sidebarAlwaysOpen = true
    } = options;

    console.log('[Navigation] Initializing navigation with options:', options);

    // Render appbar
    await renderAppbar(appbarId);

    // Create and render sidebar if requested
    if (showSidebar) {
      createSidebarStructure();
      
      // Wait a moment for sidebar to be created
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await renderSidebar(sidebarId);
      
      // Add sidebar toggle button to appbar
      const navbar = document.getElementById(appbarId);
      if (navbar) {
        // Remove existing toggle if any
        const existingToggle = navbar.querySelector('.sidebar-toggle');
        if (existingToggle) {
          existingToggle.remove();
        }
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '<i class="ph ph-list"></i>';
        toggleBtn.onclick = () => toggleSidebar();
        toggleBtn.style.cssText = 'background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0.5rem; margin-right: 1rem; color: var(--text-primary);';
        toggleBtn.setAttribute('aria-label', 'Toggle sidebar');
        
        const navbarContent = navbar.querySelector('.navbar-content');
        if (navbarContent) {
          navbarContent.insertBefore(toggleBtn, navbarContent.firstChild.nextSibling);
        }
      }
      
      // Auto-open sidebar on desktop if requested
      if (sidebarAlwaysOpen && window.innerWidth > 768) {
        // Force sidebar to be visible on desktop
        const sidebar = document.getElementById(sidebarId);
        if (sidebar) {
          sidebar.classList.add('open');
          sidebar.style.transform = 'translateX(0)';
          console.log('[Navigation] Sidebar opened on desktop');
        }
      }
    }
    
    // Adjust main content margin if layout exists
    if (typeof AppLayout !== 'undefined') {
      AppLayout.adjustMainContentMargin();
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.Navigation = {
    init,
    renderAppbar,
    renderSidebar,
    toggleSidebar,
    toggleMenuGroup,
    logout,
    loadMenuItems,
    refreshMenuItems
  };

})();

