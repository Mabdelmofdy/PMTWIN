/**
 * Route Guards - RBAC-based route access control
 * Blocks unauthorized route access and shows clear messages
 */

(function() {
  'use strict';

  /**
   * Check if user has access to a route
   * @param {string} routeKey - Route key (e.g., 'admin', 'opportunities/create')
   * @param {Object} user - Current user object
   * @returns {Object} { allowed: boolean, reason?: string }
   */
  async function checkRouteAccess(routeKey, user) {
    if (!user || !user.id) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    const userRole = user.role;
    
    // Admin routes
    if (routeKey.startsWith('admin') || routeKey === 'audit') {
      if (userRole !== 'platform_admin' && userRole !== 'auditor' && userRole !== 'admin') {
        return { 
          allowed: false, 
          reason: 'Admin access required. Only platform administrators and auditors can access this area.' 
        };
      }
      
      // Auditor is read-only
      if (userRole === 'auditor' && (routeKey.includes('vetting') || routeKey.includes('moderation'))) {
        return { 
          allowed: false, 
          reason: 'Auditors have read-only access. This action requires admin privileges.' 
        };
      }
    }

    // Create Opportunity route
    if (routeKey === 'opportunities/create' || routeKey === 'opportunities/create') {
      const allowedRoles = ['project_lead', 'supplier', 'service_provider', 'consultant'];
      if (!allowedRoles.includes(userRole)) {
        return { 
          allowed: false, 
          reason: 'Only project leads, suppliers, service providers, and consultants can create opportunities.' 
        };
      }
    }

    // Contracts route
    if (routeKey === 'contracts' || routeKey.startsWith('contracts/')) {
      const allowedRoles = ['project_lead', 'supplier', 'service_provider', 'consultant', 'professional', 'platform_admin', 'auditor'];
      if (!allowedRoles.includes(userRole)) {
        return { 
          allowed: false, 
          reason: 'You do not have access to view contracts.' 
        };
      }
    }

    // Proposals route
    if (routeKey === 'proposals' || routeKey.startsWith('proposals/')) {
      // Professional role may have conditional access
      if (userRole === 'professional') {
        // Check if professional has proposal access (could be conditional)
        // For now, allow access
      }
    }

    // Mentor role restrictions
    if (userRole === 'mentor') {
      // Mentors should only see mentorship-related routes
      if (routeKey !== 'dashboard' && routeKey !== 'collab-mentorship' && routeKey !== 'notifications' && routeKey !== 'profile') {
        return { 
          allowed: false, 
          reason: 'Mentors have access only to mentorship-related features.' 
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Guard a route - redirect if unauthorized
   * @param {string} routeKey - Route key
   * @param {Object} user - Current user object
   * @returns {boolean} True if access allowed, false if blocked
   */
  async function guardRoute(routeKey, user) {
    const access = await checkRouteAccess(routeKey, user);
    
    if (!access.allowed) {
      // Show error message
      const message = access.reason || 'You do not have permission to access this page.';
      
      // Create error modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
      modal.innerHTML = `
        <div class="card" style="max-width: 500px; margin: 2rem; background: white; border-radius: 12px; padding: 2rem;">
          <h2 style="margin-top: 0; color: var(--color-danger, #dc2626);">
            <i class="ph ph-lock"></i> Access Denied
          </h2>
          <p style="margin: 1rem 0; color: var(--text-primary);">${message}</p>
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button onclick="this.closest('.modal').remove(); window.history.back();" class="btn btn-secondary">
              Go Back
            </button>
            <a href="${typeof window.NavRoutes !== 'undefined' ? window.NavRoutes.getRoute('dashboard') : (window.location.port === '5503' || (window.location.hostname === '127.0.0.1' && window.location.port === '5503') ? 'http://127.0.0.1:5503/POC/pages/dashboard/index.html' : '/pages/dashboard/index.html')}" class="btn btn-primary">
              Go to Dashboard
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Redirect to dashboard after 5 seconds
      setTimeout(() => {
        if (typeof window.NavRoutes !== 'undefined') {
          window.location.href = window.NavRoutes.getRoute('dashboard');
        } else {
          // Fallback: check for Live Server and add /POC/ prefix
          const isLiveServer = window.location.port === '5503' || (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
          window.location.href = isLiveServer ? 'http://127.0.0.1:5503/POC/pages/dashboard/index.html' : '/pages/dashboard/index.html';
        }
      }, 5000);
      
      return false;
    }
    
    return true;
  }

  /**
   * Initialize route guards on page load
   */
  function initRouteGuards() {
    // Wait for DOM and data services
    if (typeof PMTwinData === 'undefined') {
      setTimeout(initRouteGuards, 100);
      return;
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      // Not logged in - let auth pages handle it
      return;
    }

    // Get current route from URL
    const path = window.location.pathname;
    let routeKey = null;

    // Map path to route key
    if (path.includes('/admin/')) {
      if (path.includes('/admin-vetting')) routeKey = 'admin-vetting';
      else if (path.includes('/admin-moderation')) routeKey = 'admin-moderation';
      else if (path.includes('/admin-audit')) routeKey = 'audit';
      else if (path.includes('/admin-reports')) routeKey = 'admin-reports';
      else routeKey = 'admin';
    } else if (path.includes('/opportunities/create')) {
      routeKey = 'opportunities/create';
    } else if (path.includes('/contracts')) {
      routeKey = 'contracts';
    } else if (path.includes('/proposals')) {
      routeKey = 'proposals';
    }

    // Guard the route if we identified it
    if (routeKey) {
      guardRoute(routeKey, currentUser).catch(error => {
        console.error('[RouteGuards] Error guarding route:', error);
      });
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouteGuards);
  } else {
    initRouteGuards();
  }

  // Export
  window.RouteGuards = {
    checkRouteAccess,
    guardRoute,
    initRouteGuards
  };

})();
