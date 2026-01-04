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
      { 
        id: 'collaboration', 
        label: 'Collaboration', 
        route: `${basePath}collaboration/`, 
        icon: '<i class="ph ph-handshake"></i>', 
        roles: ['admin', 'entity', 'individual'],
        hasChildren: true,
        isGroup: true,
        children: [
          // Main Features
          { id: 'collab-my-collaborations', label: 'My Collaborations', route: `${basePath}collaboration/my-collaborations/`, icon: '<i class="ph ph-folder"></i>', roles: ['admin', 'entity', 'individual'] },
          { id: 'collab-opportunities', label: 'Browse Opportunities', route: `${basePath}collaboration/opportunities/`, icon: '<i class="ph ph-sparkle"></i>', roles: ['admin', 'entity', 'individual'] },
          { id: 'collab-applications', label: 'My Applications', route: `${basePath}collaboration/applications/`, icon: '<i class="ph ph-file-text"></i>', roles: ['admin', 'entity', 'individual'] },
          { id: 'collab-separator', label: '---', route: '#', icon: '', isSeparator: true, roles: ['admin', 'entity', 'individual'] },
          // Simplified Model Categories with Sub-Features
          { 
            id: 'collab-models', 
            label: 'Collaboration Models', 
            route: `${basePath}collaboration/`, 
            icon: '<i class="ph ph-clipboard-text"></i>', 
            roles: ['admin', 'entity', 'individual'] 
          },
          { 
            id: 'collab-project-based', 
            label: 'Project-Based', 
            route: `${basePath}collaboration/?category=1`, 
            icon: '<i class="ph ph-buildings"></i>', 
            roles: ['admin', 'entity', 'individual'],
            hasChildren: true,
            isGroup: true,
            children: [
              { id: 'collab-task-based', label: 'Task-Based Engagement', route: `${basePath}collaboration/task-based/`, icon: '<i class="ph ph-file-text"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-consortium', label: 'Consortium', route: `${basePath}collaboration/consortium/`, icon: '<i class="ph ph-users-three"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-jv', label: 'Project-Specific JV', route: `${basePath}collaboration/joint-venture/`, icon: '<i class="ph ph-handshake"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-spv', label: 'Special Purpose Vehicle', route: `${basePath}collaboration/spv/`, icon: '<i class="ph ph-building-office"></i>', roles: ['admin', 'entity', 'individual'] }
            ]
          },
          { 
            id: 'collab-strategic', 
            label: 'Strategic Partnerships', 
            route: `${basePath}collaboration/?category=2`, 
            icon: '<i class="ph ph-handshake"></i>', 
            roles: ['admin', 'entity', 'individual'],
            hasChildren: true,
            isGroup: true,
            children: [
              { id: 'collab-strategic-jv', label: 'Strategic Joint Venture', route: `${basePath}collaboration/strategic-jv/`, icon: '<i class="ph ph-handshake"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-strategic-alliance', label: 'Strategic Alliance', route: `${basePath}collaboration/strategic-alliance/`, icon: '<i class="ph ph-link"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-mentorship', label: 'Mentorship Program', route: `${basePath}collaboration/mentorship/`, icon: '<i class="ph ph-graduation-cap"></i>', roles: ['admin', 'entity', 'individual'] }
            ]
          },
          { 
            id: 'collab-resources', 
            label: 'Resource Pooling', 
            route: `${basePath}collaboration/?category=3`, 
            icon: '<i class="ph ph-package"></i>', 
            roles: ['admin', 'entity', 'individual'],
            hasChildren: true,
            isGroup: true,
            children: [
              { id: 'collab-bulk-purchasing', label: 'Bulk Purchasing', route: `${basePath}collaboration/bulk-purchasing/`, icon: '<i class="ph ph-shopping-cart"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-co-ownership', label: 'Co-Ownership Pooling', route: `${basePath}collaboration/co-ownership/`, icon: '<i class="ph ph-users"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-resource-exchange', label: 'Resource Exchange', route: `${basePath}collaboration/resource-exchange/`, icon: '<i class="ph ph-arrows-clockwise"></i>', roles: ['admin', 'entity', 'individual'] }
            ]
          },
          { 
            id: 'collab-hiring', 
            label: 'Hiring Resources', 
            route: `${basePath}collaboration/?category=4`, 
            icon: '<i class="ph ph-briefcase"></i>', 
            roles: ['admin', 'entity', 'individual'],
            hasChildren: true,
            isGroup: true,
            children: [
              { id: 'collab-professional-hiring', label: 'Professional Hiring', route: `${basePath}collaboration/professional-hiring/`, icon: '<i class="ph ph-user"></i>', roles: ['admin', 'entity', 'individual'] },
              { id: 'collab-consultant-hiring', label: 'Consultant Hiring', route: `${basePath}collaboration/consultant-hiring/`, icon: '<i class="ph ph-user-circle"></i>', roles: ['admin', 'entity', 'individual'] }
            ]
          },
          { 
            id: 'collab-competition', 
            label: 'Call for Competition', 
            route: `${basePath}collaboration/?category=5`, 
            icon: '<i class="ph ph-trophy"></i>', 
            roles: ['admin', 'entity', 'individual'] 
          }
        ]
      },
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
        <a href="${basePath}service-providers/" class="navbar-link ${isServiceProvidersActive ? 'active' : ''}" onclick="Navigation.handleNavClick(event, '${basePath}service-providers/');">
          <i class="ph ph-buildings"></i> Service Providers Directory
        </a>
      </li>
    `;

    // Search bar
    html += `
            <li style="margin-left: auto; margin-right: 1rem;">
              <div style="position: relative; display: flex; align-items: center;">
                <input type="text" id="topbarSearch" placeholder="Search projects, users..." 
                  style="padding: 0.5rem 2.5rem 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: 20px; width: 300px; font-size: 0.9rem; background: var(--bg-secondary);"
                  onfocus="this.style.width='400px'; this.style.borderColor='var(--color-primary)';"
                  onblur="if(!this.value) {this.style.width='300px'; this.style.borderColor='var(--border-color)';}">
                <i class="ph ph-magnifying-glass" style="position: absolute; right: 1rem; color: var(--text-secondary); pointer-events: none;"></i>
                <div id="searchResults" style="display: none; position: absolute; top: 100%; left: 0; right: 0; margin-top: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 400px; overflow-y: auto; z-index: 1000;">
                  <!-- Search results will appear here -->
                </div>
              </div>
            </li>
    `;

    // Theme toggle
    html += `
            <li>
              <button id="themeToggleBtn" class="navbar-link" style="background: none; border: none; cursor: pointer; padding: 0.5rem;" title="Toggle theme">
                <i class="ph ph-moon" id="themeIcon"></i>
              </button>
            </li>
    `;

    // Quick actions menu
    html += `
            <li>
              <div style="position: relative;">
                <button id="quickActionsBtn" class="navbar-link" style="background: none; border: none; cursor: pointer; padding: 0.5rem;" title="Quick Actions">
                  <i class="ph ph-lightning"></i>
                </button>
                <div id="quickActionsDropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius); box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 220px; z-index: 1000;">
                  <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 0.9rem;">Quick Actions</div>
                  <a href="${basePath}create-project/" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);" onclick="Navigation.handleNavClick(event, '${basePath}create-project/');">
                    <i class="ph ph-plus-circle"></i> <span>Create Project</span>
                  </a>
                  <a href="${basePath}create-proposal/" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);" onclick="Navigation.handleNavClick(event, '${basePath}create-proposal/');">
                    <i class="ph ph-file-text"></i> <span>Create Proposal</span>
                  </a>
                  <a href="${basePath}collaboration/" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);" onclick="Navigation.handleNavClick(event, '${basePath}collaboration/');">
                    <i class="ph ph-handshake"></i> <span>New Collaboration</span>
                  </a>
                  <a href="${basePath}wizard/" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;" onclick="Navigation.handleNavClick(event, '${basePath}wizard/');">
                    <i class="ph ph-magic-wand"></i> <span>AI Wizard</span>
                  </a>
                </div>
              </div>
            </li>
    `;

    // User menu
    html += `
            <li>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <a href="${basePath}notifications/" class="navbar-link" style="position: relative; padding: 0.5rem;" onclick="event.preventDefault(); Navigation.handleNotificationClick(event);">
                  <i class="ph ph-bell"></i>
                  ${getNotificationBadge()}
                </a>
                <div style="position: relative;">
                  <button id="userMenuBtn" class="navbar-link" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;">
                    <span>${currentUser.name || currentUser.email}</span>
                    <i class="ph ph-caret-down"></i>
                  </button>
                  <div id="userMenuDropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius); box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 220px; z-index: 1000;">
                    <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);">
                      <div style="font-weight: 600; font-size: 0.9rem;">${currentUser.name || 'User'}</div>
                      <div style="font-size: 0.8rem; color: var(--text-secondary);">${currentUser.email || ''}</div>
                    </div>
                    <a href="${basePath}profile/" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);" onclick="Navigation.handleNavClick(event, '${basePath}profile/');">
                      <i class="ph ph-user"></i> <span>Profile</span>
                    </a>
                    <a href="${basePath}settings/" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);" onclick="Navigation.handleNavClick(event, '${basePath}settings/');">
                      <i class="ph ph-gear"></i> <span>Settings</span>
                    </a>
                    <a href="${basePath}notifications/" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);" onclick="Navigation.handleNavClick(event, '${basePath}notifications/');">
                      <i class="ph ph-bell"></i> <span>Notifications</span>
                    </a>
                    ${currentUser.role === 'admin' || currentUser.role === 'platform_admin' ? `
                    <a href="${basePath}admin/" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);" onclick="Navigation.handleNavClick(event, '${basePath}admin/');">
                      <i class="ph ph-gear"></i> <span>Admin Portal</span>
                    </a>
                    ` : ''}
                    <a href="${basePath}knowledge/" class="navbar-link" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);" onclick="Navigation.handleNavClick(event, '${basePath}knowledge/');">
                      <i class="ph ph-book"></i> <span>Help & Support</span>
                    </a>
                    <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid var(--border-color);">
                    <button onclick="Navigation.logout()" class="navbar-link logout-link" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; text-align: left; padding: 0.75rem 1rem; background: none; border: none; cursor: pointer;">
                      <i class="ph ph-sign-out"></i> <span>Logout</span>
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
    setupQuickActions();
    setupSearch();
    setupNavLinks();
    setupThemeToggle();
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
            <li><a href="${basePath}service-providers/" class="navbar-link">Service Providers Directory</a></li>
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
          return `<span class="notification-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>`;
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
    window.location.href = `${basePath}discovery/?search=${encodeURIComponent(query)}`;
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
    
    // Navigate to URL
    if (url) {
      window.location.href = url;
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
    
    if (userMenu) userMenu.style.display = 'none';
    if (quickActions) quickActions.style.display = 'none';
    if (searchResults) searchResults.style.display = 'none';
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
        <a href="${basePath}dashboard/" class="sidebar-brand" title="Go to Dashboard">
          <div class="sidebar-logo">
            <i class="ph ph-notebook"></i>
          </div>
          <span class="sidebar-brand-name">PMTwin</span>
        </a>
        <div class="sidebar-header-actions">
          <a href="${basePath}notifications/" class="sidebar-notification-btn" title="Notifications">
            <i class="ph ph-bell"></i>
            ${getNotificationBadge()}
          </a>
          <button id="sidebarMinimize" class="sidebar-minimize" aria-label="Minimize sidebar" title="Minimize menu">
            <i class="ph ph-sidebar-simple"></i>
          </button>
        </div>
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
              
              html += `
                <li class="sidebar-menu-item ${grandchildIsActive ? 'active' : ''}">
                  <a href="${grandchild.route}" class="sidebar-link" style="padding-left: 2rem;" title="${grandchild.label}">
                    <span class="sidebar-icon">${grandchildIcon}</span>
                    <span class="sidebar-label">${grandchild.label}</span>
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
            
            html += `
              <li class="sidebar-menu-item ${childIsActive ? 'active' : ''}">
                <a href="${child.route}" class="sidebar-link" style="padding-left: 2rem;" title="${child.label}">
                  <span class="sidebar-icon">${childIcon}</span>
                  <span class="sidebar-label">${child.label}</span>
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
      
      html += `
        <li class="sidebar-menu-item ${isActive ? 'active' : ''} ${itemClass}">
          <a href="${item.route}" class="sidebar-link" style="${indentStyle}" title="${item.label}">
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
    logout,
    loadMenuItems,
    refreshMenuItems,
    handleNavClick,
    handleNotificationClick
  };

})();

