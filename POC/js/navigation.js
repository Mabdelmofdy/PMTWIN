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
  async function loadMenuItems() {
    if (menuItems.length > 0) return menuItems;

    try {
      if (typeof DashboardService !== 'undefined') {
        const result = await DashboardService.getMenuItems();
        if (result.success) {
          menuItems = result.items || [];
          return menuItems;
        }
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    }

    // Fallback menu items
    return getFallbackMenuItems();
  }

  function getFallbackMenuItems() {
    if (!currentUser) return [];
    
    const basePath = getBasePath();
    const role = currentUser.role;

    const allItems = [
      { id: 'dashboard', label: 'Dashboard', route: `${basePath}dashboard/`, icon: '📊', roles: ['admin', 'entity', 'individual'] },
      { id: 'projects', label: 'My Projects', route: `${basePath}projects/`, icon: '🏗️', roles: ['admin', 'entity', 'individual'] },
      { id: 'create-project', label: 'Create Project', route: `${basePath}create-project/`, icon: '➕', roles: ['admin', 'entity'] },
      { id: 'proposals', label: 'Proposals', route: `${basePath}proposals/`, icon: '📄', roles: ['admin', 'entity', 'individual'] },
      { id: 'matches', label: 'Matches', route: `${basePath}matches/`, icon: '🔗', roles: ['admin', 'entity', 'individual'] },
      { id: 'opportunities', label: 'Opportunities', route: `${basePath}opportunities/`, icon: '✨', roles: ['admin', 'entity', 'individual'] },
      { id: 'pipeline', label: 'Pipeline', route: `${basePath}pipeline/`, icon: '📈', roles: ['admin', 'entity', 'individual'] },
      { id: 'collaboration', label: 'Collaboration', route: `${basePath}collaboration/`, icon: '🤝', roles: ['admin', 'entity', 'individual'] },
      { id: 'profile', label: 'Profile', route: `${basePath}profile/`, icon: '👤', roles: ['admin', 'entity', 'individual'] },
      { id: 'notifications', label: 'Notifications', route: `${basePath}notifications/`, icon: '🔔', roles: ['admin', 'entity', 'individual'] },
      { id: 'admin', label: 'Admin Dashboard', route: `${basePath}admin/`, icon: '⚙️', roles: ['admin'] },
      { id: 'admin-vetting', label: 'User Vetting', route: `${basePath}admin-vetting/`, icon: '✅', roles: ['admin'] },
      { id: 'admin-users-management', label: 'User Management', route: `${basePath}users-management/`, icon: '👥', roles: ['admin'] },
      { id: 'admin-models-management', label: 'Models Management', route: `${basePath}models-management/`, icon: '🤝', roles: ['admin'] },
      { id: 'admin-moderation', label: 'Moderation', route: `${basePath}admin-moderation/`, icon: '🛡️', roles: ['admin'] },
      { id: 'admin-analytics', label: 'Analytics', route: `${basePath}analytics/`, icon: '📈', roles: ['admin'] },
      { id: 'admin-audit', label: 'Audit Trail', route: `${basePath}admin-audit/`, icon: '📋', roles: ['admin'] },
      { id: 'admin-reports', label: 'Reports', route: `${basePath}admin-reports/`, icon: '📊', roles: ['admin'] },
      { id: 'admin-settings', label: 'Settings', route: `${basePath}settings/`, icon: '⚙️', roles: ['admin'] }
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
                  🔔
                  ${getNotificationBadge()}
                </a>
                <div style="position: relative;">
                  <button id="userMenuBtn" class="navbar-link" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                    <span>${currentUser.name || currentUser.email}</span>
                    <span>▼</span>
                  </button>
                  <div id="userMenuDropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius); box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 200px; z-index: 1000;">
                    <a href="${basePath}profile/" class="navbar-link" style="display: block; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);">👤 Profile</a>
                    <a href="${basePath}notifications/" class="navbar-link" style="display: block; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);">🔔 Notifications</a>
                    ${currentUser.role === 'admin' ? `<a href="${basePath}admin/" class="navbar-link" style="display: block; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);">⚙️ Admin</a>` : ''}
                    <button onclick="Navigation.logout()" class="navbar-link logout-link" style="display: block; width: 100%; text-align: left; padding: 0.75rem 1rem; background: none; border: none; cursor: pointer;">🚪 Logout</button>
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
  // Render Sidebar
  // ============================================
  async function renderSidebar(containerId = 'sidebar') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get current user
    if (typeof PMTwinData !== 'undefined') {
      currentUser = PMTwinData.Sessions.getCurrentUser();
    }

    if (!currentUser) {
      container.innerHTML = '';
      return;
    }

    // Load menu items
    await loadMenuItems();

    const basePath = getBasePath();
    const currentPath = window.location.pathname;

    let html = `
      <div class="sidebar-header">
        <h2>Menu</h2>
        <button id="sidebarClose" class="sidebar-close" aria-label="Close sidebar">×</button>
      </div>
      <nav class="sidebar-nav">
        <ul class="sidebar-menu">
    `;

    menuItems.forEach(item => {
      // Skip separators
      if (item.isSeparator) {
        html += `<li class="sidebar-menu-separator"><hr style="margin: 0.5rem 0; border: none; border-top: 1px solid var(--border-color, #e0e0e0);"></li>`;
        return;
      }
      
      // Check if route is active (handle both hash routes and path routes)
      let isActive = false;
      if (item.route.startsWith('#')) {
        // Hash route - check against window.location.hash
        const hashRoute = item.route.substring(1); // Remove #
        const currentHash = window.location.hash.substring(1); // Remove #
        isActive = currentHash === hashRoute || currentHash.startsWith(hashRoute + '/') || currentHash.startsWith(hashRoute + '?');
      } else {
        // Path route - check against current path
        isActive = currentPath.includes(item.route.replace(basePath, ''));
      }
      
      const itemClass = item.isCategoryHeader ? 'sidebar-menu-category' : '';
      const indentStyle = item.indent ? 'padding-left: 2rem;' : '';
      
      html += `
        <li class="sidebar-menu-item ${isActive ? 'active' : ''} ${itemClass}">
          <a href="${item.route}" class="sidebar-link" style="${indentStyle}">
            <span class="sidebar-icon">${item.icon || '📄'}</span>
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
          🚪 Logout
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
      } else {
        sidebar.classList.remove('open');
      }
    }
    
    if (overlay) {
      if (sidebarOpen) {
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
      sidebarId = 'sidebar'
    } = options;

    // Render appbar
    await renderAppbar(appbarId);

    // Create and render sidebar if requested
    if (showSidebar) {
      createSidebarStructure();
      await renderSidebar(sidebarId);
      
      // Add sidebar toggle button to appbar
      const navbar = document.getElementById(appbarId);
      if (navbar) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.onclick = () => toggleSidebar();
        toggleBtn.style.cssText = 'background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0.5rem; margin-right: 1rem;';
        
        const navbarContent = navbar.querySelector('.navbar-content');
        if (navbarContent) {
          navbarContent.insertBefore(toggleBtn, navbarContent.firstChild.nextSibling);
        }
      }
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
    logout,
    loadMenuItems
  };

})();

