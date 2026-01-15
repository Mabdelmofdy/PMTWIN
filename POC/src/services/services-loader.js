/**
 * Services Loader
 * Dynamically loads all service modules
 * This file should be included after PMTwinData and PMTwinAuth are loaded
 */

(function() {
  'use strict';

  // Calculate base path from script location
  // This script is always at: [POC_ROOT]/src/services/services-loader.js
  // We need to calculate relative path from current page to POC root
  function getBasePath() {
    // Use document.currentScript if available (most reliable)
    const currentScript = document.currentScript || (function() {
      const scripts = document.getElementsByTagName('script');
      for (let i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.includes('services-loader.js')) {
          return scripts[i];
        }
      }
      return null;
    })();
    
    if (currentScript && currentScript.src) {
      try {
        // Get the script's directory URL
        const scriptUrl = new URL(currentScript.src);
        // The script is at: [BASE]/src/services/services-loader.js
        // So POC root is 2 levels up from the script
        const scriptDir = scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/'));
        const pocRoot = scriptDir.split('/').slice(0, -2).join('/') || '/';
        
        // Get current page directory
        const pageUrl = new URL(window.location.href);
        const pageDir = pageUrl.pathname.substring(0, pageUrl.pathname.lastIndexOf('/')) || '/';
        
        // Calculate relative path from page to POC root
        if (pageDir === pocRoot || pageDir === '/') {
          return '';
        }
        
        // Count directory levels difference
        const pageSegments = pageDir.split('/').filter(p => p);
        const rootSegments = pocRoot.split('/').filter(p => p);
        const depth = pageSegments.length - rootSegments.length;
        
        return depth > 0 ? '../'.repeat(depth) : '';
      } catch (e) {
        console.warn('[ServicesLoader] Error calculating path from script:', e);
      }
    }
    
    // Fallback: calculate from page location
    const currentPath = window.location.pathname;
    // Remove index.html or trailing slash
    const cleanPath = currentPath.replace(/\/index\.html?$/i, '').replace(/\/$/, '') || '/';
    const segments = cleanPath.split('/').filter(p => p);
    const depth = segments.length;
    const basePath = depth > 0 ? '../'.repeat(depth) : '';
    
    // Debug logging
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      console.log('[ServicesLoader] Path calculation (fallback):', {
        pathname: currentPath,
        cleanPath: cleanPath,
        segments: segments,
        depth: depth,
        basePath: basePath
      });
    }
    
    return basePath;
  }

  const basePath = getBasePath();

  const services = [
    // Core RBAC service (must be loaded first)
    'src/services/rbac/role-service.js',
    
    // Business Logic Models (must load before services that use them)
    'src/business-logic/models/service-item-model.js',
    'src/business-logic/payment/barter-settlement.js',
    'src/business-logic/payment/hybrid-payment.js',
    
    // Feature services
    'src/services/auth/auth-service.js',
    'src/services/dashboard/dashboard-service.js',
    'src/services/projects/project-service.js',
    'src/services/proposals/proposal-versioning-service.js',
    'src/services/proposals/proposal-service.js',
    'src/domains/contracts/multi-party-contract-service.js',
    'src/services/matching/matching-service.js',
    'src/services/collaboration/collaboration-service.js',
    'src/services/marketplace/unified-marketplace-service.js',
    'src/core/matching/barter-matching-service.js',
    'src/services/service-providers/service-provider-service.js',
    'src/services/service-offerings/service-offering-service.js',
    'src/services/service-evaluations/service-evaluation-service.js',
    'src/services/notifications/notification-service.js',
    'src/services/admin/admin-service.js',
    
    // New Service Provider Domain Services
    'src/domains/services/service-providers/service-provider-service.js',
    'src/domains/services/service-requests/service-request-service.js',
    'src/domains/services/service-offers/service-offer-service.js',
    'src/domains/services/service-engagements/service-engagement-service.js'
  ];

  function loadService(servicePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // Prepend base path to service path
      script.src = basePath + servicePath;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${basePath + servicePath}`));
      document.head.appendChild(script);
    });
  }

  async function loadAllServices() {
    try {
      console.log('[ServicesLoader] Starting to load services...');
      for (const service of services) {
        await loadService(service);
      }
      console.log('[ServicesLoader] ✅ All services loaded successfully');
      console.log('[ServicesLoader] DashboardService available:', typeof DashboardService !== 'undefined');
      console.log('[ServicesLoader] PMTwinRBAC available:', typeof PMTwinRBAC !== 'undefined');
      console.log('[ServicesLoader] MatchingService available:', typeof MatchingService !== 'undefined');
      console.log('[ServicesLoader] CollaborationService available:', typeof CollaborationService !== 'undefined');
      console.log('[ServicesLoader] ServiceOfferingService available:', typeof ServiceOfferingService !== 'undefined');
      console.log('[ServicesLoader] ServiceProviderService available:', typeof ServiceProviderService !== 'undefined');
      console.log('[ServicesLoader] ServiceEvaluationService available:', typeof ServiceEvaluationService !== 'undefined');
      console.log('[ServicesLoader] ServiceItemModel available:', typeof ServiceItemModel !== 'undefined');
      console.log('[ServicesLoader] BarterSettlement available:', typeof BarterSettlement !== 'undefined');
      console.log('[ServicesLoader] HybridPayment available:', typeof HybridPayment !== 'undefined');
      console.log('[ServicesLoader] ProposalVersioning available:', typeof ProposalVersioning !== 'undefined');
      console.log('[ServicesLoader] MultiPartyContractService available:', typeof MultiPartyContractService !== 'undefined');
      console.log('[ServicesLoader] UnifiedMarketplaceService available:', typeof UnifiedMarketplaceService !== 'undefined');
      console.log('[ServicesLoader] BarterMatchingService available:', typeof BarterMatchingService !== 'undefined');
      
      // Initialize role assignments for existing users
      if (typeof PMTwinData !== 'undefined' && typeof PMTwinRBAC !== 'undefined') {
        initializeRoleAssignments();
      }
      
      // Dispatch event that services are loaded
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('servicesLoaded', { 
          detail: { 
            dashboardService: typeof DashboardService !== 'undefined',
            rbac: typeof PMTwinRBAC !== 'undefined',
            serviceOfferingService: typeof ServiceOfferingService !== 'undefined',
            serviceProviderService: typeof ServiceProviderService !== 'undefined',
            serviceEvaluationService: typeof ServiceEvaluationService !== 'undefined'
          } 
        }));
      }
    } catch (error) {
      console.error('[ServicesLoader] ❌ Error loading services:', error);
    }
  }

  async function initializeRoleAssignments() {
    // Ensure all existing users have roles assigned
    const users = PMTwinData.Users.getAll();
    const roleMapping = {
      'admin': 'admin',
      'entity': 'entity',
      'individual': 'individual'
    };

    for (const user of users) {
      const roleId = roleMapping[user.role] || 'individual';
      const existingRole = await PMTwinRBAC.getUserRole(user.id, user.email);
      
      if (!existingRole || existingRole === 'guest') {
        await PMTwinRBAC.assignRoleToUser(user.id, roleId, 'system', user.email);
        console.log(`✅ Assigned role ${roleId} to user ${user.email}`);
      }
    }
  }

  // Auto-load on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllServices);
  } else {
    loadAllServices();
  }

  // Export for manual loading if needed
  window.ServicesLoader = {
    loadAllServices,
    initializeRoleAssignments
  };

})();


