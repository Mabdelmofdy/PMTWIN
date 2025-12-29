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
      let loginPath = '../login/';
      if (currentPath.includes('/admin/')) {
        loginPath = '../login/';
      } else if (currentPath.includes('/dashboard/') || currentPath.includes('/projects/') || currentPath.includes('/proposals/')) {
        loginPath = '../login/';
      } else if (currentPath.includes('/login/')) {
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
        window.location.href = '../login/';
        return false;
      }

      // Check role using RBAC if available
      if (typeof PMTwinRBAC !== 'undefined') {
        const userRole = await PMTwinRBAC.getCurrentUserRole();
        if (userRole !== requireRole) {
          // Redirect based on user role
          const roleDef = await PMTwinRBAC.getRoleDefinition(userRole);
          if (roleDef && roleDef.portals.includes('user_portal')) {
            window.location.href = '../dashboard/';
          } else {
            window.location.href = '../home/';
          }
          return false;
        }
      } else if (currentUser.role !== requireRole) {
        // Fallback to direct role check
        if (currentUser.role === 'entity' || currentUser.role === 'individual') {
          window.location.href = '../dashboard/';
        } else {
          window.location.href = '../home/';
        }
        return false;
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
        if (roleDef && roleDef.portals.includes('user_portal')) {
          window.location.href = '../dashboard/';
        } else {
          window.location.href = '../home/';
        }
      } else {
        window.location.href = '../login/';
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

