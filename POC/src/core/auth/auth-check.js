/**
 * Authentication Check Utility
 * Shared utility for checking authentication and redirecting
 */

(function() {
  'use strict';

  /**
   * Check if user is authenticated
   * Redirects to login.html if not authenticated
   * @param {Object} options - Configuration options
   * @param {boolean} options.requireAuth - Whether authentication is required (default: true)
   * @param {string} options.redirectTo - Where to redirect after login (default: current page)
   * @param {string} options.requireRole - Required role (optional)
   * @returns {boolean} - True if authenticated and authorized, false otherwise
   */
  async function checkAuth(options = {}) {
    const {
      requireAuth = true,
      redirectTo = window.location.pathname + window.location.search,
      requireRole = null
    } = options;

    // If auth not required, return true
    if (!requireAuth) {
      return true;
    }

    // Check if auth system is available
    if (typeof PMTwinAuth === 'undefined') {
      console.error('Authentication system not available');
      return false;
    }

    // Check authentication
    const isAuthenticated = PMTwinAuth.isAuthenticated();
    console.log('Auth check - isAuthenticated:', isAuthenticated, 'requireAuth:', requireAuth);
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      // Store intended destination
      if (redirectTo && !redirectTo.includes('login')) {
        sessionStorage.setItem('loginRedirect', redirectTo);
        console.log('Stored redirect path:', redirectTo);
      }
        // Determine correct login path based on current location
      const currentPath = window.location.pathname;
      // Calculate depth from POC root (count /pages/... segments)
      // Filter out POC, empty strings, and .html files
      const pathSegments = currentPath.split('/').filter(p => p && p !== 'POC' && !p.endsWith('.html'));
      const pagesIndex = pathSegments.indexOf('pages');
      let loginPath = '../auth/login/';
      
      if (pagesIndex >= 0) {
        // Calculate how many levels up we need to go
        const depth = pathSegments.length - pagesIndex - 1;
        loginPath = depth > 0 ? '../'.repeat(depth) + 'auth/login/' : 'auth/login/';
      }
      
      if (currentPath.includes('/login/') || currentPath.includes('/auth/login/')) {
        return false; // Already on login page
      }
      console.log('Redirecting to login:', loginPath);
      window.location.href = loginPath;
      return false;
    }
    
    console.log('✅ User is authenticated');

    // Check role if required
    if (requireRole) {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      console.log('Auth check - requireRole:', requireRole, 'currentUser:', currentUser);
      if (!currentUser) {
        console.warn('No current user found, redirecting to login');
        const currentPath = window.location.pathname;
        // Filter out POC, empty strings, and .html files
        const pathSegments = currentPath.split('/').filter(p => p && p !== 'POC' && !p.endsWith('.html'));
        const pagesIndex = pathSegments.indexOf('pages');
        let loginPath = '../auth/login/';
        if (pagesIndex >= 0) {
          const depth = pathSegments.length - pagesIndex - 1;
          loginPath = depth > 0 ? '../'.repeat(depth) + 'auth/login/' : 'auth/login/';
        }
        window.location.href = loginPath;
        return false;
      }

      // Check role using RBAC if available
      if (typeof PMTwinRBAC !== 'undefined') {
        const userRole = await PMTwinRBAC.getCurrentUserRole();
        if (userRole !== requireRole) {
          // Redirect based on user role
          const roleDef = await PMTwinRBAC.getRoleDefinition(userRole);
          const currentPath = window.location.pathname;
          // Filter out POC, empty strings, and .html files
          const pathSegments = currentPath.split('/').filter(p => p && p !== 'POC' && !p.endsWith('.html'));
          const pagesIndex = pathSegments.indexOf('pages');
          const depth = pagesIndex >= 0 ? pathSegments.length - pagesIndex - 1 : 1;
          const basePath = depth > 0 ? '../'.repeat(depth) : '';
          
          if (roleDef && roleDef.portals.includes('user_portal')) {
            window.location.href = basePath + 'dashboard/';
          } else {
            window.location.href = basePath + 'home/';
          }
          return false;
        }
      } else {
        // Fallback to direct role check (case-insensitive)
        const userRoleLower = currentUser.role?.toLowerCase()?.trim();
        const requireRoleLower = requireRole?.toLowerCase()?.trim();
        
        // Check for admin roles
        const adminRoles = ['admin', 'platform_admin', 'auditor'];
        const isUserAdmin = userRoleLower && adminRoles.includes(userRoleLower);
        const isRequireAdmin = requireRoleLower && adminRoles.includes(requireRoleLower);
        
        // If both are admin roles, allow access
        if (isUserAdmin && isRequireAdmin) {
          console.log('✅ Admin role match (case-insensitive):', userRoleLower, 'matches', requireRoleLower);
          // Allow access
        } else if (userRoleLower !== requireRoleLower) {
          // Role doesn't match, redirect based on user role
          console.warn('⚠️ Role mismatch. User role:', currentUser.role, 'Required role:', requireRole);
          const currentPath = window.location.pathname;
          // Filter out POC, empty strings, and .html files
          const pathSegments = currentPath.split('/').filter(p => p && p !== 'POC' && !p.endsWith('.html'));
          const pagesIndex = pathSegments.indexOf('pages');
          const depth = pagesIndex >= 0 ? pathSegments.length - pagesIndex - 1 : 1;
          const basePath = depth > 0 ? '../'.repeat(depth) : '';
          
          if (isUserAdmin) {
            // Platform admin ALWAYS redirects to full Live Server URL
            const adminPath = 'http://127.0.0.1:5503/POC/pages/admin/index.html';
            console.log('🔄 Admin user accessing wrong page, redirecting to admin dashboard:', adminPath);
            window.location.href = adminPath;
          } else if (currentUser.role === 'entity' || currentUser.role === 'individual') {
            let dashboardPath = '/POC/pages/dashboard/index.html';
            if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES['dashboard']) {
              dashboardPath = window.NavRoutes.getRoute('dashboard', { useLiveServer: true });
            } else {
              dashboardPath = basePath + 'dashboard/';
            }
            window.location.href = dashboardPath;
          } else {
            let homePath = '/POC/pages/home/index.html';
            if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES['home']) {
              homePath = window.NavRoutes.getRoute('home', { useLiveServer: true });
            } else {
              homePath = basePath + 'home/';
            }
            window.location.href = homePath;
          }
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check feature access
   * @param {string} feature - Feature name to check
   * @returns {Promise<boolean>} - True if user has access
   */
  async function checkFeatureAccess(feature) {
    if (typeof PMTwinRBAC === 'undefined') {
      return true; // If RBAC not available, allow access
    }

    const hasAccess = await PMTwinRBAC.canCurrentUserSeeFeature(feature);
    if (!hasAccess) {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (currentUser) {
        const userRole = await PMTwinRBAC.getCurrentUserRole();
        const roleDef = await PMTwinRBAC.getRoleDefinition(userRole);
        const currentPath = window.location.pathname;
        // Filter out POC, empty strings, and .html files (like login.js does)
        const pathSegments = currentPath.split('/').filter(p => p && p !== 'POC' && !p.endsWith('.html'));
        const pagesIndex = pathSegments.indexOf('pages');
        const depth = pagesIndex >= 0 ? pathSegments.length - pagesIndex - 1 : 1;
        const basePath = depth > 0 ? '../'.repeat(depth) : '';
        
        if (roleDef && roleDef.portals.includes('user_portal')) {
          window.location.href = basePath + 'dashboard/';
        } else {
          window.location.href = basePath + 'home/';
        }
      } else {
        const currentPath = window.location.pathname;
        // Filter out POC, empty strings, and .html files (like login.js does)
        const pathSegments = currentPath.split('/').filter(p => p && p !== 'POC' && !p.endsWith('.html'));
        const pagesIndex = pathSegments.indexOf('pages');
        const depth = pagesIndex >= 0 ? pathSegments.length - pagesIndex - 1 : 1;
        const basePath = depth > 0 ? '../'.repeat(depth) : '';
        window.location.href = basePath + 'auth/login/';
      }
      return false;
    }

    return true;
  }

  /**
   * Get redirect URL after login
   * @returns {string|null} - Redirect URL or null
   */
  function getLoginRedirect() {
    const redirect = sessionStorage.getItem('loginRedirect');
    if (redirect) {
      sessionStorage.removeItem('loginRedirect');
      return redirect;
    }
    return null;
  }

  // Export
  window.AuthCheck = {
    checkAuth,
    checkFeatureAccess,
    getLoginRedirect
  };

})();

