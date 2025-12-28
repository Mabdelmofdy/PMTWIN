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
    if (!PMTwinAuth.isAuthenticated()) {
      // Store intended destination
      if (redirectTo && redirectTo !== 'login.html') {
        sessionStorage.setItem('loginRedirect', redirectTo);
      }
      window.location.href = 'login.html';
      return false;
    }

    // Check role if required
    if (requireRole) {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (!currentUser) {
        window.location.href = 'login.html';
        return false;
      }

      // Check role using RBAC if available
      if (typeof PMTwinRBAC !== 'undefined') {
        const userRole = await PMTwinRBAC.getCurrentUserRole();
        if (userRole !== requireRole) {
          // Redirect based on user role
          const roleDef = await PMTwinRBAC.getRoleDefinition(userRole);
          if (roleDef && roleDef.portals.includes('user_portal')) {
            window.location.href = 'dashboard.html';
          } else {
            window.location.href = 'home.html';
          }
          return false;
        }
      } else if (currentUser.role !== requireRole) {
        // Fallback to direct role check
        if (currentUser.role === 'entity' || currentUser.role === 'individual') {
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'home.html';
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
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'home.html';
        }
      } else {
        window.location.href = 'login.html';
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

