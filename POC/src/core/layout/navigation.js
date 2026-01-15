/**
 * PMTwin Central Navigation Component
 * Provides appbar and sidebar navigation for authenticated users
 */

(function() {
  'use strict';

  let menuItems = [];
  let currentUser = null;
  let sidebarOpen = false;
  let sidebarMinimized = false;

  // ============================================
  // Get Base Path Helper (kept for backward compatibility)
  // ============================================
  function getBasePath() {
    // Check if we're on Live Server (port 5503) - use full paths to avoid 404 errors
    const isLiveServer = window.location.port === '5503' || (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
    
    if (isLiveServer) {
      // For Live Server, return empty string and routes will be converted to full paths
      return '';
    }
    
    // For other servers: count all path segments to determine depth
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split, filter out empty strings and HTML files
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    
    // Count how many directory levels deep we are
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  // ============================================
  // Helper to convert route to full path
  // Uses centralized NavRoutes when available
  // ============================================
  function getRoute(routePath) {
    // If NavRoutes is available, use it
    if (typeof window.NavRoutes !== 'undefined') {
      // Check if routePath is a route key (e.g., 'dashboard', 'admin-reports')
      if (window.NavRoutes.NAV_ROUTES[routePath]) {
        const route = window.NavRoutes.getRoute(routePath, { useLiveServer: true });
        return route;
      }
      
      // Otherwise, normalize the URL
      return window.NavRoutes.toHtmlUrl(routePath);
    }
    
    // Fallback to old behavior if NavRoutes not loaded
    const isLiveServer = window.location.port === '5503' || (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
    
    if (isLiveServer && routePath && routePath !== '#' && !routePath.startsWith('http')) {
      // Handle query strings (e.g., "collaboration/?category=1")
      const [pathPart, queryPart] = routePath.split('?');
      
      // Convert relative paths like "dashboard/" or "../dashboard/" to full paths
      let cleanPath = pathPart.replace(/^\.\.\//g, '').replace(/\/$/, '');
      
      // Handle special cases
      if (cleanPath.endsWith('.html')) {
        // Already a file path
        return `http://127.0.0.1:5503/POC/pages/${cleanPath}${queryPart ? '?' + queryPart : ''}`;
      } else if (cleanPath.includes('/')) {
        // Nested path like "collaboration/my-collaborations/"
        return `http://127.0.0.1:5503/POC/pages/${cleanPath}/index.html${queryPart ? '?' + queryPart : ''}`;
      } else {
        // Simple path like "dashboard/"
        return `http://127.0.0.1:5503/POC/pages/${cleanPath}/index.html${queryPart ? '?' + queryPart : ''}`;
      }
    }
    
    return routePath;
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
    
    // Helper to get route - use NAV_ROUTES if available, otherwise use getRoute()
    function getRouteForMenu(routeKey, fallbackPath) {
      if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES[routeKey]) {
        return window.NavRoutes.getRoute(routeKey, { useLiveServer: true });
      }
      return getRoute(`${basePath}${fallbackPath}`);
    }

    const allItems = [
      { id: 'dashboard', label: 'Dashboard', route: getRouteForMenu('dashboard', 'dashboard/'), icon: '<i class="ph ph-gauge"></i>', roles: ['admin', 'entity', 'individual'] },
      
      // NEW OPPORTUNITY WORKFLOW ITEMS ONLY:
      { id: 'opportunities', label: 'Opportunities', route: getRouteForMenu('opportunities', 'opportunities/'), icon: '<i class="ph ph-sparkle"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'create-opportunity', label: 'Create Opportunity', route: getRouteForMenu('create-opportunity', 'opportunities/create/'), icon: '<i class="ph ph-plus-circle"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'matches', label: 'Matches', route: getRouteForMenu('matches', 'matches/'), icon: '<i class="ph ph-link"></i>', roles: ['admin', 'entity', 'individual'] },
      { id: 'proposals', label: 'Proposals', route: getRouteForMenu('proposals', 'proposals/'), icon: '<i class="ph ph-file-text"></i>', roles: ['admin', 'entity', 'individual'] },
      
      // REMOVED LEGACY ITEMS:
      // - My Projects (legacy - removed)
      // - Projects (legacy - removed)
      // - Create Project (legacy - removed)
      // - Pipeline (legacy - removed)
      // - My Services (legacy - removed)
      { 
        id: 'collaboration', 
        label: 'Collaboration', 
        route: getRouteForMenu('collaboration', 'collaboration/'), 
        icon: '<i class="ph ph-handshake"></i>', 
        roles: ['admin', 'entity', 'individual'],
        hasChildren: true,
        isGroup: true,
        children: [
          // Main Features
          { id: 'collab-my-collaborations', label: 'My Collaborations', route: getRouteForMenu('collab-my-collaborations', 'collaboration/my-collaborations/'), icon: '<i class="ph ph-folder"></i>', roles: ['admin', 'entity', 'individual'] },
          { id: 'collab-opportunities', label: 'Browse Opportunities', route: getRouteForMenu('collab-opportunities', 'collaboration/opportunities/'), icon: '<i class="ph ph-sparkle"></i>', roles: ['admin', 'entity', 'individual'] },
          { id: 'collab-applications', label: 'My Applications', route: getRouteForMenu('collab-applications', 'collaboration/applications/'), icon: '<i class="ph ph-file-text"></i>', roles: ['admin', 'entity', 'individual'] },
          { id: 'collab-separator', label: '---', route: '#', icon: '', isSeparator: true, roles: ['admin', 'entity', 'individual'] },
          // Simplified Model Categories with Sub-Features
          { 
            id: 'collab-project-based', 
            label: 'Project-Based', 
            route: typeof window.NavRoutes !== 'undefined' ? window.NavRoutes.getRouteWithQuery('collaboration', { category: 1 }) : getRoute(`${basePath}collaboration/?category=1`), 
            icon: '<i class="ph ph-buildings"></i>', 
            roles: ['admin', 'entity', 'individual'],
            hasChildren: true,
            isGroup: true,
            children: [
              { id: 'collab-task-based', label: 'Task-Based Engagement', route: getRouteForMenu('collab-task-based', 'collaboration/task-based/'), icon: '<i class="ph ph-file-text"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-consortium', label: 'Consortium', route: getRouteForMenu('collab-consortium', 'collaboration/consortium/'), icon: '<i class="ph ph-users-three"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-jv', label: 'Project-Specific JV', route: getRouteForMenu('collab-jv', 'collaboration/joint-venture/'), icon: '<i class="ph ph-handshake"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-spv', label: 'Special Purpose Vehicle', route: getRouteForMenu('collab-spv', 'collaboration/spv/'), icon: '<i class="ph ph-building-office"></i>', roles: ['admin', 'entity', 'individual'] }
            ]
          },
          { 
            id: 'collab-strategic', 
            label: 'Strategic Partnerships', 
            route: typeof window.NavRoutes !== 'undefined' ? window.NavRoutes.getRouteWithQuery('collaboration', { category: 2 }) : getRoute(`${basePath}collaboration/?category=2`), 
            icon: '<i class="ph ph-handshake"></i>', 
            roles: ['admin', 'entity', 'individual'],
            hasChildren: true,
            isGroup: true,
            children: [
              { id: 'collab-strategic-jv', label: 'Strategic Joint Venture', route: getRouteForMenu('collab-strategic-jv', 'collaboration/strategic-jv/'), icon: '<i class="ph ph-handshake"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-strategic-alliance', label: 'Strategic Alliance', route: getRouteForMenu('collab-strategic-alliance', 'collaboration/strategic-alliance/'), icon: '<i class="ph ph-link"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-mentorship', label: 'Mentorship Program', route: getRouteForMenu('collab-mentorship', 'collaboration/mentorship/'), icon: '<i class="ph ph-graduation-cap"></i>', roles: ['admin', 'entity', 'individual'] }
            ]
          },
          { 
            id: 'collab-resources', 
            label: 'Resource Pooling', 
            route: typeof window.NavRoutes !== 'undefined' ? window.NavRoutes.getRouteWithQuery('collaboration', { category: 3 }) : getRoute(`${basePath}collaboration/?category=3`), 
            icon: '<i class="ph ph-package"></i>', 
            roles: ['admin', 'entity', 'individual'],
            hasChildren: true,
            isGroup: true,
            children: [
              { id: 'collab-bulk-purchasing', label: 'Bulk Purchasing', route: getRouteForMenu('collab-bulk-purchasing', 'collaboration/bulk-purchasing/'), icon: '<i class="ph ph-shopping-cart"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-co-ownership', label: 'Co-Ownership Pooling', route: getRouteForMenu('collab-co-ownership', 'collaboration/co-ownership/'), icon: '<i class="ph ph-users"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-resource-exchange', label: 'Resource Exchange', route: getRouteForMenu('collab-resource-exchange', 'collaboration/resource-exchange/'), icon: '<i class="ph ph-arrows-clockwise"></i>', roles: ['admin', 'entity', 'individual'] }
            ]
          },
          { 
            id: 'collab-hiring', 
            label: 'Hiring Resources', 
            route: typeof window.NavRoutes !== 'undefined' ? window.NavRoutes.getRouteWithQuery('collaboration', { category: 4 }) : getRoute(`${basePath}collaboration/?category=4`), 
            icon: '<i class="ph ph-briefcase"></i>', 
            roles: ['admin', 'entity', 'individual'],
            hasChildren: true,
            isGroup: true,
            children: [
              { id: 'collab-professional-hiring', label: 'Professional Hiring', route: getRouteForMenu('collab-professional-hiring', 'collaboration/professional-hiring/'), icon: '<i class="ph ph-user"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-consultant-hiring', label: 'Consultant Hiring', route: getRouteForMenu('collab-consultant-hiring', 'collaboration/consultant-hiring/'), icon: '<i class="ph ph-user-circle"></i>', roles: ['admin', 'entity', 'individual'] }
            ]
          },
          { 
            id: 'collab-competition', 
            label: 'Call for Competition', 
            route: typeof window.NavRoutes !== 'undefined' ? window.NavRoutes.getRouteWithQuery('collaboration', { category: 5 }) : getRoute(`${basePath}collaboration/?category=5`), 
            icon: '<i class="ph ph-trophy"></i>', 
            roles: ['admin', 'entity', 'individual'] 
          }
        ]
      },
      { id: 'notifications', label: 'Notifications', route: getRouteForMenu('notifications', 'notifications/'), icon: '<i class="ph ph-bell"></i>', roles: ['admin', 'entity', 'individual', 'project_lead', 'supplier', 'service_provider', 'professional', 'consultant', 'mentor'] },
      { id: 'admin', label: 'Admin Dashboard', route: getRouteForMenu('admin', 'admin/'), icon: '<i class="ph ph-gear"></i>', roles: ['admin'] },
      { id: 'admin-vetting', label: 'User Vetting', route: getRouteForMenu('admin-vetting', 'admin-vetting/'), icon: '<i class="ph ph-check-circle"></i>', roles: ['admin'] },
      { id: 'admin-users-management', label: 'User Management', route: getRouteForMenu('admin-users-management', 'admin/users-management/'), icon: '<i class="ph ph-users"></i>', roles: ['admin'] },
      { id: 'admin-models-management', label: 'Models Management', route: getRouteForMenu('admin-models-management', 'admin/models-management/'), icon: '<i class="ph ph-handshake"></i>', roles: ['admin'] },
      { id: 'admin-moderation', label: 'Moderation', route: getRouteForMenu('admin-moderation', 'admin-moderation/'), icon: '<i class="ph ph-shield-check"></i>', roles: ['admin'] },
      { id: 'admin-analytics', label: 'Analytics', route: getRouteForMenu('admin-analytics', 'admin/analytics/'), icon: '<i class="ph ph-chart-line"></i>', roles: ['admin'] },
      { id: 'admin-audit', label: 'Audit Trail', route: getRouteForMenu('admin-audit', 'admin-audit/'), icon: '<i class="ph ph-clipboard"></i>', roles: ['admin'] },
      { id: 'admin-reports', label: 'Reports', route: getRouteForMenu('admin-reports', 'admin-reports/'), icon: '<i class="ph ph-chart-bar"></i>', roles: ['admin'] },
      { id: 'admin-settings', label: 'Settings', route: getRouteForMenu('admin-settings', 'admin/settings/'), icon: '<i class="ph ph-gear"></i>', roles: ['admin'] }
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
          <a href="${getRoute(`${basePath}dashboard/`)}" class="navbar-brand">PMTwin</a>
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
          <a href="${item.route}" class="navbar-link ${isActive ? 'active' : ''}" onclick="Navigation.handleNavClick(event, '${item.route}');">
            ${item.icon || ''} ${item.label}
          </a>
        </li>
      `;
    });

    // Service Providers Directory link
    const isServiceProvidersActive = currentPath.includes('service-providers');
    html += `
      <li>
        <a href="${getRoute(`${basePath}service-providers/`)}" class="navbar-link ${isServiceProvidersActive ? 'active' : ''}" onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}service-providers/`)}');">
          <i class="ph ph-buildings"></i> Service Providers Directory
        </a>
      </li>
    `;

    // Enhanced Search bar
    html += `
            <li style="margin-left: auto; margin-right: 1rem;">
              <div style="position: relative; display: flex; align-items: center;">
                <input type="text" id="topbarSearch" placeholder="Search projects, users..." 
                  style="padding: 0.625rem 3rem 0.625rem 1rem; border: 1px solid var(--border-color); border-radius: 24px; width: 320px; font-size: 0.9rem; background: var(--bg-secondary); transition: all 0.3s ease; outline: none;"
                  onfocus="this.style.width='420px'; this.style.borderColor='var(--color-primary)'; this.style.boxShadow='0 0 0 3px rgba(var(--color-primary-rgb, 59, 130, 246), 0.1)';"
                  onblur="if(!this.value) {this.style.width='320px'; this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';}">
                <i class="ph ph-magnifying-glass" style="position: absolute; right: 1rem; color: var(--text-secondary); pointer-events: none; font-size: 1.125rem;"></i>
                <div style="position: absolute; right: 2.75rem; display: flex; align-items: center; gap: 0.25rem; pointer-events: none; opacity: 0.5;">
                  <kbd style="padding: 0.125rem 0.375rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.7rem; font-family: monospace; color: var(--text-secondary);">⌘</kbd>
                  <kbd style="padding: 0.125rem 0.375rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.7rem; font-family: monospace; color: var(--text-secondary);">K</kbd>
                </div>
                <div id="searchResults" style="display: none; position: absolute; top: 100%; left: 0; right: 0; margin-top: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); max-height: 450px; overflow-y: auto; z-index: 1000;">
                  <!-- Search results will appear here -->
                </div>
              </div>
            </li>
    `;

    // Enhanced Theme toggle
    html += `
            <li>
              <button id="themeToggleBtn" class="navbar-link" style="background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.2s;" 
                      title="Toggle theme (Ctrl+Shift+T)"
                      onmouseover="this.style.background='var(--bg-secondary)'" 
                      onmouseout="this.style.background='none'">
                <i class="ph ph-moon" id="themeIcon" style="font-size: 1.25rem;"></i>
              </button>
            </li>
    `;

    // Enhanced Quick actions menu
    html += `
            <li>
              <div style="position: relative;">
                <button id="quickActionsBtn" class="navbar-link" style="background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.2s;" 
                        title="Quick Actions"
                        onmouseover="this.style.background='var(--bg-secondary)'" 
                        onmouseout="this.style.background='none'">
                  <i class="ph ph-lightning" style="font-size: 1.25rem;"></i>
                </button>
                <div id="quickActionsDropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); min-width: 240px; z-index: 1000; overflow: hidden;">
                  <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 0.95rem; background: var(--bg-secondary);">Quick Actions</div>
                  <div style="padding: 0.5rem 0;">
                    <a href="${getRoute(`${basePath}projects/create/`)}" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; transition: background 0.2s;" 
                       onmouseover="this.style.background='var(--bg-secondary)'" 
                       onmouseout="this.style.background='transparent'"
                       onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}projects/create/`)}');">
                      <i class="ph ph-plus-circle" style="font-size: 1.25rem; color: var(--color-primary);"></i> 
                      <div style="flex: 1;">
                        <div style="font-weight: 500; font-size: 0.875rem;">Create Project</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Start a new project</div>
                      </div>
                    </a>
                    <a href="${getRoute(`${basePath}proposals/create/`)}" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; transition: background 0.2s;" 
                       onmouseover="this.style.background='var(--bg-secondary)'" 
                       onmouseout="this.style.background='transparent'"
                       onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}proposals/create/`)}');">
                      <i class="ph ph-file-text" style="font-size: 1.25rem; color: var(--color-primary);"></i> 
                      <div style="flex: 1;">
                        <div style="font-weight: 500; font-size: 0.875rem;">Create Proposal</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Submit a proposal</div>
                      </div>
                    </a>
                    <a href="${getRoute(`${basePath}collaboration/`)}" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; transition: background 0.2s;" 
                       onmouseover="this.style.background='var(--bg-secondary)'" 
                       onmouseout="this.style.background='transparent'"
                       onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}collaboration/`)}');">
                      <i class="ph ph-handshake" style="font-size: 1.25rem; color: var(--color-primary);"></i> 
                      <div style="flex: 1;">
                        <div style="font-weight: 500; font-size: 0.875rem;">New Collaboration</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Start collaborating</div>
                      </div>
                    </a>
                    <a href="${getRoute(`${basePath}wizard/`)}" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; transition: background 0.2s;" 
                       onmouseover="this.style.background='var(--bg-secondary)'" 
                       onmouseout="this.style.background='transparent'"
                       onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}wizard/`)}');">
                      <i class="ph ph-magic-wand" style="font-size: 1.25rem; color: var(--color-primary);"></i> 
                      <div style="flex: 1;">
                        <div style="font-weight: 500; font-size: 0.875rem;">AI Wizard</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Get recommendations</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </li>
    `;

    // Enhanced Notifications with dropdown
    const unreadNotifications = typeof PMTwinData !== 'undefined' && currentUser?.id 
      ? (PMTwinData.Notifications.getUnread(currentUser.id) || [])
      : [];
    const unreadCount = unreadNotifications.length;
    
    html += `
            <li>
              <div style="position: relative;">
                <button id="notificationsBtn" class="navbar-link" style="background: none; border: none; cursor: pointer; position: relative; padding: 0.5rem; border-radius: 8px; transition: all 0.2s;" 
                        onmouseover="this.style.background='var(--bg-secondary)'" 
                        onmouseout="this.style.background='none'"
                        title="Notifications (${unreadCount} unread)">
                  <i class="ph ph-bell" style="font-size: 1.25rem;"></i>
                  ${getNotificationBadge()}
                </button>
                <div id="notificationsDropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); min-width: 360px; max-width: 420px; max-height: 500px; overflow: hidden; z-index: 1000;">
                  <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
                    <div style="font-weight: 600; font-size: 1rem;">Notifications</div>
                    ${unreadCount > 0 ? `<span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">${unreadCount} new</span>` : ''}
                  </div>
                  <div id="notificationsList" style="max-height: 400px; overflow-y: auto;">
                    ${renderNotificationsDropdown(unreadNotifications.slice(0, 5))}
                  </div>
                  <div style="padding: 0.75rem 1rem; border-top: 1px solid var(--border-color); text-align: center; background: var(--bg-secondary);">
                    <a href="${getRoute(`${basePath}notifications/`)}" class="navbar-link" style="color: var(--color-primary); font-weight: 500; font-size: 0.875rem;" onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}notifications/`)}');">
                      View All Notifications
                    </a>
                  </div>
                </div>
              </div>
            </li>
    `;

    // Enhanced User menu with avatar
    const userInitials = getInitials(currentUser.name || currentUser.email);
    const userAvatar = currentUser.avatar || null;
    
    html += `
            <li>
              <div style="position: relative;">
                <button id="userMenuBtn" class="navbar-link" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; padding: 0.375rem 0.75rem; border-radius: 24px; transition: all 0.2s; border: 1px solid transparent;" 
                        onmouseover="this.style.background='var(--bg-secondary)'; this.style.borderColor='var(--border-color)';" 
                        onmouseout="this.style.background='none'; this.style.borderColor='transparent';">
                  ${userAvatar ? `
                    <img src="${userAvatar}" alt="${currentUser.name || 'User'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
                  ` : `
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.875rem; border: 2px solid var(--border-color);">
                      ${userInitials}
                    </div>
                  `}
                  <div style="display: flex; flex-direction: column; align-items: flex-start; line-height: 1.2;">
                    <span style="font-weight: 500; font-size: 0.875rem; color: var(--text-primary);">${currentUser.name || 'User'}</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">${getUserRoleLabel(currentUser.role)}</span>
                  </div>
                  <i class="ph ph-caret-down" style="font-size: 0.875rem; color: var(--text-secondary);"></i>
                </button>
                <div id="userMenuDropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); min-width: 260px; z-index: 1000; overflow: hidden;">
                  <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary);">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                      ${userAvatar ? `
                        <img src="${userAvatar}" alt="${currentUser.name || 'User'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
                      ` : `
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1.125rem; border: 2px solid var(--border-color);">
                          ${userInitials}
                        </div>
                      `}
                      <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.125rem;">${currentUser.name || 'User'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${currentUser.email || ''}</div>
                        <div style="font-size: 0.75rem; color: var(--color-primary); margin-top: 0.25rem;">${getUserRoleLabel(currentUser.role)}</div>
                      </div>
                    </div>
                  </div>
                  <div style="padding: 0.5rem 0;">
                    <a href="${getRoute(`${basePath}profile/`)}" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; transition: background 0.2s;" 
                       onmouseover="this.style.background='var(--bg-secondary)'" 
                       onmouseout="this.style.background='transparent'"
                       onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}profile/`)}');">
                      <i class="ph ph-user" style="font-size: 1.125rem;"></i> <span>My Profile</span>
                    </a>
                    <a href="${getRoute(`${basePath}settings/`)}" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; transition: background 0.2s;" 
                       onmouseover="this.style.background='var(--bg-secondary)'" 
                       onmouseout="this.style.background='transparent'"
                       onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}settings/`)}');">
                      <i class="ph ph-gear" style="font-size: 1.125rem;"></i> <span>Settings</span>
                    </a>
                    <a href="${getRoute(`${basePath}notifications/`)}" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; transition: background 0.2s;" 
                       onmouseover="this.style.background='var(--bg-secondary)'" 
                       onmouseout="this.style.background='transparent'"
                       onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}notifications/`)}');">
                      <i class="ph ph-bell" style="font-size: 1.125rem;"></i> <span>Notifications</span>
                      ${unreadCount > 0 ? `<span style="margin-left: auto; background: var(--color-primary); color: white; padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
                    </a>
                    ${currentUser.role === 'admin' || currentUser.role === 'platform_admin' ? `
                    <a href="${getRoute(`${basePath}admin/`)}" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; transition: background 0.2s; border-top: 1px solid var(--border-color); margin-top: 0.25rem; padding-top: 0.875rem;" 
                       onmouseover="this.style.background='var(--bg-secondary)'" 
                       onmouseout="this.style.background='transparent'"
                       onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}admin/`)}');">
                      <i class="ph ph-shield-check" style="font-size: 1.125rem; color: var(--color-primary);"></i> <span style="font-weight: 500;">Admin Portal</span>
                    </a>
                    ` : ''}
                    <a href="${getRoute(`${basePath}knowledge/`)}" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; transition: background 0.2s;" 
                       onmouseover="this.style.background='var(--bg-secondary)'" 
                       onmouseout="this.style.background='transparent'"
                       onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}knowledge/`)}');">
                      <i class="ph ph-question" style="font-size: 1.125rem;"></i> <span>Help & Support</span>
                    </a>
                    <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid var(--border-color);">
                    <button onclick="Navigation.logout()" class="navbar-link logout-link" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; text-align: left; padding: 0.75rem 1rem; background: none; border: none; cursor: pointer; color: var(--color-error, #dc2626); transition: background 0.2s;" 
                            onmouseover="this.style.background='var(--bg-secondary)'" 
                            onmouseout="this.style.background='transparent'">
                      <i class="ph ph-sign-out" style="font-size: 1.125rem;"></i> <span style="font-weight: 500;">Logout</span>
                    </button>
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
    setupNotifications();
    setupQuickActions();
    setupSearch();
    setupNavLinks();
    setupThemeToggle();
  }

  function renderPublicNavbar(container) {
    const basePath = getBasePath();
    
    // Helper to get route
    function getRouteForNav(routeKey, fallbackPath) {
      if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES[routeKey]) {
        return window.NavRoutes.getRoute(routeKey, { useLiveServer: true });
      }
      return getRoute(`${basePath}${fallbackPath}`);
    }
    
    container.innerHTML = `
      <div class="container">
        <div class="navbar-content">
          <a href="${getRouteForNav('home', 'home/')}" class="navbar-brand">PMTwin</a>
          <button class="navbar-toggle" id="navbarToggle" aria-label="Toggle navigation">☰</button>
          <ul class="navbar-nav" id="navbarNav">
            <li><a href="${getRouteForNav('home', 'home/')}" class="navbar-link">Home</a></li>
            <li><a href="${getRouteForNav('discovery', 'discovery/')}" class="navbar-link">Discover Projects</a></li>
            <li><a href="${getRouteForNav('wizard', 'wizard/')}" class="navbar-link">PMTwin Wizard</a></li>
            <li><a href="${getRouteForNav('knowledge', 'knowledge/')}" class="navbar-link">Knowledge Hub</a></li>
            <li><a href="${getRouteForNav('service-providers', 'service-providers/')}" class="navbar-link">Service Providers Directory</a></li>
            <li><a href="${getRouteForNav('signup', 'signup/')}" class="navbar-link">Sign Up</a></li>
            <li><a href="${getRouteForNav('login', 'login/')}" class="navbar-link">Login</a></li>
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
          return `<span class="notification-badge" style="position: absolute; top: -2px; right: -2px; min-width: 18px; height: 18px; padding: 0 4px; background: var(--color-error, #dc2626); color: white; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: var(--font-weight-bold, 700); border: 2px solid var(--bg-primary, white); box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${unreadCount > 99 ? '99+' : unreadCount}</span>`;
        }
      } catch (error) {
        console.warn('Error getting notification count:', error);
      }
    }
    return '';
  }

  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function getUserRoleLabel(role) {
    const roleLabels = {
      'admin': 'Administrator',
      'platform_admin': 'Platform Admin',
      'beneficiary': 'Beneficiary',
      'vendor': 'Vendor',
      'service_provider': 'Service Provider',
      'skill_service_provider': 'Service Provider',
      'sub_contractor': 'Sub-Contractor',
      'consultant': 'Consultant',
      'individual': 'Individual',
      'entity': 'Entity',
      'project_lead': 'Project Lead',
      'professional': 'Professional',
      'supplier': 'Supplier'
    };
    return roleLabels[role] || role || 'User';
  }

  function renderNotificationsDropdown(notifications) {
    if (!notifications || notifications.length === 0) {
      return `
        <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
          <i class="ph ph-bell-slash" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
          <div style="font-size: 0.875rem;">No new notifications</div>
        </div>
      `;
    }

    let html = '';
    notifications.forEach(notif => {
      const timeAgo = getTimeAgo(notif.createdAt || notif.timestamp);
      const icon = getNotificationIcon(notif.type);
      html += `
        <a href="${notif.url || '#'}" class="notification-item" 
           style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.875rem 1rem; border-bottom: 1px solid var(--border-color); transition: background 0.2s; text-decoration: none; color: inherit;"
           onmouseover="this.style.background='var(--bg-secondary)'" 
           onmouseout="this.style.background='transparent'"
           onclick="event.preventDefault(); Navigation.handleNavClick(event, '${notif.url || '#'}');">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--color-primary);">
            <i class="ph ${icon}" style="font-size: 1.25rem;"></i>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 500; font-size: 0.875rem; margin-bottom: 0.25rem; line-height: 1.3;">${notif.title || 'Notification'}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 0.25rem;">${notif.message || notif.body || ''}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">${timeAgo}</div>
          </div>
          ${!notif.read ? `<div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); flex-shrink: 0; margin-top: 0.25rem;"></div>` : ''}
        </a>
      `;
    });
    return html;
  }

  function getNotificationIcon(type) {
    const icons = {
      'project': 'ph-buildings',
      'proposal': 'ph-file-text',
      'match': 'ph-link',
      'collaboration': 'ph-handshake',
      'message': 'ph-chat-circle',
      'system': 'ph-bell',
      'alert': 'ph-warning',
      'success': 'ph-check-circle',
      'info': 'ph-info'
    };
    return icons[type] || 'ph-bell';
  }

  function getTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  }

  function setupMobileToggle() {
    const toggle = document.getElementById('navbarToggle');
    const nav = document.getElementById('navbarNav');
    if (toggle && nav) {
      toggle.onclick = (e) => {
        e.stopPropagation();
        nav.classList.toggle('show');
        // Update aria-expanded for accessibility
        const isOpen = nav.classList.contains('show');
        toggle.setAttribute('aria-expanded', isOpen);
        toggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
      };
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
          nav.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Open navigation menu');
        }
      });
      
      // Close menu when clicking a link (mobile navigation)
      const navLinks = nav.querySelectorAll('.navbar-link');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          nav.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Open navigation menu');
        });
      });
      
      // Initialize aria attributes
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', 'navbarNav');
    }
  }

  function setupUserMenu() {
    const btn = document.getElementById('userMenuBtn');
    const menu = document.getElementById('userMenuDropdown');
    if (btn && menu) {
      btn.onclick = (e) => {
        e.stopPropagation();
        // Close other dropdowns
        closeAllDropdowns();
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

  function setupNotifications() {
    const btn = document.getElementById('notificationsBtn');
    const dropdown = document.getElementById('notificationsDropdown');
    if (btn && dropdown) {
      btn.onclick = (e) => {
        e.stopPropagation();
        // Close other dropdowns
        closeAllDropdowns();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        
        // Refresh notifications when opened
        if (dropdown.style.display === 'block' && typeof PMTwinData !== 'undefined' && currentUser?.id) {
          const notifications = PMTwinData.Notifications.getUnread(currentUser.id) || [];
          const list = document.getElementById('notificationsList');
          if (list) {
            list.innerHTML = renderNotificationsDropdown(notifications.slice(0, 5));
          }
        }
      };
      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }
  }

  function setupQuickActions() {
    const btn = document.getElementById('quickActionsBtn');
    const menu = document.getElementById('quickActionsDropdown');
    if (btn && menu) {
      btn.onclick = (e) => {
        e.stopPropagation();
        // Close other dropdowns
        closeAllDropdowns();
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

  function setupSearch() {
    const searchInput = document.getElementById('topbarSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;

    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      clearTimeout(searchTimeout);
      
      if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
      }
      
      searchTimeout = setTimeout(() => {
        performSearch(query, searchResults);
      }, 300);
    });

    // Close search results on outside click
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
      }
    });

    // Handle Enter key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          handleSearchSubmit(query);
        }
      }
    });
  }

  function performSearch(query, resultsContainer) {
    // This is a basic search - can be enhanced with actual API calls
    const results = [];
    
    // Search in projects if available
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Projects) {
      try {
        const projects = PMTwinData.Projects.getAll();
        const matchingProjects = projects.filter(p => 
          (p.title && p.title.toLowerCase().includes(query.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 5);
        
        matchingProjects.forEach(project => {
          results.push({
            type: 'project',
            title: project.title,
            subtitle: project.description?.substring(0, 60) + '...',
            url: `${getBasePath()}project/?id=${project.id}`,
            icon: '<i class="ph ph-buildings"></i>'
          });
        });
      } catch (e) {
        console.warn('Error searching projects:', e);
      }
    }

    // If no results
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
          <i class="ph ph-magnifying-glass" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
          <p>No results found for "${query}"</p>
        </div>
      `;
    } else {
      let html = '<div style="padding: 0.5rem;">';
      results.forEach(result => {
        html += `
          <a href="${result.url}" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.25rem;" 
             onclick="Navigation.handleNavClick(event, '${result.url}');">
            <span style="font-size: 1.2rem;">${result.icon}</span>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 0.9rem;">${result.title}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">${result.subtitle || ''}</div>
            </div>
          </a>
        `;
      });
      html += '</div>';
      resultsContainer.innerHTML = html;
    }
    
    resultsContainer.style.display = 'block';
  }

  function handleSearchSubmit(query) {
    // Navigate to search results page or perform search
    const basePath = getBasePath();
    window.location.href = `${getRoute(`${basePath}discovery/`)}?search=${encodeURIComponent(query)}`;
  }

  function setupNavLinks() {
    // Setup click handlers for all navigation links in topbar
    const navLinks = document.querySelectorAll('#navbarNav .navbar-link[href]');
    navLinks.forEach(link => {
      if (!link.onclick) {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('#')) {
            handleNavClick(e, href);
          }
        });
      }
    });
  }

  function handleNavClick(event, url) {
    event.preventDefault();
    event.stopPropagation();
    
    // Close all dropdowns
    closeAllDropdowns();
    
    // Navigate to URL - normalize it first
    if (url) {
      // Normalize URL to ensure it ends with .html
      let normalizedUrl = url;
      if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.toHtmlUrl) {
        normalizedUrl = window.NavRoutes.toHtmlUrl(url);
      }
      window.location.href = normalizedUrl;
    }
  }

  function handleNotificationClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const basePath = getBasePath();
    handleNavClick(event, `${basePath}notifications/`);
  }

  function setupThemeToggle() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    if (!themeBtn || !themeIcon) return;

    // Load current theme from settings
    function getCurrentTheme() {
      try {
        const settings = localStorage.getItem('pmtwin_user_settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          return parsed.theme || 'light';
        }
      } catch (e) {
        console.warn('Error loading theme:', e);
      }
      return 'light';
    }

    // Update icon based on theme
    function updateThemeIcon(theme) {
      if (themeIcon) {
        if (theme === 'dark') {
          themeIcon.className = 'ph ph-sun';
          themeIcon.setAttribute('title', 'Switch to light mode');
        } else {
          themeIcon.className = 'ph ph-moon';
          themeIcon.setAttribute('title', 'Switch to dark mode');
        }
      }
    }

    // Initialize icon
    const currentTheme = getCurrentTheme();
    updateThemeIcon(currentTheme);

    // Toggle theme
    themeBtn.onclick = () => {
      const currentTheme = getCurrentTheme();
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      // Update settings
      try {
        const settings = localStorage.getItem('pmtwin_user_settings');
        let parsed = {};
        if (settings) {
          parsed = JSON.parse(settings);
        }
        parsed.theme = newTheme;
        localStorage.setItem('pmtwin_user_settings', JSON.stringify(parsed));
        
        // Apply theme
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${newTheme}`);
        
        // Update icon
        updateThemeIcon(newTheme);
      } catch (e) {
        console.error('Error toggling theme:', e);
      }
    };
  }

  function closeAllDropdowns() {
    const userMenu = document.getElementById('userMenuDropdown');
    const quickActions = document.getElementById('quickActionsDropdown');
    const searchResults = document.getElementById('searchResults');
    const notifications = document.getElementById('notificationsDropdown');
    
    if (userMenu) userMenu.style.display = 'none';
    if (quickActions) quickActions.style.display = 'none';
    if (searchResults) searchResults.style.display = 'none';
    if (notifications) notifications.style.display = 'none';
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
  // Get Badge Count for Menu Item
  // ============================================
  function getBadgeCount(itemId, currentUser) {
    if (!currentUser || typeof PMTwinData === 'undefined') return 0;
    
    try {
      switch(itemId) {
        case 'proposals':
          const proposals = PMTwinData.Proposals.getByProvider(currentUser.id);
          return proposals.filter(p => p.status === 'pending' || p.status === 'in_review').length;
        
        case 'matches':
        case 'opportunities':
          const matches = PMTwinData.Matches.getByProvider(currentUser.id);
          return matches.filter(m => m.score >= 80 && !m.viewed).length;
        
        case 'notifications':
          const notifications = PMTwinData.Notifications.getUnread(currentUser.id);
          return notifications ? notifications.length : 0;
        
        case 'collaboration':
        case 'collab-applications':
          const applications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
          return applications.filter(a => a.status === 'pending').length;
        
        case 'admin-vetting':
          if (currentUser.role === 'admin' || currentUser.role === 'platform_admin') {
            const pendingUsers = PMTwinData.Users.getByStatus('pending');
            return pendingUsers ? pendingUsers.length : 0;
          }
          return 0;
        
        default:
          return 0;
      }
    } catch (error) {
      console.warn('[Navigation] Error getting badge count for', itemId, error);
      return 0;
    }
  }

  // ============================================
  // Render Badge HTML
  // ============================================
  function renderBadge(count) {
    if (!count || count === 0) return '';
    return `<span class="sidebar-badge" style="margin-left: auto; background: var(--color-error, #dc2626); color: white; border-radius: 12px; padding: 0.125rem 0.5rem; font-size: 0.75rem; font-weight: var(--font-weight-bold, 700); min-width: 20px; text-align: center; display: inline-flex; align-items: center; justify-content: center;">${count > 99 ? '99+' : count}</span>`;
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
    
    // Get role from RBAC if available
    let userRole = currentUser?.role;
    if (typeof PMTwinRBAC !== 'undefined') {
      try {
        const rbacRole = await PMTwinRBAC.getCurrentUserRole();
        if (rbacRole) {
          userRole = rbacRole;
        }
      } catch (e) {
        console.warn('[Navigation] Could not get RBAC role:', e);
      }
    }
    
    console.log('[Navigation] Rendering sidebar with', menuItems.length, 'menu items');
    console.log('[Navigation] Current user:', currentUser?.email, 'Role (from user):', currentUser?.role, 'Role (from RBAC):', userRole);
    console.log('[Navigation] Menu items:', menuItems);

    const basePath = getBasePath();
    const currentPath = window.location.pathname;

    let html = `
      <div class="sidebar-header">
        <a href="${getRoute(`${basePath}dashboard/`)}" class="sidebar-brand" title="Go to Dashboard">
          <div class="sidebar-logo" style="width: 40px; height: 40px; background: var(--primary-color, #2563eb); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem;">
            <i class="ph ph-file-text"></i>
          </div>
          <span class="sidebar-brand-name" style="font-weight: var(--font-weight-bold, 700); font-size: 1.125rem;">PMTwin</span>
        </a>
        <div class="sidebar-header-actions" style="display: flex; gap: 0.5rem; align-items: center;">
          <a href="${getRoute(`${basePath}notifications/`)}" class="sidebar-notification-btn" title="Notifications" style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary, #f3f4f6); border-radius: 8px; border: none; cursor: pointer; text-decoration: none; color: var(--text-primary);">
            <i class="ph ph-bell"></i>
            ${getNotificationBadge()}
          </a>
          <button class="sidebar-header-btn" id="sidebarSearchToggle" title="Search Menu" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary, #f3f4f6); border-radius: 8px; border: none; cursor: pointer; color: var(--text-primary);">
            <i class="ph ph-magnifying-glass"></i>
          </button>
          <button class="sidebar-minimize" id="sidebarMinimize" title="Minimize Sidebar" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary, #f3f4f6); border-radius: 8px; border: none; cursor: pointer; color: var(--text-primary);">
            <i class="ph ph-sidebar-simple"></i>
          </button>
        </div>
      </div>
      <div id="sidebarSearchContainer" style="display: none; padding: 0.75rem; border-bottom: 1px solid var(--border-color, #e5e7eb);">
        <div style="position: relative;">
          <input type="text" id="sidebarSearchInput" placeholder="Search menu..." 
            style="width: 100%; padding: 0.5rem 2.5rem 0.5rem 0.75rem; border: 1px solid var(--border-color, #e5e7eb); border-radius: 6px; font-size: 0.875rem; background: var(--bg-secondary, #f9fafb); color: var(--text-primary);"
            autocomplete="off">
          <i class="ph ph-magnifying-glass" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none;"></i>
        </div>
        <div id="sidebarSearchResults" style="display: none; margin-top: 0.5rem; max-height: 200px; overflow-y: auto;">
          <!-- Search results will appear here -->
        </div>
      </div>
      <nav class="sidebar-nav">
        <ul class="sidebar-menu" id="sidebarMenuList">
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
      
      // Check children if this is a grouped item (including nested children)
      if ((item.hasChildren || item.isGroup) && item.children && Array.isArray(item.children)) {
        item.children.forEach(child => {
          // Check if child has nested children
          if ((child.hasChildren || child.isGroup) && child.children && Array.isArray(child.children)) {
            child.children.forEach(grandchild => {
              if (!grandchild.route) return;
              let grandchildIsActive = false;
              if (grandchild.route.startsWith('#')) {
                const hashRoute = grandchild.route.substring(1);
                const currentHash = window.location.hash.substring(1);
                grandchildIsActive = currentHash === hashRoute || currentHash.startsWith(hashRoute + '/') || currentHash.startsWith(hashRoute + '?');
              } else {
                const normalizedRoute = grandchild.route.replace(basePath, '').replace(/\/$/, '').replace(/\.html$/, '');
                const normalizedPath = currentPath.replace(/\/$/, '').replace(/\.html$/, '');
                grandchildIsActive = normalizedPath === normalizedRoute || normalizedPath.startsWith(normalizedRoute + '/');
              }
              if (grandchildIsActive) {
                activeItemId = grandchild.id;
                isActive = false; // Parent is not active if child is active
              }
            });
          } else {
            // Regular child
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
        // Check if any child or nested child is active
        const hasActiveChild = activeItemId && item.children.some(child => {
          if (child.id === activeItemId) return true;
          if (child.hasChildren && child.children) {
            return child.children.some(grandchild => grandchild.id === activeItemId);
          }
          return false;
        });
        
        // Expand if item is explicitly set to expanded, has active child, or is collaboration (default expanded for better UX)
        const isExpanded = item.isExpanded || hasActiveChild || item.id === 'collaboration';
        const groupId = `group-${item.id}`;
        
        html += `
          <li class="sidebar-menu-group ${isExpanded ? 'active' : ''}">
            <button type="button" class="sidebar-group-toggle" onclick="Navigation.toggleMenuGroup(this, '${groupId}', event)" id="${groupId}-toggle" title="${item.label}">
              <span class="sidebar-icon">${item.icon || '<i class="ph ph-folder"></i>'}</span>
              <span class="sidebar-label">${item.label}</span>
              <span class="sidebar-chevron"><i class="ph ph-caret-down"></i></span>
            </button>
            <ul class="sidebar-submenu" id="${groupId}" style="display: ${isExpanded ? 'block' : 'none'};">
        `;
        
        // Render children (support nested groups)
        item.children.forEach(child => {
          // Check if child is a separator
          if (child.isSeparator) {
            html += `<li class="sidebar-menu-separator"><hr style="margin: 0.5rem 0; border: none; border-top: 1px solid var(--border-color, #e0e0e0);"></li>`;
            return;
          }
          
          // Check if child has nested children (nested group)
          if ((child.hasChildren || child.isGroup) && child.children && Array.isArray(child.children) && child.children.length > 0) {
            // Expand nested groups if they have active children, or if parent is collaboration (show all categories by default)
            const childIsExpanded = (activeItemId && child.children.some(grandchild => grandchild.id === activeItemId)) || 
                                     (item.id === 'collaboration' && isExpanded);
            const childGroupId = `group-${child.id}`;
            
            html += `
              <li class="sidebar-menu-group ${childIsExpanded ? 'active' : ''}">
                <button type="button" class="sidebar-group-toggle" onclick="Navigation.toggleMenuGroup(this, '${childGroupId}', event)" style="padding-left: 2rem;" title="${child.label}">
                  <span class="sidebar-icon">${child.icon || '<i class="ph ph-folder"></i>'}</span>
                  <span class="sidebar-label">${child.label}</span>
                  <span class="sidebar-chevron"><i class="ph ph-caret-down"></i></span>
                </button>
                <ul class="sidebar-submenu" id="${childGroupId}" style="display: ${childIsExpanded ? 'block' : 'none'}; padding-left: 1rem;">
            `;
            
            // Render nested children
            child.children.forEach(grandchild => {
              // Check if grandchild is a separator
              if (grandchild.isSeparator) {
                html += `<li class="sidebar-menu-separator"><hr style="margin: 0.5rem 0; border: none; border-top: 1px solid var(--border-color, #e0e0e0);"></li>`;
                return;
              }
              
              const grandchildIsActive = activeItemId === grandchild.id;
              const grandchildIcon = grandchild.icon || child.icon || '<i class="ph ph-file-text"></i>';
              const grandchildBadgeCount = getBadgeCount(grandchild.id, currentUser);
              
              html += `
                <li class="sidebar-menu-item ${grandchildIsActive ? 'active' : ''}">
                  <a href="${grandchild.route}" class="sidebar-link" style="padding-left: 2rem; display: flex; align-items: center;" title="${grandchild.label}" data-menu-id="${grandchild.id}">
                    <span class="sidebar-icon">${grandchildIcon}</span>
                    <span class="sidebar-label">${grandchild.label}</span>
                    ${renderBadge(grandchildBadgeCount)}
                  </a>
                </li>
              `;
            });
            
            html += `
                </ul>
              </li>
            `;
          } else {
            // Regular child item
            const childIsActive = activeItemId === child.id;
            const childIcon = child.icon || item.icon || '<i class="ph ph-file-text"></i>';
            const childBadgeCount = getBadgeCount(child.id, currentUser);
            
            html += `
              <li class="sidebar-menu-item ${childIsActive ? 'active' : ''}">
                <a href="${child.route}" class="sidebar-link" style="padding-left: 2rem; display: flex; align-items: center;" title="${child.label}" data-menu-id="${child.id}">
                  <span class="sidebar-icon">${childIcon}</span>
                  <span class="sidebar-label">${child.label}</span>
                  ${renderBadge(childBadgeCount)}
                </a>
              </li>
            `;
          }
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
      const itemBadgeCount = getBadgeCount(item.id, currentUser);
      
      html += `
        <li class="sidebar-menu-item ${isActive ? 'active' : ''} ${itemClass}">
          <a href="${item.route}" class="sidebar-link" style="${indentStyle}; display: flex; align-items: center;" title="${item.label}" data-menu-id="${item.id}">
            <span class="sidebar-icon">${itemIcon}</span>
            <span class="sidebar-label">${item.label}</span>
            ${renderBadge(itemBadgeCount)}
          </a>
        </li>
      `;
    });

    html += `
        </ul>
      </nav>
      <div class="sidebar-footer" style="border-top: 1px solid var(--border-color, #e5e7eb); padding: 1rem; margin-top: auto;">
        <div class="sidebar-user" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--bg-secondary, #f9fafb); border-radius: 8px; margin-bottom: 1rem; cursor: pointer; transition: background-color 0.2s;" onclick="Navigation.toggleUserMenu()" title="View Profile">
          <div class="sidebar-user-avatar" style="width: 40px; height: 40px; background: var(--primary-color, #2563eb); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: var(--font-weight-semibold, 600); font-size: 1rem; flex-shrink: 0; border: 2px solid var(--bg-primary, white);">
            ${(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
          </div>
          <div class="sidebar-user-info" style="flex: 1; min-width: 0;">
            <div class="sidebar-user-name" style="font-weight: var(--font-weight-bold, 700); font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${currentUser.name || 'User'}</div>
            <div class="sidebar-user-role-badge" style="display: inline-block; padding: 0.125rem 0.5rem; background: var(--bg-tertiary, #e5e7eb); border-radius: 4px; font-size: 0.75rem; font-weight: var(--font-weight-medium, 500); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.025em;">
              ${(currentUser.role || 'guest').toUpperCase()}
            </div>
          </div>
          <i class="ph ph-caret-down" style="color: var(--text-secondary); font-size: 0.875rem;"></i>
        </div>
        <div id="sidebarUserMenu" style="display: none; margin-bottom: 0.75rem; background: var(--bg-primary, white); border: 1px solid var(--border-color, #e5e7eb); border-radius: 8px; overflow: hidden;">
          <a href="${getRoute(`${basePath}profile/`)}" class="sidebar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid var(--border-color, #e5e7eb);" onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}profile/`)}');">
            <i class="ph ph-user"></i> <span>Profile</span>
          </a>
          <a href="${getRoute(`${basePath}settings/`)}" class="sidebar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid var(--border-color, #e5e7eb);" onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}settings/`)}');">
            <i class="ph ph-gear"></i> <span>Settings</span>
          </a>
          ${currentUser.role === 'admin' || currentUser.role === 'platform_admin' ? `
          <a href="${getRoute(`${basePath}admin/`)}" class="sidebar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;" onclick="Navigation.handleNavClick(event, '${getRoute(`${basePath}admin/`)}');">
            <i class="ph ph-shield-check"></i> <span>Admin Portal</span>
          </a>
          ` : ''}
        </div>
        <button onclick="Navigation.logout()" class="sidebar-logout" style="width: 100%; padding: 0.75rem 1rem; background: var(--color-error, #dc2626); color: white; border: none; border-radius: 8px; font-weight: var(--font-weight-medium, 500); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background-color 0.2s;">
          <i class="ph ph-sign-out"></i> <span>Logout</span>
        </button>
      </div>
    `;

    container.innerHTML = html;

    // Create expand button if it doesn't exist
    let expandBtn = document.getElementById('sidebarExpand');
    if (!expandBtn) {
      expandBtn = document.createElement('button');
      expandBtn.id = 'sidebarExpand';
      expandBtn.className = 'sidebar-expand';
      expandBtn.setAttribute('aria-label', 'Expand sidebar');
      expandBtn.setAttribute('title', 'Expand menu');
      expandBtn.style.display = 'none';
      expandBtn.innerHTML = '<i class="ph ph-sidebar"></i>';
      document.body.appendChild(expandBtn);
    }

    // Setup minimize/expand buttons
    const minimizeBtn = document.getElementById('sidebarMinimize');
    
    if (minimizeBtn) {
      minimizeBtn.onclick = () => minimizeSidebar();
    }
    
    if (expandBtn) {
      expandBtn.onclick = () => expandSidebar();
    }
    
    // Apply current minimized state
    if (sidebarMinimized) {
      applyMinimizedState();
    }
    
    // Setup sidebar search
    setupSidebarSearch();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
  }

  // ============================================
  // Setup Sidebar Search
  // ============================================
  function setupSidebarSearch() {
    const searchToggle = document.getElementById('sidebarSearchToggle');
    const searchContainer = document.getElementById('sidebarSearchContainer');
    const searchInput = document.getElementById('sidebarSearchInput');
    const searchResults = document.getElementById('sidebarSearchResults');
    const menuList = document.getElementById('sidebarMenuList');
    
    if (!searchToggle || !searchContainer || !searchInput) return;
    
    // Toggle search container
    searchToggle.onclick = (e) => {
      e.stopPropagation();
      const isVisible = searchContainer.style.display !== 'none';
      searchContainer.style.display = isVisible ? 'none' : 'block';
      if (!isVisible && searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      } else {
        searchInput.value = '';
        searchResults.style.display = 'none';
        filterMenuItems('');
      }
    };
    
    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (query.length > 0) {
          performSidebarSearch(query, searchResults, menuList);
        } else {
          searchResults.style.display = 'none';
          filterMenuItems('');
        }
      }, 200);
    });
    
    // Filter menu items on search
    function filterMenuItems(query) {
      if (!menuList) return;
      const items = menuList.querySelectorAll('.sidebar-menu-item, .sidebar-menu-group');
      items.forEach(item => {
        const link = item.querySelector('.sidebar-link, .sidebar-group-toggle');
        if (!link) return;
        const text = link.textContent.toLowerCase();
        if (query === '' || text.includes(query)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    }
  }

  // ============================================
  // Perform Sidebar Search
  // ============================================
  function performSidebarSearch(query, resultsContainer, menuList) {
    if (!resultsContainer || !menuList) return;
    
    const results = [];
    const menuItems = menuList.querySelectorAll('.sidebar-link, .sidebar-group-toggle');
    
    menuItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      const href = item.getAttribute('href');
      const title = item.getAttribute('title') || item.textContent;
      
      if (text.includes(query) && href && href !== '#') {
        results.push({
          title: title.trim(),
          href: href,
          icon: item.querySelector('.sidebar-icon')?.innerHTML || '<i class="ph ph-file-text"></i>'
        });
      }
    });
    
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-secondary); font-size: 0.875rem;">
          <i class="ph ph-magnifying-glass" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5; display: block;"></i>
          No results found
        </div>
      `;
    } else {
      let html = '<div style="padding: 0.25rem;">';
      results.slice(0, 8).forEach(result => {
        html += `
          <a href="${result.href}" class="sidebar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.25rem; background: var(--bg-secondary, #f9fafb);" 
             onclick="Navigation.handleNavClick(event, '${result.href}');">
            <span class="sidebar-icon">${result.icon}</span>
            <span class="sidebar-label" style="font-size: 0.875rem;">${result.title}</span>
          </a>
        `;
      });
      html += '</div>';
      resultsContainer.innerHTML = html;
    }
    
    resultsContainer.style.display = 'block';
  }

  // ============================================
  // Setup Keyboard Shortcuts
  // ============================================
  function setupKeyboardShortcuts() {
    // Only setup if not already set up
    if (window.sidebarKeyboardShortcutsSetup) return;
    window.sidebarKeyboardShortcutsSetup = true;
    
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      
      // Ctrl/Cmd + K: Open sidebar search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchToggle = document.getElementById('sidebarSearchToggle');
        const searchContainer = document.getElementById('sidebarSearchContainer');
        if (searchToggle && searchContainer) {
          searchToggle.click();
        }
      }
      
      // Escape: Close search
      if (e.key === 'Escape') {
        const searchContainer = document.getElementById('sidebarSearchContainer');
        const searchInput = document.getElementById('sidebarSearchInput');
        if (searchContainer && searchContainer.style.display !== 'none') {
          searchContainer.style.display = 'none';
          if (searchInput) searchInput.value = '';
        }
      }
    });
  }

  // ============================================
  // Toggle User Menu
  // ============================================
  function toggleUserMenu() {
    const userMenu = document.getElementById('sidebarUserMenu');
    if (userMenu) {
      userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
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
  // Minimize Sidebar
  // ============================================
  function minimizeSidebar() {
    sidebarMinimized = true;
    
    // Add transitioning class for smooth animation
    document.body.classList.add('sidebar-transitioning');
    
    applyMinimizedState();
    
    // Remove transitioning class after animation completes
    setTimeout(() => {
      document.body.classList.remove('sidebar-transitioning');
    }, 400);
    
    // Save state to localStorage
    try {
      localStorage.setItem('pmtwin_sidebar_minimized', 'true');
    } catch (e) {
      console.error('Error saving sidebar state:', e);
    }
  }

  // ============================================
  // Expand Sidebar
  // ============================================
  function expandSidebar() {
    sidebarMinimized = false;
    
    // Add transitioning class for smooth animation
    document.body.classList.add('sidebar-transitioning');
    
    // Ensure sidebar-open class is set on desktop
    if (window.innerWidth > 768) {
      document.body.classList.add('sidebar-open');
    }
    
    removeMinimizedState();
    
    // Remove transitioning class after animation completes
    setTimeout(() => {
      document.body.classList.remove('sidebar-transitioning');
    }, 400);
    
    // Save state to localStorage
    try {
      localStorage.setItem('pmtwin_sidebar_minimized', 'false');
    } catch (e) {
      console.error('Error saving sidebar state:', e);
    }
  }

  // ============================================
  // Apply Minimized State
  // ============================================
  function applyMinimizedState() {
    const sidebar = document.getElementById('sidebar');
    const minimizeBtn = document.getElementById('sidebarMinimize');
    const expandBtn = document.getElementById('sidebarExpand');
    
    if (sidebar) {
      sidebar.classList.add('minimized');
    }
    
    // Add body class for main content margin adjustment
    document.body.classList.add('sidebar-minimized');
    
    if (minimizeBtn) {
      minimizeBtn.style.display = 'none';
    }
    
    if (expandBtn) {
      expandBtn.classList.add('show');
      // Trigger animation
      setTimeout(() => {
        expandBtn.style.display = 'flex';
      }, 50);
    }
    
    // Adjust main content margin if layout exists
    // Use double requestAnimationFrame + small delay to ensure sidebar width has updated
    if (typeof AppLayout !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Small delay to let CSS transition start
          setTimeout(() => {
            AppLayout.adjustMainContentMargin();
          }, 50);
        });
      });
    }
  }

  // ============================================
  // Remove Minimized State
  // ============================================
  function removeMinimizedState() {
    const sidebar = document.getElementById('sidebar');
    const minimizeBtn = document.getElementById('sidebarMinimize');
    const expandBtn = document.getElementById('sidebarExpand');
    
    if (sidebar) {
      sidebar.classList.remove('minimized');
    }
    
    // Remove body class
    document.body.classList.remove('sidebar-minimized');
    
    if (minimizeBtn) {
      minimizeBtn.style.display = 'flex';
    }
    
    if (expandBtn) {
      expandBtn.classList.remove('show');
      expandBtn.style.display = 'none';
    }
    
    // Adjust main content margin if layout exists
    // Use double requestAnimationFrame + small delay to ensure sidebar width has updated
    if (typeof AppLayout !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Small delay to let CSS transition start
          setTimeout(() => {
            AppLayout.adjustMainContentMargin();
          }, 50);
        });
      });
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
      <button id="sidebarExpand" class="sidebar-expand" onclick="Navigation.expandSidebar()" aria-label="Expand sidebar" title="Expand menu">
        <i class="ph ph-sidebar"></i>
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', sidebarHTML);
  }

  // ============================================
  // Toggle Menu Group
  // ============================================
  function toggleMenuGroup(button, groupId, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const submenu = document.getElementById(groupId);
    const groupItem = button.closest('.sidebar-menu-group');
    
    if (!submenu || !groupItem) return;
    
    const isExpanded = submenu.style.display !== 'none' && submenu.style.display !== '';
    
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
    // Use centralized route for login
    let loginUrl = '/POC/pages/auth/login/index.html';
    if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES['login']) {
      loginUrl = window.NavRoutes.getRoute('login', { useLiveServer: true });
    } else {
      const basePath = getBasePath();
      loginUrl = getRoute(`${basePath}login/`);
    }
    window.location.href = loginUrl;
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
          // Set sidebar-open class on body for CSS margin rules
          document.body.classList.add('sidebar-open');
          console.log('[Navigation] Sidebar opened on desktop');
        }
      }
      
      // Load minimized state from localStorage
      try {
        const savedState = localStorage.getItem('pmtwin_sidebar_minimized');
        if (savedState === 'true') {
          sidebarMinimized = true;
          // Apply after a short delay to ensure sidebar is rendered
          setTimeout(() => {
            applyMinimizedState();
          }, 150);
        }
      } catch (e) {
        console.error('Error loading sidebar state:', e);
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
    minimizeSidebar,
    expandSidebar,
    toggleMenuGroup,
    toggleUserMenu,
    logout,
    loadMenuItems,
    refreshMenuItems,
    handleNavClick,
    handleNotificationClick
  };

})();

