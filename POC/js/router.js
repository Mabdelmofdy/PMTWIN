/**
 * PMTwin Application Router
 * Single-page application router that loads features dynamically
 */

(function() {
  'use strict';

  let currentRoute = 'home';
  let currentUser = null;
  let routes = {};

  // ============================================
  // Route Definitions
  // ============================================
  function defineRoutes() {
    routes = {
      // Public routes
      'home': {
        feature: 'public',
        component: 'home',
        requiresAuth: false,
        title: 'PMTwin - Home'
      },
      'discovery': {
        feature: 'public',
        component: 'discovery',
        requiresAuth: false,
        title: 'Discover Projects'
      },
      'wizard': {
        feature: 'public',
        component: 'wizard',
        requiresAuth: false,
        title: 'PMTwin Wizard'
      },
      'knowledge': {
        feature: 'public',
        component: 'knowledge',
        requiresAuth: false,
        title: 'Knowledge Hub'
      },
      'signup': {
        feature: 'auth',
        component: 'signup',
        requiresAuth: false,
        title: 'Sign Up'
      },
      'login': {
        feature: 'auth',
        component: 'login',
        requiresAuth: false,
        title: 'Login'
      },
      
      // User routes
      'dashboard': {
        feature: 'dashboard',
        component: 'dashboard',
        requiresAuth: true,
        title: 'Dashboard'
      },
      'projects': {
        feature: 'projects',
        component: 'projects-list',
        requiresAuth: true,
        title: 'My Projects'
      },
      'create-project': {
        feature: 'projects',
        component: 'project-create',
        requiresAuth: true,
        title: 'Create Project'
      },
      'project': {
        feature: 'projects',
        component: 'project-view',
        requiresAuth: true,
        title: 'Project Details'
      },
      'opportunities': {
        feature: 'matching',
        component: 'opportunities',
        requiresAuth: true,
        title: 'Opportunities'
      },
      'matches': {
        feature: 'matching',
        component: 'matches',
        requiresAuth: true,
        title: 'Matches'
      },
      'proposals': {
        feature: 'proposals',
        component: 'proposals-list',
        requiresAuth: true,
        title: 'Proposals'
      },
      'create-proposal': {
        feature: 'proposals',
        component: 'proposal-create',
        requiresAuth: true,
        title: 'Create Proposal'
      },
      'pipeline': {
        feature: 'pipeline',
        component: 'pipeline',
        requiresAuth: true,
        title: 'Pipeline'
      },
      'collaboration': {
        feature: 'collaboration',
        component: 'collaboration-models',
        requiresAuth: true,
        title: 'Collaboration Models'
      },
      'profile': {
        feature: 'profile',
        component: 'profile',
        requiresAuth: true,
        title: 'Profile'
      },
      'onboarding': {
        feature: 'onboarding',
        component: 'onboarding',
        requiresAuth: true,
        title: 'Complete Profile'
      },
      'notifications': {
        feature: 'notifications',
        component: 'notifications',
        requiresAuth: true,
        title: 'Notifications'
      },
      
      // Admin routes
      'admin': {
        feature: 'admin',
        component: 'admin-dashboard',
        requiresAuth: true,
        requiresRole: 'admin',
        title: 'Admin Dashboard'
      },
      'admin-vetting': {
        feature: 'admin',
        component: 'admin-vetting',
        requiresAuth: true,
        requiresRole: 'admin',
        title: 'User Vetting'
      },
      'admin-moderation': {
        feature: 'admin',
        component: 'admin-moderation',
        requiresAuth: true,
        requiresRole: 'admin',
        title: 'Project Moderation'
      },
      'admin-audit': {
        feature: 'admin',
        component: 'admin-audit',
        requiresAuth: true,
        requiresRole: 'admin',
        title: 'Audit Trail'
      },
      'admin-reports': {
        feature: 'admin',
        component: 'admin-reports',
        requiresAuth: true,
        requiresRole: 'admin',
        title: 'Reports'
      }
    };
  }

  // ============================================
  // Route Loading
  // ============================================
  async function loadRoute(routeName, params = {}) {
    try {
      const route = routes[routeName];
      if (!route) {
        console.error('Route not found:', routeName);
        loadRoute('home');
        return;
      }

      // Check authentication
      if (route.requiresAuth) {
        if (typeof PMTwinAuth === 'undefined' || !PMTwinAuth.isAuthenticated()) {
          loadRoute('login');
          return;
        }
        
        currentUser = PMTwinData.Sessions.getCurrentUser();
        
        // Check role requirement
        if (route.requiresRole) {
          if (typeof PMTwinRBAC !== 'undefined') {
            const userRole = await PMTwinRBAC.getCurrentUserRole();
            if (userRole !== route.requiresRole) {
              // Redirect based on role
              const roleDef = await PMTwinRBAC.getRoleDefinition(userRole);
              if (roleDef && roleDef.portals.includes('user_portal')) {
                loadRoute('dashboard');
              } else {
                loadRoute('home');
              }
              return;
            }
          } else if (currentUser.role !== route.requiresRole) {
            loadRoute('dashboard');
            return;
          }
        }

        // Check feature access
        if (typeof PMTwinRBAC !== 'undefined') {
          const hasFeature = await PMTwinRBAC.canCurrentUserSeeFeature(route.feature);
          if (!hasFeature) {
            console.warn('User does not have access to feature:', route.feature);
            loadRoute('dashboard');
            return;
          }
        }
      }

      // Show loading indicator
      const mainContent = document.getElementById('mainContent');
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (mainContent && loadingIndicator) {
        mainContent.innerHTML = '';
        loadingIndicator.style.display = 'block';
      }

      // Update title
      document.title = route.title || 'PMTwin';

      // Load feature HTML
      const htmlPath = `features/${route.feature}/${route.component}.html`;
      let response;
      try {
        response = await fetch(htmlPath);
        if (!response.ok) {
          // If file doesn't exist, show a helpful error
          throw new Error(`Failed to load ${htmlPath} (${response.status}: ${response.statusText})`);
        }
      } catch (error) {
        // Network error or file not found
        console.error('Error fetching HTML:', error);
        throw new Error(`Route component not found: ${route.component}. Please create features/${route.feature}/${route.component}.html`);
      }
      const html = await response.text();

      // Hide loading, show content
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      if (mainContent) {
        mainContent.innerHTML = html;
      }

      // Load feature JS
      const jsPath = `features/${route.feature}/${route.component}.js`;
      try {
        // Check if script already loaded
        const existingScript = document.querySelector(`script[data-feature="${route.feature}"][data-component="${route.component}"]`);
        if (existingScript) {
          // Script already loaded, just initialize
          if (window[route.feature] && window[route.feature][route.component]) {
            window[route.feature][route.component].init(params);
          }
        } else {
          // Load script
          const script = document.createElement('script');
          script.src = jsPath;
          script.setAttribute('data-feature', route.feature);
          script.setAttribute('data-component', route.component);
          script.onload = function() {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
              if (window[route.feature] && window[route.feature][route.component]) {
                window[route.feature][route.component].init(params);
              }
            }, 50);
          };
          script.onerror = function() {
            console.warn('Failed to load script:', jsPath);
            // Continue without script - HTML might be self-contained
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.warn('Error loading feature script:', error);
      }

      // Update navigation
      updateNavigation();
      currentRoute = routeName;

    } catch (error) {
      console.error('Error loading route:', error);
      const mainContent = document.getElementById('mainContent');
      if (mainContent) {
        mainContent.innerHTML = `
          <div class="container" style="padding: 2rem; text-align: center;">
            <h1>Error Loading Page</h1>
            <p>${error.message}</p>
            <a href="#home" class="btn btn-primary">Go Home</a>
          </div>
        `;
      }
    }
  }

  // ============================================
  // Navigation
  // ============================================
  async function updateNavigation() {
    const navbar = document.getElementById('mainNavbar');
    const navList = document.getElementById('navbarNav');
    if (!navbar || !navList) return;

    const isAuth = typeof PMTwinAuth !== 'undefined' && PMTwinAuth.isAuthenticated();
    
    if (isAuth) {
      navbar.style.display = 'block';
      
      // Get menu items based on role
      let menuItems = [];
      if (typeof DashboardService !== 'undefined') {
        const menuResult = await DashboardService.getMenuItems();
        if (menuResult.success) {
          menuItems = menuResult.items;
        }
      } else {
        // Fallback menu
        const user = PMTwinData.Sessions.getCurrentUser();
        if (user) {
          menuItems = [
            { id: 'dashboard', label: 'Dashboard', route: '#dashboard' },
            { id: 'profile', label: 'Profile', route: '#profile' }
          ];
          if (user.role === 'entity') {
            menuItems.push(
              { id: 'projects', label: 'Projects', route: '#projects' },
              { id: 'create-project', label: 'Create Project', route: '#create-project' }
            );
          }
          menuItems.push({ id: 'logout', label: 'Logout', route: '#logout' });
        }
      }

      // Build navigation
      navList.innerHTML = menuItems.map(item => {
        const isActive = currentRoute === item.id ? 'active' : '';
        return `<li><a href="${item.route}" class="navbar-link ${isActive}" data-route="${item.id}">${item.label}</a></li>`;
      }).join('');

      // Add event listeners
      navList.querySelectorAll('a[data-route]').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const route = this.getAttribute('data-route');
          if (route === 'logout') {
            handleLogout();
          } else {
            window.location.hash = route;
          }
        });
      });
    } else {
      // Public navigation
      navbar.style.display = 'block';
      navList.innerHTML = `
        <li><a href="#home" class="navbar-link" data-route="home">Home</a></li>
        <li><a href="#discovery" class="navbar-link" data-route="discovery">Discover Projects</a></li>
        <li><a href="#wizard" class="navbar-link" data-route="wizard">PMTwin Wizard</a></li>
        <li><a href="#knowledge" class="navbar-link" data-route="knowledge">Knowledge Hub</a></li>
        <li><a href="#signup" class="navbar-link" data-route="signup">Sign Up</a></li>
        <li><a href="#login" class="navbar-link" data-route="login">Login</a></li>
      `;
      
      navList.querySelectorAll('a[data-route]').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.hash = this.getAttribute('data-route');
        });
      });
    }
  }

  function handleLogout() {
    if (typeof PMTwinAuth !== 'undefined') {
      PMTwinAuth.logout();
    }
    window.location.hash = 'home';
    updateNavigation();
  }

  // ============================================
  // Hash Change Handler
  // ============================================
  function handleHashChange() {
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    const routeName = parts[0];
    const params = parts.slice(1);
    
    loadRoute(routeName, { params });
  }

  // ============================================
  // Initialization
  // ============================================
  function init() {
    defineRoutes();
    
    // Handle initial route
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Update navigation
    updateNavigation();
  }

  // ============================================
  // Public API
  // ============================================
  window.AppRouter = {
    init,
    loadRoute,
    updateNavigation,
    getCurrentRoute: () => currentRoute,
    getCurrentUser: () => currentUser
  };

})();


